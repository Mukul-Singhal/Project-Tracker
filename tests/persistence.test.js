const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadPersistenceFromApp() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const start = source.indexOf('function cloneState');
  const end = source.indexOf('async function saveDraftToDataverse');

  assert.notEqual(start, -1, 'Could not find persistence dependency start in app.js');
  assert.notEqual(end, -1, 'Could not find persistence dependency end in app.js');

  const persistenceSource = `${source.slice(start, end)}
module.exports = {
  stableStringify,
  cloneState,
  normalizeStateForPersistence,
  isDirty,
  createDataversePayload,
  createDataverseDelta,
  parseEopItems,
  copyPlanToActualData,
  isLastBranchNode,
  isLastBranchNodeForContext: typeof isLastBranchNodeForContext === 'function' ? isLastBranchNodeForContext : undefined,
  canMergeBranchNodeToCol,
  canMergeBranchNodeToColForContext: typeof canMergeBranchNodeToColForContext === 'function' ? canMergeBranchNodeToColForContext : undefined,
  canStartBranchAtCol,
  canStartBranchAtColForContext: typeof canStartBranchAtColForContext === 'function' ? canStartBranchAtColForContext : undefined,
  canPlaceBranchStageAtCol: typeof canPlaceBranchStageAtCol === 'function' ? canPlaceBranchStageAtCol : undefined,
  removeBranchNodeData,
  removeBranchData,
  removeActualBranchData: typeof removeActualBranchData === 'function' ? removeActualBranchData : undefined,
  canAddStageShift,
  addStageShiftData,
  removeStageShiftsForNodeData,
  getMilestoneTableRows: typeof getMilestoneTableRows === 'function' ? getMilestoneTableRows : undefined,
  getDiscussionPeriodCols: typeof getDiscussionPeriodCols === 'function' ? getDiscussionPeriodCols : undefined,
  getDiscussionPeriodClass: typeof getDiscussionPeriodClass === 'function' ? getDiscussionPeriodClass : undefined,
  dateToCol: typeof dateToCol === 'function' ? dateToCol : undefined,
  createStageNodeData: typeof createStageNodeData === 'function' ? createStageNodeData : undefined,
  updateStageNodeData: typeof updateStageNodeData === 'function' ? updateStageNodeData : undefined,
  fmtActualDate: typeof fmtActualDate === 'function' ? fmtActualDate : undefined,
  getPdfTimelineSlice: typeof getPdfTimelineSlice === 'function' ? getPdfTimelineSlice : undefined,
};`;

  const sandbox = {
    module: { exports: {} },
    console,
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  };

  vm.runInNewContext(persistenceSource, sandbox, { filename: 'app-persistence-slice.js' });
  return sandbox.module.exports;
}

const persistence = loadPersistenceFromApp();

function toPlain(value) {
  return JSON.parse(JSON.stringify(value));
}

test('stableStringify produces identical output for equivalent objects', () => {
  const left = { b: 2, a: { d: 4, c: 3 } };
  const right = { a: { c: 3, d: 4 }, b: 2 };

  assert.equal(persistence.stableStringify(left), persistence.stableStringify(right));
});

test('isDirty compares a draft against the last server baseline', () => {
  const baseline = { info: { project: 'Alpha' }, variants: [] };
  const draft = { info: { project: 'Alpha' }, variants: [{ id: 'v1', name: 'DOM Gas' }] };

  assert.equal(persistence.isDirty(baseline, baseline), false);
  assert.equal(persistence.isDirty(draft, baseline), true);
});

test('getDiscussionPeriodCols returns previous current and next discussion columns', () => {
  assert.deepEqual(toPlain(persistence.getDiscussionPeriodCols({ years: [2024, 2025], discussionDate: '2024-09' })), {
    prev: 7,
    current: 8,
    next: 9,
  });
});

test('getDiscussionPeriodCols clips discussion columns at visible year boundaries', () => {
  assert.deepEqual(toPlain(persistence.getDiscussionPeriodCols({ years: [2024, 2025], discussionDate: '2024-01' })), {
    prev: null,
    current: 0,
    next: 1,
  });
  assert.deepEqual(toPlain(persistence.getDiscussionPeriodCols({ years: [2024, 2025], discussionDate: '2025-12' })), {
    prev: 22,
    current: 23,
    next: null,
  });
});

test('getDiscussionPeriodClass identifies highlighted discussion columns', () => {
  const state = { years: [2024, 2025], discussionDate: '2024-09' };

  assert.equal(persistence.getDiscussionPeriodClass(7, state), 'discussion-prev');
  assert.equal(persistence.getDiscussionPeriodClass(8, state), 'discussion-current');
  assert.equal(persistence.getDiscussionPeriodClass(9, state), 'discussion-next');
  assert.equal(persistence.getDiscussionPeriodClass(10, state), '');
});

test('dateToCol accepts full dates by using the year and month portion', () => {
  const state = { years: [2024, 2025] };

  assert.equal(persistence.dateToCol('2024-07-19', state), 6);
  assert.equal(persistence.dateToCol('2025-01-01', state), 12);
  assert.equal(persistence.dateToCol('2024-07', state), 6);
  assert.equal(persistence.dateToCol('2024-13-01', state), -1);
});

test('createStageNodeData moves plan stages to selected month and keeps clicked month when date is blank', () => {
  const state = { years: [2024, 2025] };

  assert.deepEqual(toPlain(persistence.createStageNodeData(state, 'plan', 2, {
    type: 'square',
    topLabel: ' DA ',
    bottomLabel: 'Mid',
    date: '2025-03',
    isDRS: false,
    drsDetail: '',
  })), {
    ok: true,
    reason: '',
    node: {
      col: 14,
      type: 'square',
      topLabel: 'DA',
      bottomLabel: 'Mid',
      date: '2025-03',
      isDRS: false,
      drsDetail: '',
    },
  });

  assert.equal(persistence.createStageNodeData(state, 'plan', 2, { bottomLabel: 'Custom', date: '' }).node.col, 2);
  assert.equal(persistence.createStageNodeData(state, 'plan', 2, { bottomLabel: 'Custom', date: '' }).node.bottomLabel, '');
});

