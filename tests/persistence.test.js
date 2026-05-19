const test = require('node:test');
const assert = require('node:assert/strict');

const persistence = require('../persistence-core.js');

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
    planNodes: [{ id: 'p1', variantId: 'v1', col: 5, type: 'square', topLabel: 'DA', bottomLabel: '', date: '2024-06' }],
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
  assert.deepEqual(payload.variants, [{ external_id: 'v1', name: 'DOM Gas', display_order: 0 }]);
  assert.equal(payload.stages.length, 2);
  assert.equal(payload.stages[0].stage_context, 'plan');
  assert.equal(payload.stages[1].stage_context, 'branch_plan');
  assert.deepEqual(payload.mergeLinks, [{ external_id: 'm1', branch_external_id: 'b1', source_stage_external_id: 'bp1', target_stage_external_id: 'p1' }]);
  assert.equal(JSON.parse(payload.project.milestone_table_json).cols[0], 'Milestone');
  assert.equal(JSON.parse(payload.project.layout_json).labelPositions['plan:v1'].x, 10);
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

  assert.deepEqual(delta.changedGroups.sort(), ['project', 'variants']);
  assert.equal(delta.hasChanges, true);
});
