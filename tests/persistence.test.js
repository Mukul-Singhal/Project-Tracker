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
  canMergeBranchNodeToCol,
  canStartBranchAtCol,
  removeBranchNodeData,
  removeBranchData,
  canAddStageShift,
  addStageShiftData,
  removeStageShiftsForNodeData,
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
  assert.deepEqual(toPlain(payload.variants), [{ external_id: 'v1', name: 'DOM Gas', display_order: 0 }]);
  assert.equal(payload.stages.length, 2);
  assert.equal(payload.stages[0].stage_context, 'plan');
  assert.equal(payload.stages[0].is_drs, true);
  assert.equal(payload.stages[0].drs_detail, 'DRS file available in SharePoint');
  assert.equal(payload.stages[1].stage_context, 'branch_plan');
  assert.deepEqual(toPlain(payload.mergeLinks), [{
    external_id: 'm1',
    branch_external_id: 'b1',
    source_stage_external_id: 'bp1',
    target_stage_external_id: 'p1',
    target_month: '',
    target_column_index: null,
  }]);
  assert.equal(JSON.parse(payload.project.milestone_table_json).cols[0], 'Milestone');
  assert.equal(JSON.parse(payload.project.layout_json).labelPositions['plan:v1'].x, 10);
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
      branch_external_id: 'b1',
      source_stage_external_id: 'bp1',
      target_stage_external_id: 'p1',
      target_month: '',
      target_column_index: null,
    },
    {
      external_id: 'm2',
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

  assert.equal(next.nid, 11);
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
  assert.deepEqual(toPlain(next.actualBranchNodes), [
    {
      id: 'ab-copy',
      sourcePlanNodeId: 'bp1',
      branchId: 'b1',
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

test('stage shift arrows use quadratic arch paths without replacing timeline line styling', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

  assert.match(source, /function addStageShiftArrow/);
  assert.match(source, /Q \$\{midX\} \$\{archY\}/);
  assert.match(source, /stage-shift-arrow-outline/);
  assert.match(source, /marker-end', `url\(#\$\{markerId\}\)`/);
  assert.match(source, /function mkLine/);
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
  });
  const second = persistence.addStageShiftData(first, {
    sourceNodeId: 'p1',
    sourceContext: 'plan',
    mode: 'postponed',
    targetDate: '2024-08',
    targetCol: 7,
  });

  assert.equal(second.nid, 22);
  assert.deepEqual(toPlain(second.stageShifts), [
    { id: 'i20', sourceNodeId: 'p1', sourceContext: 'plan', mode: 'preponed', targetDate: '2024-05', targetCol: 4 },
    { id: 'i21', sourceNodeId: 'p1', sourceContext: 'plan', mode: 'postponed', targetDate: '2024-08', targetCol: 7 },
  ]);
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
      { id: 's1', sourceNodeId: 'p1', sourceContext: 'plan', mode: 'preponed', targetDate: '2024-05', targetCol: 4 },
    ],
    leftTable: { cols: [], rows: [] },
    rightTable: { cols: [], rows: [] },
    years: [2024],
    eopDate: '',
  };

  const payload = persistence.createDataversePayload(state);

  assert.deepEqual(JSON.parse(payload.project.stage_shifts_json), state.stageShifts);
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