test('createStageNodeData requires actual full dates and stores actual stages in that month', () => {
  const state = { years: [2024, 2025] };

  assert.deepEqual(toPlain(persistence.createStageNodeData(state, 'actual', 2, {
    type: 'circle',
    topLabel: ' Built ',
    bottomLabel: 'Mid',
    date: '2025-04-27',
    isDRS: true,
    drsDetail: ' Actual DRS ',
  })), {
    ok: true,
    reason: '',
    node: {
      col: 15,
      type: 'circle',
      topLabel: 'Built',
      bottomLabel: '',
      date: '2025-04-27',
      isDRS: true,
      drsDetail: 'Actual DRS',
    },
  });
  assert.equal(persistence.createStageNodeData(state, 'actual', 2, { date: '' }).ok, false);
  assert.equal(persistence.createStageNodeData(state, 'actualBranch', 2, { date: '2025-04' }).ok, false);
});

test('canPlaceBranchStageAtCol blocks branch stages before the branch start month', () => {
  const state = {
    years: [2024, 2025],
    branches: [
      { id: 'br1', sourceCol: 5 },
      { id: 'br2', sourceDate: '2025-02' },
      { id: 'legacy' },
    ],
    actualBranches: [
      { id: 'abr1', sourceCol: 8 },
      { id: 'abr2', sourceDate: '2025-03-18' },
    ],
  };

  assert.equal(persistence.canPlaceBranchStageAtCol(state, 'branch', 'br1', 4).ok, false);
  assert.equal(persistence.canPlaceBranchStageAtCol(state, 'branch', 'br1', 5).ok, true);
  assert.equal(persistence.canPlaceBranchStageAtCol(state, 'branch', 'br1', 6).ok, true);
  assert.equal(persistence.canPlaceBranchStageAtCol(state, 'branch', 'br2', 12).ok, false);
  assert.equal(persistence.canPlaceBranchStageAtCol(state, 'branch', 'br2', 13).ok, true);
  assert.equal(persistence.canPlaceBranchStageAtCol(state, 'actualBranch', 'abr1', 7).ok, false);
  assert.equal(persistence.canPlaceBranchStageAtCol(state, 'actualBranch', 'abr1', 8).ok, true);
  assert.equal(persistence.canPlaceBranchStageAtCol(state, 'actualBranch', 'abr2', 13).ok, false);
  assert.equal(persistence.canPlaceBranchStageAtCol(state, 'actualBranch', 'abr2', 14).ok, true);
  assert.equal(persistence.canPlaceBranchStageAtCol(state, 'branch', 'legacy', 0).ok, true);
});

test('branch stage create and edit helpers reject placement before the branch start', () => {
  const state = {
    years: [2024, 2025],
    branches: [{ id: 'br1', sourceCol: 5 }],
    actualBranches: [{ id: 'abr1', sourceDate: '2024-08' }],
    branchNodes: [{ id: 'bn1', branchId: 'br1', col: 6, type: 'square', topLabel: 'Old', bottomLabel: 'Beg', date: '2024-07' }],
    actualBranchNodes: [{ id: 'abn1', branchId: 'abr1', col: 8, type: 'square', topLabel: 'Old', bottomLabel: '', date: '2024-09-01' }],
  };

  assert.equal(persistence.createStageNodeData(state, 'branch', 4, { bottomLabel: 'Beg', date: '' }, 'br1').ok, false);
  assert.equal(persistence.createStageNodeData(state, 'branch', 5, { bottomLabel: 'Beg', date: '' }, 'br1').ok, true);
  assert.equal(persistence.updateStageNodeData(state, 'branch', 'bn1', { date: '2024-05' }).ok, false);
  assert.equal(persistence.updateStageNodeData(state, 'branch', 'bn1', { date: '2024-06' }).ok, true);
  assert.equal(persistence.updateStageNodeData(state, 'actualBranch', 'abn1', { date: '2024-07-15' }).ok, false);
  assert.equal(persistence.updateStageNodeData(state, 'actualBranch', 'abn1', { date: '2024-08-15' }).ok, true);
});

test('updateStageNodeData edits the correct stage collection and recalculates the date column', () => {
  const state = {
    years: [2024, 2025],
    planNodes: [{ id: 'p1', variantId: 'v1', col: 1, type: 'square', topLabel: 'Old', bottomLabel: 'Beg', date: '' }],
    actualNodes: [{ id: 'a1', variantId: 'v1', col: 1, type: 'square', topLabel: 'Old', bottomLabel: '', date: '2024-02-01' }],
    branchNodes: [{ id: 'b1', branchId: 'br1', col: 1, type: 'square', topLabel: 'Old', bottomLabel: 'End', date: '' }],
    actualBranchNodes: [{ id: 'ab1', branchId: 'abr1', col: 1, type: 'square', topLabel: 'Old', bottomLabel: '', date: '2024-02-01' }],
  };

  const planNext = persistence.updateStageNodeData(state, 'plan', 'p1', { topLabel: 'New', bottomLabel: 'End', date: '2025-06' });
  assert.equal(planNext.planNodes[0].col, 17);
  assert.equal(planNext.planNodes[0].bottomLabel, 'End');
  assert.deepEqual(toPlain(planNext.actualNodes), state.actualNodes);

  const actualNext = persistence.updateStageNodeData(state, 'actualBranch', 'ab1', { topLabel: 'Done', date: '2025-07-15' });
  assert.equal(actualNext.actualBranchNodes[0].col, 18);
  assert.equal(actualNext.actualBranchNodes[0].date, '2025-07-15');
  assert.equal(actualNext.actualBranchNodes[0].bottomLabel, '');
});

test('fmtActualDate shows actual stage dates as day and month', () => {
  assert.equal(persistence.fmtActualDate('2025-04-27'), '27 Apr');
});

