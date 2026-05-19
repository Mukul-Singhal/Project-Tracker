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
  assert.deepEqual(toPlain(payload.mergeLinks), [{ external_id: 'm1', branch_external_id: 'b1', source_stage_external_id: 'bp1', target_stage_external_id: 'p1' }]);
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

  assert.deepEqual(toPlain(delta.changedGroups.sort()), ['project', 'variants']);
  assert.equal(delta.hasChanges, true);
});
