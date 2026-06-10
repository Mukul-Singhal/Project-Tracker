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

  const persistenceSource = `const COL = 52, ROH = 90;
const TIMELINE_VERSION_CURRENT = 'current';
const TIMELINE_VERSION_PREFIX = 'cutoff:';
${source.slice(start, end)}
module.exports = {
  STAGE_ICONS,
  stableStringify,
  cloneState,
  normalizeDiscussionDate,
  getDiscussionMonth,
  fmtDiscussionDateLabel,
  getDiscussionCutoffEndTime,
  normalizeDiscussionCutoffDates,
  normalizeSubmitVersions,
  resolveSubmitVersionForCutoff,
  buildTimelineVersionOptions,
  createSubmitVersionRecord,
  mergeSubmitVersions,
  makeTimelineVersionValue,
  parseTimelineVersionValue,
  getDefaultStageIconId,
  normalizeStageIconId,
  getStageVisualMarkup,
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
  colToInputMonth: typeof colToInputMonth === 'function' ? colToInputMonth : undefined,
  colToInputDate: typeof colToInputDate === 'function' ? colToInputDate : undefined,
  getMovedStageDate: typeof getMovedStageDate === 'function' ? getMovedStageDate : undefined,
  moveStageNodeToCol: typeof moveStageNodeToCol === 'function' ? moveStageNodeToCol : undefined,
  getInputDateFromToday: typeof getInputDateFromToday === 'function' ? getInputDateFromToday : undefined,
  getNextMonthInputMonth: typeof getNextMonthInputMonth === 'function' ? getNextMonthInputMonth : undefined,
  isActualDateInFuture: typeof isActualDateInFuture === 'function' ? isActualDateInFuture : undefined,
  getFutureActualBlankSpaceCol: typeof getFutureActualBlankSpaceCol === 'function' ? getFutureActualBlankSpaceCol : undefined,
  getFutureActualBlankSpacePoint: typeof getFutureActualBlankSpacePoint === 'function' ? getFutureActualBlankSpacePoint : undefined,
  getTimelineInLaneOverlays: typeof getTimelineInLaneOverlays === 'function' ? getTimelineInLaneOverlays : undefined,
  getTimelineLaneOverlayH: typeof getTimelineLaneOverlayH === 'function' ? getTimelineLaneOverlayH : undefined,
  getPlanLaneGeometry: typeof getPlanLaneGeometry === 'function' ? getPlanLaneGeometry : undefined,
  getActualLaneGeometry: typeof getActualLaneGeometry === 'function' ? getActualLaneGeometry : undefined,
  getPlannedH: typeof getPlannedH === 'function' ? getPlannedH : undefined,
  getActualH: typeof getActualH === 'function' ? getActualH : undefined,
  getGridGroupH: typeof getGridGroupH === 'function' ? getGridGroupH : undefined,
  getStageSlotRatio: typeof getStageSlotRatio === 'function' ? getStageSlotRatio : undefined,
  getStageVisualX: typeof getStageVisualX === 'function' ? getStageVisualX : undefined,
  removeBranchNodeData,
  removeBranchData,
  removeActualBranchData: typeof removeActualBranchData === 'function' ? removeActualBranchData : undefined,
  canAddStageShift,
  addStageShiftData,
  removeStageShiftsForNodeData,
  getMilestoneTableRows: typeof getMilestoneTableRows === 'function' ? getMilestoneTableRows : undefined,
  getRemarkSummaryItems: typeof getRemarkSummaryItems === 'function' ? getRemarkSummaryItems : undefined,
  collectDrsSummaryItems: typeof collectDrsSummaryItems === 'function' ? collectDrsSummaryItems : undefined,
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

test('discussion period helpers accept full cutoff dates and format labels', () => {
  assert.equal(persistence.normalizeDiscussionDate('2024-06-20'), '2024-06-20');
  assert.equal(persistence.normalizeDiscussionDate('2024-06'), '2024-06');
  assert.equal(persistence.normalizeDiscussionDate('06-2024'), '');
  assert.equal(persistence.getDiscussionMonth('2024-06-20'), '2024-06');
  assert.equal(persistence.fmtDiscussionDateLabel('2024-06-20'), '20 Jun 2024');
  assert.equal(persistence.fmtDiscussionDateLabel('2024-06'), 'Jun 2024');
  assert.deepEqual(toPlain(persistence.getDiscussionPeriodCols({
    years: [2024, 2025],
    discussionDate: '2024-06-20',
  })), {
    prev: 4,
    current: 5,
    next: 6,
  });
});

test('cutoff snapshots resolve to the latest submit before the cutoff end of day', () => {
  const versions = [
    { id: 'early', submittedAt: '2024-06-01T12:00:00Z', discussionDate: '2024-06-20' },
    { id: 'latest-before', submittedAt: '2024-06-20T12:00:00Z', discussionDate: '2024-06-20' },
    { id: 'after-cutoff', submittedAt: '2024-06-21T12:00:00Z', discussionDate: '2024-07-27' },
  ];

  assert.equal(persistence.resolveSubmitVersionForCutoff(versions, '2024-06-20').id, 'latest-before');
  assert.equal(persistence.resolveSubmitVersionForCutoff(versions, '2024-06-19').id, 'early');
  assert.equal(persistence.resolveSubmitVersionForCutoff(versions, '2024-05-31'), null);
});

test('timeline version options expose current and disable cutoffs without submitted versions', () => {
  const versions = [
    { id: 'june-submit', submittedAt: '2024-06-20T12:00:00Z', discussionDate: '2024-06-20' },
  ];

  const options = persistence.buildTimelineVersionOptions(['2024-06-20', '2024-05-20'], versions);

  assert.equal(options[0].value, 'current');
  assert.equal(options[1].value, 'cutoff:2024-06-20');
  assert.equal(options[1].label, '20 Jun 2024');
  assert.equal(options[1].disabled, false);
  assert.equal(options[1].versionId, 'june-submit');
  assert.equal(options[2].value, 'cutoff:2024-05-20');
  assert.equal(options[2].disabled, true);
  assert.equal(persistence.parseTimelineVersionValue(options[1].value), '2024-06-20');
});

test('dateToCol accepts full dates by using the year and month portion', () => {
  const state = { years: [2024, 2025] };

  assert.equal(persistence.dateToCol('2024-07-19', state), 6);
  assert.equal(persistence.dateToCol('2025-01-01', state), 12);
  assert.equal(persistence.dateToCol('2024-07', state), 6);
  assert.equal(persistence.dateToCol('2024-13-01', state), -1);
});

test('column input date helpers return picker-friendly month and date values', () => {
  const state = { years: [2024, 2025] };

  assert.equal(persistence.colToInputMonth(6, state), '2024-07');
  assert.equal(persistence.colToInputMonth(24, state), '2026-01');
  assert.equal(persistence.colToInputDate(6, state), '2024-07-01');
  assert.equal(persistence.colToInputMonth(-1, state), '');
});

test('future actual helpers reject future dates and find next-month blank space', () => {
  const today = new Date('2026-05-29T12:00:00');

  assert.equal(persistence.getInputDateFromToday(today), '2026-05-29');
  assert.equal(persistence.getNextMonthInputMonth(today), '2026-06');
  assert.equal(persistence.getNextMonthInputMonth(new Date('2026-12-15T12:00:00')), '2027-01');
  assert.equal(persistence.isActualDateInFuture('2026-05-30', today), true);
  assert.equal(persistence.isActualDateInFuture('2026-05-29', today), false);
  assert.equal(persistence.isActualDateInFuture('2026-05-28', today), false);
  assert.equal(persistence.getFutureActualBlankSpaceCol({ years: [2025, 2026] }, today), 17);
  assert.equal(persistence.getFutureActualBlankSpaceCol({ years: [2025] }, today), 17);
  assert.deepEqual(toPlain(persistence.getFutureActualBlankSpacePoint({
    years: [2025, 2026],
    variants: [{ id: 'v1' }],
    branches: [],
    actualBranches: [],
  }, today, 18)), { x: 910, y: 157 });
});

test('timeline in-lane summaries grow owning lane without moving stage band', () => {
  const base = {
    years: [2024],
    variants: [{ id: 'v1', name: 'Main' }],
    branches: [],
    actualBranches: [],
    planNodes: [],
    actualNodes: [],
    branchNodes: [],
    actualBranchNodes: [],
    stageShifts: [],
    leftTable: { cols: ['Milestone'], rows: [['DA']] },
    milestoneTableVisible: false,
    remarks: '',
    eopDate: '',
    eopItems: [],
  };
  const withOverlay = { ...base, remarks: 'Keep this visible inside the grid.' };

  assert.equal(persistence.getGridGroupH(base), 184);
  assert.equal(persistence.getTimelineInLaneOverlays(base).length, 0);
  assert.equal(persistence.getTimelineLaneOverlayH(withOverlay, 'plan:v1'), 190);
  assert.equal(persistence.getPlannedH(withOverlay), 280);
  assert.equal(persistence.getActualH(withOverlay), 90);
  assert.equal(persistence.getGridGroupH(withOverlay), 374);

  const basePlan = persistence.getPlanLaneGeometry(base, 'plan', 'v1');
  const overlayPlan = persistence.getPlanLaneGeometry(withOverlay, 'plan', 'v1');
  assert.equal(basePlan.stageY, 45);
  assert.equal(overlayPlan.stageY, 45);
  assert.equal(overlayPlan.height, 280);
});

test('stage visual x helper maps bottom labels and spreads duplicate stages', () => {
  const state = {
    planNodes: [
      { id: 'beg', variantId: 'v1', col: 0, bottomLabel: 'Beg' },
      { id: 'mid', variantId: 'v1', col: 0, bottomLabel: 'Mid' },
      { id: 'end', variantId: 'v1', col: 0, bottomLabel: 'End' },
      { id: 'legacy', variantId: 'v1', col: 1, bottomLabel: 'Custom' },
      { id: 'm1', variantId: 'v2', col: 0, bottomLabel: 'Mid' },
      { id: 'm2', variantId: 'v2', col: 0, bottomLabel: 'Mid' },
      { id: 'm3', variantId: 'v2', col: 0, bottomLabel: 'Mid' },
    ],
    branchNodes: [],
    actualNodes: [
      { id: 'a1', variantId: 'v1', col: 2 },
      { id: 'a2', variantId: 'v1', col: 2 },
    ],
    actualBranchNodes: [],
  };

  assert.equal(persistence.getStageVisualX(state.planNodes[0], 'plan', state), 14);
  assert.equal(persistence.getStageVisualX(state.planNodes[1], 'plan', state), 26);
  assert.equal(persistence.getStageVisualX(state.planNodes[2], 'plan', state), 38);
  assert.equal(persistence.getStageVisualX(state.planNodes[3], 'plan', state), 78);
  assert.deepEqual(state.planNodes.slice(4).map(n => persistence.getStageVisualX(n, 'plan', state)), [20, 26, 32]);
  assert.deepEqual(state.actualNodes.map(n => persistence.getStageVisualX(n, 'actual', state)), [127, 133]);
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

test('stage logo configuration accepts SVG icon ids and falls back safely', () => {
  const state = { years: [2024, 2025] };
  const iconId = persistence.STAGE_ICONS[2].id;

  assert.equal(persistence.STAGE_ICONS.length, 11);
  assert.equal(persistence.getDefaultStageIconId(), persistence.STAGE_ICONS[0].id);
  assert.equal(persistence.normalizeStageIconId(iconId), iconId);
  assert.equal(persistence.normalizeStageIconId('missing-logo'), persistence.STAGE_ICONS[0].id);
  assert.equal(persistence.normalizeStageIconId('circle'), 'circle');

  const created = persistence.createStageNodeData(state, 'plan', 2, {
    type: iconId,
    topLabel: 'Logo',
    bottomLabel: 'Mid',
    date: '2024-04',
  });
  assert.equal(created.ok, true);
  assert.equal(created.node.type, iconId);

  const fallback = persistence.createStageNodeData(state, 'plan', 2, { type: 'missing-logo', date: '' });
  assert.equal(fallback.node.type, persistence.STAGE_ICONS[0].id);
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
  assert.equal(persistence.createStageNodeData({ years: [2024, 2999] }, 'actual', 2, { date: '2999-01-01' }).reason, 'Actual date cannot be in the future.');
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

test('moveStageNodeToCol updates plan stage dates to the moved month', () => {
  const state = { years: [2024, 2025] };
  const movedPlan = persistence.moveStageNodeToCol(
    { id: 'p1', col: 1, date: '2024-02', bottomLabel: 'Mid' },
    'plan',
    14,
    state
  );
  const movedBranch = persistence.moveStageNodeToCol(
    { id: 'b1', col: 2, date: '2024-03', bottomLabel: 'End' },
    'branch',
    17,
    state
  );

  assert.equal(movedPlan.col, 14);
  assert.equal(movedPlan.date, '2025-03');
  assert.equal(movedPlan.bottomLabel, 'Mid');
  assert.equal(movedBranch.date, '2025-06');
});

test('moveStageNodeToCol updates actual dates while preserving or clamping the day', () => {
  const state = { years: [2024, 2025] };
  const movedActual = persistence.moveStageNodeToCol(
    { id: 'a1', col: 0, date: '2024-01-27' },
    'actual',
    15,
    state
  );
  const clampedActualBranch = persistence.moveStageNodeToCol(
    { id: 'ab1', col: 7, date: '2024-08-31' },
    'actualBranch',
    13,
    state
  );

  assert.equal(movedActual.col, 15);
  assert.equal(movedActual.date, '2025-04-27');
  assert.equal(clampedActualBranch.col, 13);
  assert.equal(clampedActualBranch.date, '2025-02-28');
});

test('fmtActualDate shows actual stage dates as day and month', () => {
  assert.equal(persistence.fmtActualDate('2025-04-27'), '27 Apr');
});

test('createDataversePayload maps state into simple Dataverse entity groups', () => {
  const iconId = persistence.STAGE_ICONS[1].id;
  const state = {
    projectId: 'local-1',
    info: { project: 'Alpha', location: 'SMG', plant: 'Plant-C', type: 'MC', status: 'Delayed', published: true },
    variants: [{ id: 'v1', name: 'DOM Gas' }],
    planNodes: [{ id: 'p1', variantId: 'v1', col: 5, type: iconId, topLabel: 'DA', bottomLabel: '', date: '2024-06', isDRS: true, drsDetail: 'DRS file available in SharePoint' }],
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
  assert.equal(payload.stages[0].shape, iconId);
  assert.equal(payload.stages[0].is_drs, true);
  assert.equal(payload.stages[0].drs_detail, 'DRS file available in SharePoint');
  assert.equal(payload.stages[1].stage_context, 'branch_plan');
  assert.equal(payload.stages[1].shape, 'circle');
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

test('createDataversePayload includes full discussion cutoff dates', () => {
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
    discussionDate: '2024-06-20',
  });

  assert.equal(payload.project.discussion_period_date, '2024-06-20');
});

test('createSubmitVersionRecord preserves submitted state and Dataverse payload', () => {
  const state = {
    projectId: 'local-1',
    info: { project: 'Alpha', published: true },
    variants: [{ id: 'v1', name: 'DOM Gas' }],
    planNodes: [{ id: 'p1', variantId: 'v1', col: 5, type: persistence.STAGE_ICONS[0].id, topLabel: 'DA', date: '2024-06' }],
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
    discussionDate: '2024-06-20',
  };
  const payload = persistence.createDataversePayload(state);
  const version = persistence.createSubmitVersionRecord(state, payload, '2024-06-20T12:00:00Z', 'submit-june');

  assert.equal(version.id, 'submit-june');
  assert.equal(version.submittedAt, '2024-06-20T12:00:00Z');
  assert.equal(version.discussionDate, '2024-06-20');
  assert.equal(version.state.planNodes[0].id, 'p1');
  assert.equal(version.payload.project.discussion_period_date, '2024-06-20');
});

test('mergeSubmitVersions accepts immutable submit versions and replaces by id', () => {
  const existing = [{ id: 'same', submittedAt: '2024-06-01T12:00:00Z', discussionDate: '2024-06-20', state: { value: 1 } }];
  const next = { id: 'same', submittedAt: '2024-06-02T12:00:00Z', discussionDate: '2024-06-20', state: { value: 2 } };

  assert.deepEqual(toPlain(persistence.mergeSubmitVersions(existing, next)), [next]);
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

test('parseEopItems defaults detail-only EOP rows to the month after today', () => {
  const state = {
    years: [2026],
    rightTable: {
      cols: ['Model Detail', 'Date- month/year'],
      rows: [
        ['DOM Gas', ''],
        ['DOM CNG', ''],
      ],
    },
  };

  assert.deepEqual(toPlain(persistence.parseEopItems(state, new Date('2026-05-29T00:00:00'))), [
    { id: 'eop-0-inferred', label: 'DOM Gas', date: '2026-06', col: 5, rowIndex: 0, colIndex: 1 },
    { id: 'eop-1-inferred', label: 'DOM CNG', date: '2026-06', col: 5, rowIndex: 1, colIndex: 1 },
  ]);
});

test('parseEopItems keeps dated EOP rows preferred over inferred dates', () => {
  const state = {
    years: [2026],
    rightTable: {
      cols: ['Model Detail', 'Date- month/year'],
      rows: [
        ['DOM Gas', '2026-04'],
        ['DOM CNG', ''],
      ],
    },
  };

  assert.deepEqual(toPlain(persistence.parseEopItems(state, new Date('2026-05-29T00:00:00'))), [
    { id: 'eop-0-1', label: 'DOM Gas', date: '2026-04', col: 3, rowIndex: 0, colIndex: 1 },
    { id: 'eop-1-inferred', label: 'DOM CNG', date: '2026-06', col: 5, rowIndex: 1, colIndex: 1 },
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

test('canMergeBranchNodeToCol only allows the last branch stage to merge after its month', () => {
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
  assert.equal(persistence.canMergeBranchNodeToCol(state.branchNodes[1], 7, state).ok, false);
  assert.equal(persistence.canMergeBranchNodeToCol(state.branchNodes[1], 8, state).ok, false);
  assert.equal(persistence.canMergeBranchNodeToCol(state.branchNodes[1], 9, state).ok, true);
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
  assert.equal(persistence.canMergeBranchNodeToColForContext(state.actualBranchNodes[1], 8, state, 'actualBranch').ok, false);
  assert.equal(persistence.canMergeBranchNodeToColForContext(state.actualBranchNodes[1], 9, state, 'actualBranch').ok, false);
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
  assert.match(source, /function addBranchStartPath/);
  assert.match(source, /addBranchStartPath\(svg, from, to, 'branch-start-arrow', 'branchStartArrow'\)/);
  assert.match(source, /addBranchStartPath\(svg, from, to, 'actual-branch-start-arrow', 'actualBranchStartArrow'\)/);
});

test('branch start connector stays aligned to the source month column', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const start = source.indexOf('function addBranchStartPath');
  const end = source.indexOf('function addMergeBackPath', start);

  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const fn = source.slice(start, end);
  assert.match(fn, /M \$\{from\.x\} \$\{from\.y\} L \$\{from\.x\} \$\{to\.y\} L \$\{to\.x\} \$\{to\.y\}/);
  assert.doesNotMatch(fn, /elbowX|routeOffset|getBranchStartRouteOffset/);
});

test('timeline rendering uses visual stage x positions and source-anchored branch labels', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const style = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');

  assert.match(source, /function getStageVisualX/);
  assert.match(source, /const x = getStageVisualX\(n, 'plan', state\)/);
  assert.match(source, /const x = getStageVisualX\(n, 'branch', state\)/);
  assert.match(source, /const x = getStageVisualX\(n, 'actual', state\)/);
  assert.match(source, /const x = getStageVisualX\(n, 'actualBranch', state\)/);
  assert.match(source, /return \{ x: getStageVisualX\(node, 'plan', state\)/);
  assert.match(source, /const sourceCol = getBranchStartCol\(state, rType, branchId\)/);
  assert.match(source, /const sourceX = sourceCol \* COL \+ COL \/ 2/);
  assert.match(source, /pill\.style\.left = `\$\{leftOfLine >= 4 \? leftOfLine : sourceX \+ 10\}px`/);
  assert.match(style, /\.sr-cell\.proj\s*\{[^}]*align-items:\s*center[^}]*justify-content:\s*center[^}]*text-align:\s*center/s);
});

test('timeline in-lane summaries replace floating label and table overlay positions', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

  assert.match(source, /function getTimelineInLaneOverlays/);
  assert.match(source, /function getPlanLaneGeometry/);
  assert.match(source, /function getActualLaneGeometry/);
  assert.match(source, /function renderTimelineInLaneSummaries/);
  assert.match(source, /className = 'timeline-inlane-overlays'/);
  assert.match(source, /renderTimelineInLaneSummaries\(sr, state, geom && geom\.key\)/);
  assert.doesNotMatch(source, /timeline-overlay-zone/);
  assert.doesNotMatch(source, /renderCanvasRemarks\(state\)/);
  assert.doesNotMatch(source, /renderMilestoneTableOverlay\(state\)/);
  assert.doesNotMatch(source, /renderDrsSummaryBox\(grp, state\)/);
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

test('stage nodes use configurable SVG logo rendering with legacy fallback', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const markup = persistence.getStageVisualMarkup(persistence.STAGE_ICONS[0].id, 'test-node');
  const legacyMarkup = persistence.getStageVisualMarkup('square', 'legacy-node');

  assert.match(source, /const STAGE_ICONS = \[/);
  assert.match(source, /function setupStageIconPicker/);
  assert.match(source, /getStageVisualMarkup\(n\.type, `node-\$\{n\.id\}`\)/);
  assert.match(source, /getStageVisualMarkup\(source\.type, `shift-\$\{shift\.id\}`\)/);
  assert.match(markup, /<svg/);
  assert.match(markup, /stage-icon-node/);
  assert.match(markup, /paint0_linear_526_2297-test-node/);
  assert.match(legacyMarkup, /legacy-node-shape square/);
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

test('stage shift modal requires DRS detail and shifted DRS details feed the summary box', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

  assert.match(source, /id="f_shift_drs_detail"/);
  assert.match(source, /const drsDetail = \$\('f_shift_drs_detail'\)\.value\.trim\(\)/);
  assert.match(source, /Enter DRS Details for the shifted stage\./);
  assert.match(source, /drsDetail,/);
  assert.match(source, /state\.stageShifts \|\| \[\]/);
  assert.match(source, /const source = findStageByContext\(state, shift\.sourceContext, shift\.sourceNodeId\)/);
  assert.match(source, /Preponed Shift/);
  assert.match(source, /Postponed Shift/);
});

test('timeline summary boxes wrap full text instead of truncating it', () => {
  const style = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
  const summaryStart = style.indexOf('.timeline-summary-box');
  const summaryEnd = style.indexOf('/* ── MILESTONE TABLE IN-LANE ITEM');
  const drsStart = style.indexOf('.drs-summary-box');

  assert.notEqual(summaryStart, -1);
  assert.notEqual(summaryEnd, -1);
  assert.notEqual(drsStart, -1);
  const summaryCss = style.slice(summaryStart, summaryEnd);

  assert.match(summaryCss, /white-space:\s*normal/);
  assert.match(summaryCss, /overflow-wrap:\s*anywhere/);
  assert.match(summaryCss, /\.timeline-summary-list li/);
  assert.match(summaryCss, /\.drs-summary-box/);
  assert.doesNotMatch(summaryCss, /text-overflow:\s*ellipsis/);
  assert.doesNotMatch(summaryCss, /overflow:\s*hidden/);
});

test('remarks and DRS details render as cumulative numbered summary boxes', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

  assert.match(source, /function getRemarkSummaryItems/);
  assert.match(source, /function collectDrsSummaryItems/);
  assert.match(source, /function makeTimelineSummaryBox/);
  assert.match(source, /makeTimelineSummaryBox\(overlay\.title, overlay\.items, overlay\.className\)/);
  assert.match(source, /function renderTimelineInLaneSummaries/);
  assert.match(source, /className = 'timeline-inlane-overlays'/);
  assert.doesNotMatch(source, /addDrsDetailLabel\(grp/);
  assert.doesNotMatch(source, /addShiftDrsDetailLabel\(grp/);
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
  assert.match(source, /\$\('npDate'\)\.value = isActualStageContext\(rType\) \? colToInputDate\(col, state\) : colToInputMonth\(col, state\)/);
  assert.match(source, /Enter the actual date\./);
});

test('EOP table columns are locked in the UI', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

  assert.match(html, /id="addEopColBtn" hidden disabled/);
  assert.match(source, /renderDynTable\('eopTableWrap', state\.rightTable,[\s\S]*\{ allowColumnEdit: false, allowColumnDelete: false, readOnly \}\)/);
  assert.match(source, /sp\.contentEditable = allowColumnEdit \? 'true' : 'false'/);
  assert.match(source, /if \(allowColumnDelete && ci > 0\)/);
  assert.match(source, /addEopColBtn\.hidden = true/);
  assert.match(source, /addEopColBtn\.disabled = true/);
  assert.doesNotMatch(source, /\$\('addEopColBtn'\)\.addEventListener\('click', \(\) => \{ store\.getState\(\)\.addRightTableCol/);
});

test('timeline version dropdown and snapshot read-only path are wired', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

  assert.match(html, /<label for="timelineVersionSelect">Timeline Version<\/label>/);
  assert.match(html, /<select id="timelineVersionSelect"/);
  assert.match(source, /function isSnapshotReadOnlyMode/);
  assert.match(source, /function getTimelineRenderState/);
  assert.match(source, /let snapshotView = \{ selected: TIMELINE_VERSION_CURRENT, state: null/);
  assert.match(source, /if \(!isSnapshotReadOnlyMode\(\)\) s = ensureFutureActualBlankSpaceVisible\(s\)/);
  assert.match(source, /updateSnapshotReadOnlyUi/);
  assert.match(source, /'copyActualBtn', 'addYearBtn', 'addMsRowBtn', 'addMsColBtn'/);
  assert.match(source, /submitBtn\.disabled = isSnapshotReadOnlyMode\(\)/);
});

test('Dataverse bridge includes submit-version history contract', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

  assert.match(source, /loadProject\(\{ projectId \}\)/);
  assert.match(source, /getSubmitVersion\(\{/);
  assert.match(source, /saveProject\(\{[\s\S]*submitVersion,[\s\S]*submittedVersion: submitVersion/);
  assert.match(source, /writeLocalJson\(keys\.submitVersions, submitVersions\)/);
  assert.match(source, /writeLocalJson\(keys\.discussionCutoffs, discussionCutoffDates\)/);
});

test('merge and shift modals set date picker bounds from the source stage month', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

  assert.match(source, /const mergeMinMonth = colToInputMonth\(fromNode\.col \+ 1, store\.getState\(\)\)/);
  assert.match(source, /<input id="f_merge_month" type="month" min="\$\{mergeMinMonth\}"/);
  assert.match(source, /max="\$\{colToInputMonth\(source\.col - 1, state\)\}"/);
  assert.match(source, /min="\$\{colToInputMonth\(source\.col \+ 1, state\)\}"/);
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
  const fn = source.slice(source.indexOf('function mkShiftedNode'), source.indexOf('function renderBottomTables'));
  assert.doesNotMatch(fn, /openStageEditModal/);
  assert.doesNotMatch(fn, /shift-mode-label/);
  assert.doesNotMatch(fn, /Preponed|Postponed/);
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