test('createDataversePayload maps state into simple Dataverse entity groups', () => {
  const state = {
    projectId: 'local-1',
    info: { project: 'Alpha', location: 'SMG', plant: 'Plant-C', type: 'MC', status: 'Delayed', published: true },
    variants: [{ id: 'v1', name: 'DOM Gas' }],
    planNodes: [{ id: 'p1', variantId: 'v1', col: 5, type: 'square', topLabel: 'DA', bottomLabel: '', date: '2024-06', isDRS: true, drsDetail: 'DRS file available in SharePoint' }],
    actualNodes: [],
    branches: [{ id: 'b1', variantId: 'v1', parentNodeId: 'p1', label: 'Gas branch' }],
    branchNodes: [{ id: 'bp1', branchId: 'b1', col: 6, type: 'circle', topLabel: 'Trial', bottomLabel: '', date: '2024-07' }],
    actualBranchNodes: [],
    mergeLinks: [{ id: 'm1', fromNodeId: 'bp1', fromBranchId: 'b1', toNodeId: 'p1' }],
    leftTable: { cols: ['Milestone'], rows: [['DA']] },
    rightTable: { cols: ['Model Detail', 'Date- month/year'], rows: [['EOP', '2024-12']] },
    remarks: 'Review monthly',
    years: [2024, 2025],
    eopDate: '2024-12',
    labelPositions: { 'plan:v1': { x: 10, y: 20 } },
    remarkPosition: { x: 30, y: 40 },
    nid: 99
  };

  const payload = persistence.createDataversePayload(state);

  assert.equal(payload.project.name, 'Alpha');
  assert.equal(payload.project.published, true);
  assert.equal(payload.project.discussion_period_date, '');
  assert.deepEqual(toPlain(payload.variants), [{ external_id: 'v1', name: 'DOM Gas', display_order: 0 }]);
  assert.equal(payload.stages.length, 2);
  assert.equal(payload.stages[0].stage_context, 'plan');
  assert.equal(payload.stages[0].is_drs, true);
  assert.equal(payload.stages[0].drs_detail, 'DRS file available in SharePoint');
  assert.equal(payload.stages[1].stage_context, 'branch_plan');
  assert.deepEqual(toPlain(payload.mergeLinks), [{
    external_id: 'm1',
    merge_context: 'plan',
    branch_external_id: 'b1',
    source_stage_external_id: 'bp1',
    target_stage_external_id: 'p1',
    target_month: '',
    target_column_index: null,
  }]);
  assert.equal(JSON.parse(payload.project.milestone_table_json).cols[0], 'Milestone');
  assert.equal(JSON.parse(payload.project.layout_json).labelPositions['plan:v1'].x, 10);
});

test('createDataversePayload includes discussion period date', () => {
  const payload = persistence.createDataversePayload({
    projectId: 'local-1',
    info: { project: 'Alpha' },
    variants: [],
    planNodes: [],
    actualNodes: [],
    branches: [],
    branchNodes: [],
    actualBranchNodes: [],
    mergeLinks: [],
    stageShifts: [],
    leftTable: { cols: [], rows: [] },
    rightTable: { cols: [], rows: [] },
    years: [2024, 2025],
    eopDate: '',
    eopItems: [],
    discussionDate: '2024-09',
  });

  assert.equal(payload.project.discussion_period_date, '2024-09');
});

test('parseEopItems returns ordered EOP markers from multiple table rows', () => {
  const state = {
    years: [2024, 2025],
    rightTable: {
      cols: ['Model Detail', 'Date- month/year', 'Second date'],
      rows: [
        ['DOM Gas', '2024-12', ''],
        ['DOM CNG', 'Jan 2025', '02/2025'],
      ],
    },
  };

  assert.deepEqual(toPlain(persistence.parseEopItems(state)), [
    { id: 'eop-0-1', label: 'DOM Gas', date: '2024-12', col: 11, rowIndex: 0, colIndex: 1 },
    { id: 'eop-1-1', label: 'DOM CNG', date: '2025-01', col: 12, rowIndex: 1, colIndex: 1 },
    { id: 'eop-1-2', label: 'DOM CNG', date: '2025-02', col: 13, rowIndex: 1, colIndex: 2 },
  ]);
});

test('createDataversePayload preserves primary EOP date and serializes all EOP markers', () => {
  const state = {
    projectId: 'local-1',
    info: { project: 'Alpha' },
    variants: [],
    planNodes: [],
    actualNodes: [],
    branches: [],
    branchNodes: [],
    actualBranchNodes: [],
    mergeLinks: [],
    leftTable: { cols: [], rows: [] },
    rightTable: { cols: ['Model Detail', 'Date- month/year'], rows: [['DOM Gas', '2024-12'], ['DOM CNG', '2025-01']] },
    years: [2024, 2025],
    eopDate: '2024-12',
    eopItems: [
      { id: 'eop-0-1', label: 'DOM Gas', date: '2024-12', col: 11, rowIndex: 0, colIndex: 1 },
      { id: 'eop-1-1', label: 'DOM CNG', date: '2025-01', col: 12, rowIndex: 1, colIndex: 1 },
    ],
  };

  const payload = persistence.createDataversePayload(state);

  assert.equal(payload.project.eop_date, '2024-12');
  assert.deepEqual(JSON.parse(payload.project.eop_dates_json), state.eopItems);
});

test('createDataversePayload serializes merge links with stage and month-anchor targets', () => {
  const state = {
    projectId: 'local-1',
    info: { project: 'Alpha' },
    variants: [{ id: 'v1', name: 'DOM Gas' }],
    planNodes: [{ id: 'p1', variantId: 'v1', col: 5, type: 'square', topLabel: 'DA', date: '2024-06' }],
    actualNodes: [],
    branches: [{ id: 'b1', variantId: 'v1', parentNodeId: 'p1', sourceNodeId: 'p1', sourceCol: 5, sourceDate: '2024-06', label: 'Gas branch' }],
    branchNodes: [{ id: 'bp1', branchId: 'b1', col: 6, type: 'circle', topLabel: 'Trial', date: '2024-07' }],
    actualBranchNodes: [],
    mergeLinks: [
      { id: 'm1', fromNodeId: 'bp1', fromBranchId: 'b1', toNodeId: 'p1' },
      { id: 'm2', fromNodeId: 'bp1', fromBranchId: 'b1', toCol: 9, toDate: '2024-10' },
    ],
    leftTable: { cols: [], rows: [] },
    rightTable: { cols: [], rows: [] },
    years: [2024],
    eopDate: '',
    eopItems: [],
  };

  const payload = persistence.createDataversePayload(state);

  assert.deepEqual(toPlain(payload.mergeLinks), [
    {
      external_id: 'm1',
      merge_context: 'plan',
      branch_external_id: 'b1',
      source_stage_external_id: 'bp1',
      target_stage_external_id: 'p1',
      target_month: '',
      target_column_index: null,
    },
    {
      external_id: 'm2',
      merge_context: 'plan',
      branch_external_id: 'b1',
      source_stage_external_id: 'bp1',
      target_stage_external_id: '',
      target_month: '2024-10',
      target_column_index: 9,
    },
  ]);
});

test('copyPlanToActualData overwrites copied nodes and preserves manual actual nodes', () => {
  const state = {
    nid: 10,
    branches: [{ id: 'b1', variantId: 'v1', parentNodeId: 'p1', label: 'Gas branch' }],
    planNodes: [
      { id: 'p1', variantId: 'v1', col: 5, type: 'square', topLabel: 'DA', bottomLabel: '', date: '2024-06', isDRS: true, drsDetail: 'Plan DRS' },
      { id: 'p2', variantId: 'v1', col: 9, type: 'circle', topLabel: 'SOS', bottomLabel: '', date: '2024-10', isDRS: false, drsDetail: '' },
    ],
    branchNodes: [
      { id: 'bp1', branchId: 'b1', col: 7, type: 'square', topLabel: 'Trial', bottomLabel: '', date: '2024-08' },
    ],
    actualNodes: [
      { id: 'a-manual', variantId: 'v1', col: 4, type: 'square', topLabel: 'Manual', bottomLabel: '', date: '2024-05' },
      { id: 'a-copy', sourcePlanNodeId: 'p1', variantId: 'v1', col: 1, type: 'circle', topLabel: 'Old', bottomLabel: '', date: '2024-02' },
      { id: 'a-stale-copy', sourcePlanNodeId: 'missing-plan', variantId: 'v1', col: 3, type: 'square', topLabel: 'Keep stale', bottomLabel: '', date: '2024-04' },
    ],
    actualBranchNodes: [
      { id: 'ab-copy', sourcePlanNodeId: 'bp1', branchId: 'b1', col: 1, type: 'circle', topLabel: 'Old branch', bottomLabel: '', date: '2024-02' },
    ],
  };

  const next = persistence.copyPlanToActualData(state);

  assert.equal(next.nid, 12);
  assert.equal(next.actualNodes.length, 4);
  assert.deepEqual(toPlain(next.actualNodes.find(n => n.id === 'a-manual')), state.actualNodes[0]);
  assert.deepEqual(toPlain(next.actualNodes.find(n => n.id === 'a-stale-copy')), state.actualNodes[2]);
  assert.deepEqual(toPlain(next.actualNodes.find(n => n.id === 'a-copy')), {
    id: 'a-copy',
    sourcePlanNodeId: 'p1',
    variantId: 'v1',
    col: 5,
    type: 'square',
    topLabel: 'DA',
    bottomLabel: '',
    date: '2024-06',
    isDRS: true,
    drsDetail: 'Plan DRS',
  });
  assert.equal(next.actualNodes.find(n => n.sourcePlanNodeId === 'p2').id, 'i10');
  assert.deepEqual(toPlain(next.actualBranches), [
    {
      id: 'i11',
      sourcePlanBranchId: 'b1',
      variantId: 'v1',
      parentNodeId: 'p1',
      sourceNodeId: 'p1',
      sourceDate: '',
      label: 'Gas branch',
    },
  ]);
  assert.deepEqual(toPlain(next.actualBranchNodes), [
    {
      id: 'ab-copy',
      sourcePlanNodeId: 'bp1',
      branchId: 'i11',
      col: 7,
      type: 'square',
      topLabel: 'Trial',
      bottomLabel: '',
      date: '2024-08',
      isDRS: false,
      drsDetail: '',
    },
  ]);
});

test('copyPlanToActualData copies plan branches into actual branches and preserves manual actual branches', () => {
  const state = {
    nid: 30,
    planNodes: [{ id: 'p1', variantId: 'v1', col: 4, type: 'square', topLabel: 'DA', bottomLabel: '', date: '2024-05' }],
    actualNodes: [],
    branches: [{ id: 'br1', variantId: 'v1', parentNodeId: 'p1', sourceNodeId: 'p1', sourceCol: 4, sourceDate: '2024-05', label: 'Plan branch' }],
    branchNodes: [{ id: 'bn1', branchId: 'br1', col: 6, type: 'circle', topLabel: 'Trial', bottomLabel: '', date: '2024-07' }],
    actualBranches: [
      { id: 'abr-manual', variantId: 'v1', sourceCol: 7, sourceDate: '2024-08', label: 'Manual actual' },
      { id: 'abr-old-copy', sourcePlanBranchId: 'missing', variantId: 'v1', sourceCol: 2, sourceDate: '2024-03', label: 'Old copy' },
    ],
    actualBranchNodes: [
      { id: 'abn-manual', branchId: 'abr-manual', col: 8, type: 'square', topLabel: 'Manual', bottomLabel: '', date: '2024-09' },
      { id: 'abn-old-copy', sourcePlanNodeId: 'missing-node', branchId: 'abr-old-copy', col: 3, type: 'square', topLabel: 'Old', bottomLabel: '', date: '2024-04' },
    ],
    actualMergeLinks: [{ id: 'aml-manual', fromNodeId: 'abn-manual', fromBranchId: 'abr-manual', toCol: 10 }],
  };

  const next = persistence.copyPlanToActualData(state);

  assert.deepEqual(toPlain(next.actualBranches), [
    { id: 'abr-manual', variantId: 'v1', sourceCol: 7, sourceDate: '2024-08', label: 'Manual actual' },
    {
      id: 'i31',
      sourcePlanBranchId: 'br1',
      variantId: 'v1',
      parentNodeId: 'p1',
      sourceNodeId: 'p1',
      sourceCol: 4,
      sourceDate: '2024-05',
      label: 'Plan branch',
    },
  ]);
  assert.deepEqual(toPlain(next.actualBranchNodes), [
    { id: 'abn-manual', branchId: 'abr-manual', col: 8, type: 'square', topLabel: 'Manual', bottomLabel: '', date: '2024-09' },
    {
      id: 'i32',
      sourcePlanNodeId: 'bn1',
      branchId: 'i31',
      col: 6,
      type: 'circle',
      topLabel: 'Trial',
      bottomLabel: '',
      date: '2024-07',
      isDRS: false,
      drsDetail: '',
    },
  ]);
  assert.deepEqual(toPlain(next.actualMergeLinks), [{ id: 'aml-manual', fromNodeId: 'abn-manual', fromBranchId: 'abr-manual', toCol: 10 }]);
  assert.equal(next.nid, 33);
});

test('isLastBranchNode only allows merge from the final branch stage', () => {
  const state = {
    branchNodes: [
      { id: 'b1', branchId: 'br1', col: 6 },
      { id: 'b2', branchId: 'br1', col: 9 },
      { id: 'b3', branchId: 'br1', col: 9 },
    ],
  };

  assert.equal(persistence.isLastBranchNode(state.branchNodes[0], state), false);
  assert.equal(persistence.isLastBranchNode(state.branchNodes[1], state), false);
  assert.equal(persistence.isLastBranchNode(state.branchNodes[2], state), true);
});

test('canStartBranchAtCol only allows branches from or after the variant initial stage', () => {
  const state = {
    planNodes: [
      { id: 'p1', variantId: 'v1', col: 4 },
      { id: 'p2', variantId: 'v1', col: 9 },
      { id: 'p3', variantId: 'v2', col: 7 },
    ],
  };

  assert.equal(persistence.canStartBranchAtCol(state, 'v1', 3), false);
  assert.equal(persistence.canStartBranchAtCol(state, 'v1', 4), true);
  assert.equal(persistence.canStartBranchAtCol(state, 'v1', 8), true);
  assert.equal(persistence.canStartBranchAtCol(state, 'missing', 8), false);
});

test('canStartBranchAtColForContext supports actual branch starts from actual stages', () => {
  const state = {
    planNodes: [{ id: 'p1', variantId: 'v1', col: 4 }],
    actualNodes: [
      { id: 'a1', variantId: 'v1', col: 6 },
      { id: 'a2', variantId: 'v1', col: 10 },
    ],
  };

  assert.equal(persistence.canStartBranchAtColForContext(state, 'actual', 'v1', 5), false);
  assert.equal(persistence.canStartBranchAtColForContext(state, 'actual', 'v1', 6), true);
  assert.equal(persistence.canStartBranchAtColForContext(state, 'actual', 'v1', 9), true);
  assert.equal(persistence.canStartBranchAtColForContext(state, 'plan', 'v1', 4), true);
});

test('canMergeBranchNodeToCol allows the last branch stage to merge to any month', () => {
  const state = {
    branches: [{ id: 'br1', variantId: 'v1', sourceCol: 4, sourceDate: '2024-05' }],
    planNodes: [
      { id: 'p1', variantId: 'v1', col: 4, date: '2024-05' },
      { id: 'p2', variantId: 'v1', col: 12, date: '2025-01' },
    ],
    branchNodes: [
      { id: 'b1', branchId: 'br1', col: 6 },
      { id: 'b2', branchId: 'br1', col: 8 },
    ],
  };

  assert.equal(persistence.canMergeBranchNodeToCol(state.branchNodes[0], 9, state).ok, false);
  assert.equal(persistence.canMergeBranchNodeToCol(state.branchNodes[1], 7, state).ok, true);
  assert.equal(persistence.canMergeBranchNodeToCol(state.branchNodes[1], 12, state).ok, true);
  assert.equal(persistence.canMergeBranchNodeToCol(state.branchNodes[1], 16, state).ok, true);
  assert.equal(persistence.canMergeBranchNodeToCol(state.branchNodes[1], 10, state).ok, true);
});

test('actual branch merge validation uses actual branch nodes', () => {
  const state = {
    actualBranches: [{ id: 'abr1', variantId: 'v1', sourceCol: 6, sourceDate: '2024-07' }],
    actualBranchNodes: [
      { id: 'ab1', branchId: 'abr1', col: 7 },
      { id: 'ab2', branchId: 'abr1', col: 9 },
    ],
  };

  assert.equal(persistence.isLastBranchNodeForContext(state.actualBranchNodes[0], state, 'actualBranch'), false);
  assert.equal(persistence.isLastBranchNodeForContext(state.actualBranchNodes[1], state, 'actualBranch'), true);
  assert.equal(persistence.canMergeBranchNodeToColForContext(state.actualBranchNodes[0], 10, state, 'actualBranch').ok, false);
  assert.equal(persistence.canMergeBranchNodeToColForContext(state.actualBranchNodes[1], 10, state, 'actualBranch').ok, true);
});

test('removeBranchData deletes branch rows and all related branch data', () => {
  const state = {
    branches: [
      { id: 'br1', variantId: 'v1', label: 'Delete me' },
      { id: 'br2', variantId: 'v1', label: 'Keep me' },
    ],
    branchNodes: [
      { id: 'bn1', branchId: 'br1', col: 6 },
      { id: 'bn2', branchId: 'br2', col: 7 },
    ],
    actualBranchNodes: [
      { id: 'abn1', branchId: 'br1', col: 6 },
      { id: 'abn2', branchId: 'br2', col: 7 },
    ],
    mergeLinks: [
      { id: 'ml1', fromNodeId: 'bn1', fromBranchId: 'br1', toCol: 10 },
      { id: 'ml2', fromNodeId: 'bn2', fromBranchId: 'br2', toCol: 11 },
    ],
    stageShifts: [
      { id: 'ss1', sourceNodeId: 'bn1', sourceContext: 'branch', mode: 'postponed', targetCol: 9 },
      { id: 'ss2', sourceNodeId: 'abn1', sourceContext: 'actualBranch', mode: 'preponed', targetCol: 5 },
      { id: 'ss3', sourceNodeId: 'bn2', sourceContext: 'branch', mode: 'postponed', targetCol: 10 },
    ],
  };

  assert.deepEqual(toPlain(persistence.removeBranchData(state, 'br1')), {
    branches: [{ id: 'br2', variantId: 'v1', label: 'Keep me' }],
    branchNodes: [{ id: 'bn2', branchId: 'br2', col: 7 }],
    actualBranchNodes: [{ id: 'abn2', branchId: 'br2', col: 7 }],
    mergeLinks: [{ id: 'ml2', fromNodeId: 'bn2', fromBranchId: 'br2', toCol: 11 }],
    stageShifts: [{ id: 'ss3', sourceNodeId: 'bn2', sourceContext: 'branch', mode: 'postponed', targetCol: 10 }],
  });
});

test('removeActualBranchData deletes only actual branch data and related shifts', () => {
  const state = {
    branches: [{ id: 'br1', variantId: 'v1', label: 'Plan branch' }],
    branchNodes: [{ id: 'bn1', branchId: 'br1', col: 6 }],
    mergeLinks: [{ id: 'ml1', fromNodeId: 'bn1', fromBranchId: 'br1', toCol: 9 }],
    actualBranches: [
      { id: 'abr1', variantId: 'v1', label: 'Delete actual' },
      { id: 'abr2', variantId: 'v1', label: 'Keep actual' },
    ],
    actualBranchNodes: [
      { id: 'abn1', branchId: 'abr1', col: 6 },
      { id: 'abn2', branchId: 'abr2', col: 7 },
    ],
    actualMergeLinks: [
      { id: 'aml1', fromNodeId: 'abn1', fromBranchId: 'abr1', toCol: 10 },
      { id: 'aml2', fromNodeId: 'abn2', fromBranchId: 'abr2', toCol: 11 },
    ],
    stageShifts: [
      { id: 'ss1', sourceNodeId: 'abn1', sourceContext: 'actualBranch', mode: 'postponed', targetCol: 9 },
      { id: 'ss2', sourceNodeId: 'bn1', sourceContext: 'branch', mode: 'postponed', targetCol: 9 },
    ],
  };

  assert.deepEqual(toPlain(persistence.removeActualBranchData(state, 'abr1')), {
    actualBranches: [{ id: 'abr2', variantId: 'v1', label: 'Keep actual' }],
    actualBranchNodes: [{ id: 'abn2', branchId: 'abr2', col: 7 }],
    actualMergeLinks: [{ id: 'aml2', fromNodeId: 'abn2', fromBranchId: 'abr2', toCol: 11 }],
    stageShifts: [{ id: 'ss2', sourceNodeId: 'bn1', sourceContext: 'branch', mode: 'postponed', targetCol: 9 }],
  });
});

test('stage shift arrows use quadratic arch paths without replacing timeline line styling', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

  assert.match(source, /function addStageShiftArrow/);
  assert.match(source, /function addStageShiftConnectorLine/);
  assert.match(source, /Q \$\{midX\} \$\{archY\}/);
  assert.match(source, /stage-shift-arrow-outline/);
  assert.match(source, /stage-shift-normal-line/);
  assert.match(source, /marker-end', `url\(#\$\{markerId\}\)`/);
  assert.match(source, /function mkLine/);
});

test('branch source connector renders even before the branch has stages', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

  assert.match(source, /function getBranchLaneAnchorPoint/);
  assert.match(source, /const to = firstChild \? getBranchNodeCenter\(firstChild, state\) : getBranchLaneAnchorPoint\(br, state\)/);
});

test('merge back connector is a plain orthogonal line without an arrow marker', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const start = source.indexOf('function addMergeBackPath');
  const end = source.indexOf('function addStageShiftConnectorLine');

  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const fn = source.slice(start, end);
  assert.match(fn, /M \$\{from\.x\} \$\{from\.y\} L \$\{to\.x\} \$\{from\.y\} L \$\{to\.x\} \$\{to\.y\}/);
  assert.equal(fn.includes('marker-end'), false);
});

test('getMilestoneTableRows returns filled milestone rows for grid rendering', () => {
  const rows = persistence.getMilestoneTableRows({
    leftTable: {
      cols: ['Milestone', 'DOM Gas', 'DOM CNG'],
      rows: [
        ['DA', 'Done', ''],
        ['', '', ''],
        ['SOS', '', 'Oct'],
      ],
    },
  });

  assert.deepEqual(toPlain(rows), {
    cols: ['Milestone', 'DOM Gas', 'DOM CNG'],
    rows: [
      ['DA', 'Done', ''],
      ['SOS', '', 'Oct'],
    ],
  });
});

test('removeBranchNodeData removes the branch row when the last branch stage is deleted', () => {
  const state = {
    branches: [{ id: 'br1', variantId: 'v1', label: 'Branch' }],
    branchNodes: [{ id: 'bn1', branchId: 'br1', col: 6 }],
    actualBranchNodes: [{ id: 'abn1', branchId: 'br1', col: 6 }],
    mergeLinks: [{ id: 'ml1', fromNodeId: 'bn1', fromBranchId: 'br1', toCol: 10 }],
  };

  assert.deepEqual(toPlain(persistence.removeBranchNodeData(state, 'bn1')), {
    branches: [],
    branchNodes: [],
    actualBranchNodes: [],
    mergeLinks: [],
    stageShifts: [],
  });
});

test('removeBranchNodeData keeps the branch row when other branch stages remain', () => {
  const state = {
    branches: [{ id: 'br1', variantId: 'v1', label: 'Branch' }],
    branchNodes: [{ id: 'bn1', branchId: 'br1', col: 6 }, { id: 'bn2', branchId: 'br1', col: 8 }],
    actualBranchNodes: [{ id: 'abn1', branchId: 'br1', col: 6 }],
    mergeLinks: [{ id: 'ml1', fromNodeId: 'bn1', fromBranchId: 'br1', toCol: 10 }],
  };

  assert.deepEqual(toPlain(persistence.removeBranchNodeData(state, 'bn1')), {
    branches: state.branches,
    branchNodes: [{ id: 'bn2', branchId: 'br1', col: 8 }],
    actualBranchNodes: state.actualBranchNodes,
    mergeLinks: [],
    stageShifts: [],
  });
});

test('stage nodes do not render the old DRS badge markup', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

  assert.equal(source.includes('node-drs-badge'), false);
});

test('canAddStageShift validates preponed before and postponed after the source stage', () => {
  const node = { id: 'p1', col: 6 };

  assert.equal(persistence.canAddStageShift(node, 'preponed', 5).ok, true);
  assert.equal(persistence.canAddStageShift(node, 'preponed', 6).ok, false);
  assert.equal(persistence.canAddStageShift(node, 'postponed', 7).ok, true);
  assert.equal(persistence.canAddStageShift(node, 'postponed', 6).ok, false);
});

test('addStageShiftData allows multiple shifts for one source stage', () => {
  const state = { nid: 20, stageShifts: [] };
  const first = persistence.addStageShiftData(state, {
    sourceNodeId: 'p1',
    sourceContext: 'plan',
    mode: 'preponed',
    targetDate: '2024-05',
    targetCol: 4,
    drsDetail: '  Preponed DRS ready  ',
  });
  const second = persistence.addStageShiftData(first, {
    sourceNodeId: 'p1',
    sourceContext: 'plan',
    mode: 'postponed',
    targetDate: '2024-08',
    targetCol: 7,
    drsDetail: 'Postponed DRS ready',
  });

  assert.equal(second.nid, 22);
  assert.deepEqual(toPlain(second.stageShifts), [
    { id: 'i20', sourceNodeId: 'p1', sourceContext: 'plan', mode: 'preponed', targetDate: '2024-05', targetCol: 4, drsDetail: 'Preponed DRS ready' },
    { id: 'i21', sourceNodeId: 'p1', sourceContext: 'plan', mode: 'postponed', targetDate: '2024-08', targetCol: 7, drsDetail: 'Postponed DRS ready' },
  ]);
});

test('stage shift modal requires DRS detail and shifted DRS labels use shift-specific positions', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

  assert.match(source, /id="f_shift_drs_detail"/);
  assert.match(source, /const drsDetail = \$\('f_shift_drs_detail'\)\.value\.trim\(\)/);
  assert.match(source, /Enter DRS Details for the shifted stage\./);
  assert.match(source, /drsDetail,/);
  assert.match(source, /function addShiftDrsDetailLabel/);
  assert.match(source, /shift-drs:\$\{shift\.id\}/);
});

test('grid DRS and remark labels wrap full text instead of truncating it', () => {
  const style = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
  const drsStart = style.indexOf('.drs-detail-label');
  const drsEnd = style.indexOf('[data-theme="dark"] .eop-label');
  const remarkStart = style.indexOf('.canvas-remark');
  const remarkEnd = style.indexOf('[data-theme="dark"] .canvas-remark');

  assert.notEqual(drsStart, -1);
  assert.notEqual(drsEnd, -1);
  assert.notEqual(remarkStart, -1);
  assert.notEqual(remarkEnd, -1);
  const drsCss = style.slice(drsStart, drsEnd);
  const remarkCss = style.slice(remarkStart, remarkEnd);

  assert.match(drsCss, /white-space:\s*normal/);
  assert.match(drsCss, /overflow-wrap:\s*anywhere/);
  assert.doesNotMatch(drsCss, /text-overflow:\s*ellipsis/);
  assert.doesNotMatch(drsCss, /overflow:\s*hidden/);
  assert.match(remarkCss, /white-space:\s*normal/);
  assert.match(remarkCss, /overflow-wrap:\s*anywhere/);
});

test('branch row cells before the branch start are disabled and placement is validated in UI paths', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

  assert.match(source, /branch-stage-disabled/);
  assert.match(source, /canPlaceBranchStageAtCol\(state, rType, branchId, col\)/);
  assert.match(source, /canPlaceBranchStageAtCol\(store\.getState\(\), rType, branchId, newCol\)/);
});

test('getPdfTimelineSlice returns one squeezed month-aligned readable viewport', () => {
  const slice = persistence.getPdfTimelineSlice({
    totalCols: 36,
    colWidth: 52,
    timelineWidthPx: 700,
    horizontalScale: 0.8,
  });

  assert.deepEqual(toPlain(slice), {
    startCol: 0,
    endCol: 16,
    startX: 0,
    width: 665.6,
    exportColWidth: 41.6,
    horizontalScale: 0.8,
  });
  assert.equal(slice.width / slice.exportColWidth, 16);
  assert.ok(slice.width <= 700);
});

test('PDF export builds one timeline-only root and no longer captures the full app', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const start = source.indexOf('async function exportPDF');
  const end = source.indexOf('// ════════════════════════════════════════════════════════════════', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const fn = source.slice(start, end);

  assert.match(source, /function buildPdfExportRoot/);
  assert.match(source, /function getPdfTimelineSlice/);
  assert.match(source, /PDF_EXPORT_HORIZONTAL_SCALE = 0\.8/);
  assert.match(source, /pdf-export-root/);
  assert.match(source, /scaleX\(\$\{horizontalScale\}\)/);
  assert.match(fn, /buildPdfExportRoot\(/);
  assert.match(fn, /horizontalScale: PDF_EXPORT_HORIZONTAL_SCALE/);
  assert.match(fn, /html2canvas\(pageRoot/);
  assert.match(fn, /Rendering timeline table/);
  assert.doesNotMatch(fn, /pdf\.addPage/);
  assert.doesNotMatch(fn, /for \(let i = 0; i < slices\.length; i\+\+\)/);
  assert.doesNotMatch(fn, /document\.querySelector\('\.app'\)/);
  assert.doesNotMatch(fn, /html2canvas\(app/);
  assert.doesNotMatch(fn, /model-header/);
  assert.doesNotMatch(fn, /bottom-section/);
});

test('stage popup uses Plan bottom label options and switches date input type by context', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

  assert.match(html, /<select id="npBottom"/);
  assert.match(html, /<option value="Beg">Beg<\/option>/);
  assert.match(html, /<option value="Mid">Mid<\/option>/);
  assert.match(html, /<option value="End">End<\/option>/);
  assert.match(source, /\$\('npDate'\)\.type = isActualStageContext\(rType\) \? 'date' : 'month'/);
  assert.match(source, /Enter the actual date\./);
});

test('stage rendering hides plan dates and formats actual dates below the node', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

  assert.match(source, /const dh = isActualStageContext\(rType\) && n\.date \? `<span class="node-date">\$\{fmtActualDate\(n\.date\)\}<\/span>` : ''/);
});

test('normal stage mouseup opens the edit modal while shifted stage copies stay non-editable', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

  assert.match(source, /function openStageEditModal/);
  assert.match(source, /openStageEditModal\(node, rType\)/);
  assert.match(source, /function mkShiftedNode/);
  assert.doesNotMatch(source.slice(source.indexOf('function mkShiftedNode'), source.indexOf('function renderBottomTables')), /openStageEditModal/);
});

test('removeStageShiftsForNodeData removes shifts for a deleted source stage', () => {
  const state = {
    stageShifts: [
      { id: 's1', sourceNodeId: 'p1', sourceContext: 'plan', mode: 'preponed', targetCol: 4 },
      { id: 's2', sourceNodeId: 'p2', sourceContext: 'plan', mode: 'postponed', targetCol: 8 },
    ],
  };

  assert.deepEqual(toPlain(persistence.removeStageShiftsForNodeData(state, 'p1')), {
    stageShifts: [{ id: 's2', sourceNodeId: 'p2', sourceContext: 'plan', mode: 'postponed', targetCol: 8 }],
  });
});

test('createDataversePayload serializes stage shifts', () => {
  const state = {
    projectId: 'local-1',
    info: { project: 'Alpha' },
    variants: [],
    planNodes: [],
    actualNodes: [],
    branches: [],
    branchNodes: [],
    actualBranchNodes: [],
    mergeLinks: [],
    stageShifts: [
      { id: 's1', sourceNodeId: 'p1', sourceContext: 'plan', mode: 'preponed', targetDate: '2024-05', targetCol: 4, drsDetail: 'Shift DRS ready' },
    ],
    leftTable: { cols: [], rows: [] },
    rightTable: { cols: [], rows: [] },
    years: [2024],
    eopDate: '',
  };

  const payload = persistence.createDataversePayload(state);

  assert.deepEqual(JSON.parse(payload.project.stage_shifts_json), state.stageShifts);
});

test('createDataversePayload serializes plan and actual branch contexts and merge contexts', () => {
  const state = {
    projectId: 'local-1',
    info: { project: 'Alpha' },
    variants: [{ id: 'v1', name: 'DOM Gas' }],
    planNodes: [],
    actualNodes: [],
    branches: [{ id: 'br1', variantId: 'v1', label: 'Plan branch', sourceCol: 4, sourceDate: '2024-05' }],
    actualBranches: [{ id: 'abr1', variantId: 'v1', label: 'Actual branch', sourceCol: 6, sourceDate: '2024-07' }],
    branchNodes: [{ id: 'bn1', branchId: 'br1', col: 5 }],
    actualBranchNodes: [{ id: 'abn1', branchId: 'abr1', col: 7 }],
    mergeLinks: [{ id: 'ml1', fromNodeId: 'bn1', fromBranchId: 'br1', toCol: 8, toDate: '2024-09' }],
    actualMergeLinks: [{ id: 'aml1', fromNodeId: 'abn1', fromBranchId: 'abr1', toCol: 9, toDate: '2024-10' }],
    stageShifts: [],
    leftTable: { cols: [], rows: [] },
    rightTable: { cols: [], rows: [] },
    years: [2024],
    eopDate: '',
  };

  const payload = persistence.createDataversePayload(state);

  assert.deepEqual(toPlain(payload.branches), [
    {
      external_id: 'br1',
      branch_context: 'plan',
      variant_external_id: 'v1',
      parent_stage_external_id: '',
      source_stage_external_id: '',
      source_month: '2024-05',
      source_column_index: 4,
      source_plan_branch_external_id: '',
      label: 'Plan branch',
      display_order: 0,
    },
    {
      external_id: 'abr1',
      branch_context: 'actual',
      variant_external_id: 'v1',
      parent_stage_external_id: '',
      source_stage_external_id: '',
      source_month: '2024-07',
      source_column_index: 6,
      source_plan_branch_external_id: '',
      label: 'Actual branch',
      display_order: 0,
    },
  ]);
  assert.deepEqual(toPlain(payload.mergeLinks), [
    {
      external_id: 'ml1',
      merge_context: 'plan',
      branch_external_id: 'br1',
      source_stage_external_id: 'bn1',
      target_stage_external_id: '',
      target_month: '2024-09',
      target_column_index: 8,
    },
    {
      external_id: 'aml1',
      merge_context: 'actual',
      branch_external_id: 'abr1',
      source_stage_external_id: 'abn1',
      target_stage_external_id: '',
      target_month: '2024-10',
      target_column_index: 9,
    },
  ]);
});

test('createDataverseDelta reports changed Dataverse entity groups', () => {
  const baseline = {
    info: { project: 'Alpha', published: false },
    variants: [{ id: 'v1', name: 'DOM Gas' }],
    planNodes: [],
    actualNodes: [],
    branches: [],
    branchNodes: [],
    actualBranchNodes: [],
    mergeLinks: [],
    leftTable: { cols: [], rows: [] },
    rightTable: { cols: [], rows: [] },
    years: [2024],
    labelPositions: {},
    remarks: '',
    eopDate: ''
  };
  const draft = {
    ...baseline,
    info: { project: 'Alpha', published: true },
    variants: [{ id: 'v1', name: 'DOM Gas' }, { id: 'v2', name: 'DOM CNG' }]
  };

  const delta = persistence.createDataverseDelta(draft, baseline);

  assert.deepEqual(toPlain(delta.changedGroups.sort()), ['project', 'variants']);
  assert.equal(delta.hasChanges, true);
});
