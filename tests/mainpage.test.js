const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadMainPageHelpers() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'mainpage.js'), 'utf8');
  const sandbox = {
    console,
    localStorage: null,
    location: { href: '' },
    document: {
      addEventListener: () => {},
      getElementById: () => null,
    },
  };
  sandbox.window = sandbox;
  vm.runInNewContext(source, sandbox, { filename: 'mainpage.js' });
  return sandbox.MainPageTimeline;
}

class FakeStorage {
  constructor(entries) {
    this.map = new Map(Object.entries(entries || {}));
  }

  get length() {
    return this.map.size;
  }

  key(index) {
    return [...this.map.keys()][index] || null;
  }

  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }
}

const mainpage = loadMainPageHelpers();

function toPlain(value) {
  return JSON.parse(JSON.stringify(value));
}

test('normalizeProjectSnapshot preserves the existing project state shape', () => {
  const project = mainpage.normalizeProjectSnapshot({
    projectId: 'p1',
    info: { project: 'Alpha', location: 'SMG', plant: 'Plant-C', type: 'MC', status: 'Delayed', published: true },
    variants: [{ id: 'v1', name: 'DOM Gas' }],
    planNodes: [{ id: 'n1', variantId: 'v1', date: '2024-06', topLabel: 'DA', bottomLabel: 'Beg', isDRS: true, drsDetail: 'Ready' }],
    actualNodes: [{ id: 'a1', variantId: 'v1', date: '2024-07-19', topLabel: 'DA' }],
    rightTable: { cols: ['Model Detail', 'Date- month/year'], rows: [['EOP DOM', '2026-03']] },
  });

  assert.equal(project.projectId, 'p1');
  assert.equal(project.info.project, 'Alpha');
  assert.equal(project.info.published, true);
  assert.equal(project.variants[0].name, 'DOM Gas');
  assert.equal(project.planNodes[0].isDRS, true);
  assert.deepEqual(toPlain(project.eopItems), [{ id: 'eop-table-1-2', label: 'EOP DOM', date: '2026-03' }]);
});

test('loadProjectsFromLocalStorage discovers drafts and prefers them over baselines', () => {
  const storage = new FakeStorage({
    'project-tracker:baseline:p1': JSON.stringify({ projectId: 'p1', info: { project: 'Old Alpha' } }),
    'project-tracker:draft:p1': JSON.stringify({ projectId: 'p1', info: { project: 'New Alpha' } }),
    'project-tracker:dataverse-payload:p1': JSON.stringify({ ignored: true }),
    'project-tracker:baseline:p2': JSON.stringify({ projectId: 'p2', info: { project: 'Beta' } }),
  });

  const projects = mainpage.loadProjectsFromLocalStorage(storage);

  assert.deepEqual(toPlain(projects.map(project => project.info.project)), ['Beta', 'New Alpha']);
});

test('computeMonthRange covers all timeline-bearing fields in full-year spans', () => {
  const project = mainpage.normalizeProjectSnapshot({
    projectId: 'range',
    info: { project: 'Range' },
    years: [2025],
    variants: [{ id: 'v1', name: 'Main' }],
    planNodes: [{ id: 'p1', variantId: 'v1', date: '2024-02' }],
    actualNodes: [{ id: 'a1', variantId: 'v1', date: '2024-03-10' }],
    branches: [{ id: 'b1', variantId: 'v1', sourceDate: '2023-12' }],
    mergeLinks: [{ id: 'm1', fromBranchId: 'b1', toDate: '2026-04' }],
    stageShifts: [{ id: 's1', sourceNodeId: 'p1', sourceContext: 'plan', mode: 'postponed', targetDate: '2027-01' }],
    eopItems: [{ label: 'EOP', date: '2026-09' }],
    discussionDate: '2026-06',
  });

  const months = mainpage.computeMonthRange([project], new Date('2026-06-03T00:00:00Z'));

  assert.equal(months[0], '2023-01');
  assert.equal(months.at(-1), '2027-12');
  assert.equal(months.length, 60);
});

test('buildPortfolioModel creates plan, actual, branch, shift, merge, and EOP rows', () => {
  const project = {
    projectId: 'p-model',
    info: { project: 'Model', status: 'On Track' },
    years: [2024],
    variants: [{ id: 'v1', name: 'DOM Gas' }],
    planNodes: [{ id: 'p1', variantId: 'v1', date: '2024-02', topLabel: 'DA', bottomLabel: 'Mid' }],
    actualNodes: [{ id: 'a1', variantId: 'v1', date: '2024-03-05', topLabel: 'DA' }],
    branches: [{ id: 'b1', variantId: 'v1', sourceDate: '2024-02', label: 'Alt' }],
    branchNodes: [{ id: 'bp1', branchId: 'b1', date: '2024-04', topLabel: 'BR' }],
    mergeLinks: [{ id: 'm1', fromBranchId: 'b1', toDate: '2024-05' }],
    stageShifts: [{ id: 's1', sourceNodeId: 'p1', sourceContext: 'plan', mode: 'postponed', targetDate: '2024-06', drsDetail: 'Shift DRS' }],
    eopItems: [{ id: 'e1', label: 'EOP', date: '2024-12' }],
  };

  const model = mainpage.buildPortfolioModel([project], new Date('2024-01-01T00:00:00Z'));
  const rows = model.groups[0].rows;

  assert.deepEqual(toPlain(rows.map(row => row.context)), ['plan', 'branch', 'actual', 'eop']);
  assert.equal(rows[0].markers.some(marker => marker.markerType === 'shift'), true);
  assert.equal(rows[1].markers.some(marker => marker.markerType === 'merge'), true);
  assert.equal(rows[3].markers[0].markerType, 'eop');
});

test('buildPortfolioModel creates cross-row relationship geometry for branches, merges, and shifts', () => {
  const project = {
    projectId: 'p-relationships',
    info: { project: 'Relationships' },
    years: [2024],
    variants: [{ id: 'v1', name: 'Main' }],
    planNodes: [
      { id: 'p1', variantId: 'v1', date: '2024-02', col: 1, topLabel: 'DA' },
      { id: 'p2', variantId: 'v1', date: '2024-05', col: 4, topLabel: 'SOS' },
    ],
    actualNodes: [{ id: 'a1', variantId: 'v1', date: '2024-03-05', topLabel: 'DA' }],
    branches: [{ id: 'b1', variantId: 'v1', sourceNodeId: 'p1', sourceDate: '2024-02', sourceCol: 1, label: 'Alt' }],
    branchNodes: [{ id: 'bp1', branchId: 'b1', date: '2024-04', col: 3, topLabel: 'BR' }],
    mergeLinks: [{ id: 'm1', fromBranchId: 'b1', fromNodeId: 'bp1', toNodeId: 'p2', toDate: '2024-05', toCol: 4 }],
    stageShifts: [{ id: 's1', sourceNodeId: 'p1', sourceContext: 'plan', mode: 'postponed', targetDate: '2024-06', targetCol: 5 }],
  };

  const group = mainpage.buildPortfolioModel([project], new Date('2024-01-01T00:00:00Z')).groups[0];
  const relationships = group.relationships;
  const branchStart = relationships.find(item => item.type === 'branch-start');
  const merge = relationships.find(item => item.type === 'merge');
  const shift = relationships.find(item => item.type === 'shift-postponed');

  assert.ok(branchStart);
  assert.ok(merge);
  assert.ok(shift);
  assert.equal(branchStart.from.y < branchStart.to.y, true);
  assert.equal(merge.from.y > merge.to.y, true);
  assert.equal(shift.from.y, shift.to.y);
  assert.equal(shift.to.x > shift.from.x, true);
});

test('buildPortfolioModel creates timeline overlays for remarks, DRS, shift DRS, and milestone table', () => {
  const project = {
    projectId: 'p-overlays',
    info: { project: 'Overlays' },
    years: [2024],
    variants: [{ id: 'v1', name: 'Main' }],
    planNodes: [{ id: 'p1', variantId: 'v1', date: '2024-02', topLabel: 'DA', isDRS: true, drsDetail: 'Stage DRS' }],
    stageShifts: [{ id: 's1', sourceNodeId: 'p1', sourceContext: 'plan', mode: 'postponed', targetDate: '2024-03', drsDetail: 'Shift DRS' }],
    remarks: 'First remark\nSecond remark',
    leftTable: { cols: ['Milestone', 'Main'], rows: [['DA', '2024-02']] },
    remarkPosition: { x: 99999, y: -20 },
    labelPositions: {
      'drs:summary': { x: 120, y: 30 },
      'milestone:table': { x: 130, y: 40 },
    },
  };

  const group = mainpage.buildPortfolioModel([project], new Date('2024-01-01T00:00:00Z')).groups[0];
  const overlays = group.overlays;
  const remarks = overlays.find(item => item.type === 'remarks');
  const drs = overlays.find(item => item.type === 'drs');
  const milestone = overlays.find(item => item.type === 'milestone');

  assert.deepEqual(toPlain(overlays.map(item => item.type)), ['remarks', 'drs', 'milestone']);
  assert.equal(remarks.items.length, 2);
  assert.equal(drs.items.some(item => item.text === 'Stage DRS'), true);
  assert.equal(drs.items.some(item => item.text === 'Shift DRS'), true);
  assert.deepEqual(toPlain(milestone.table.rows), [['DA', '2024-02']]);
  assert.equal(remarks.laneKey, 'plan:v1');
  assert.equal(drs.laneKey, 'plan:v1');
  assert.equal(milestone.laneKey, 'plan:v1');
  const planRow = group.rows.find(row => row.rowId === 'plan:v1');
  const actualRow = group.rows.find(row => row.rowId === 'actual:v1');
  assert.equal(planRow.height, 280);
  assert.equal(planRow.stageY, 45);
  assert.equal(actualRow.height, 90);
  assert.equal(group.height, 374);
  assert.equal('position' in remarks, false);
});

test('normalizeBridgeProjectRecord preserves Dataverse collection submit versions and cutoff dates', () => {
  const record = mainpage.normalizeBridgeProjectRecord({
    projectId: 'bridge-1',
    state: { projectId: 'bridge-1', info: { project: 'Bridge Current' } },
    versions: [
      { id: 'july', submittedAt: '2024-07-20T12:00:00.000Z', discussionDate: '2024-07-20', state: { projectId: 'bridge-1', info: { project: 'Bridge July' } } },
      { id: 'june', submittedAt: '2024-06-20T12:00:00.000Z', discussionDate: '2024-06-20', state: { projectId: 'bridge-1', info: { project: 'Bridge June' } } },
    ],
    cutoffDates: ['2024-07-20'],
  }, 0);

  assert.equal(record.projectId, 'bridge-1');
  assert.equal(record.draft.info.project, 'Bridge Current');
  assert.deepEqual(toPlain(record.submitVersions.map(version => version.id)), ['july', 'june']);
  assert.deepEqual(toPlain(record.cutoffDates), ['2024-07-20', '2024-06-20']);
});

test('normalizeDataversePayload maps saved payload groups back to project snapshots', () => {
  const project = mainpage.normalizeDataversePayload({
    project: {
      external_id: 'dv1',
      name: 'Dataverse Project',
      location: 'SMG',
      plant: 'Plant-C',
      project_type: 'MC',
      status: 'Completed',
      published: true,
      years_json: '[2024,2025]',
      eop_dates_json: '[{"label":"EOP","date":"2025-11"}]',
      stage_shifts_json: '[{"id":"s1","sourceNodeId":"p1","sourceContext":"plan","mode":"preponed","targetDate":"2024-04"}]',
    },
    variants: [{ external_id: 'v1', name: 'DOM Gas' }],
    branches: [{ external_id: 'b1', branch_context: 'plan', variant_external_id: 'v1', source_month: '2024-06' }],
    stages: [
      { external_id: 'p1', stage_context: 'plan', variant_external_id: 'v1', month: '2024-06', top_label: 'DA' },
      { external_id: 'a1', stage_context: 'actual', variant_external_id: 'v1', month: '2024-07-01', top_label: 'DA' },
      { external_id: 'bp1', stage_context: 'branch_plan', branch_external_id: 'b1', month: '2024-08', top_label: 'BR' },
    ],
    mergeLinks: [{ external_id: 'm1', merge_context: 'plan', branch_external_id: 'b1', target_month: '2024-09' }],
  });

  assert.equal(project.projectId, 'dv1');
  assert.equal(project.info.project, 'Dataverse Project');
  assert.equal(project.info.published, true);
  assert.equal(project.planNodes[0].variantId, 'v1');
  assert.equal(project.branchNodes[0].branchId, 'b1');
  assert.equal(project.mergeLinks[0].toDate, '2024-09');
  assert.equal(project.eopItems[0].date, '2025-11');
});

test('normalizeDiscussionCutoffDates dedupes and sorts cutoff dates newest first', () => {
  const dates = mainpage.normalizeDiscussionCutoffDates([
    '2024-07-20',
    { cutoffDate: '2024-09-20' },
    { discussionDate: '2024-08-20' },
    '2024-07-20',
    'bad-date',
  ]);

  assert.deepEqual(toPlain(dates), ['2024-09-20', '2024-08-20', '2024-07-20']);
});

test('resolveSubmitVersionForCutoff chooses the latest submit version before cutoff end', () => {
  const versions = [
    { id: 'june', submittedAt: '2024-06-20T12:00:00.000Z', state: { projectId: 'p1', info: { project: 'June' } } },
    { id: 'july', submittedAt: '2024-07-20T12:00:00.000Z', state: { projectId: 'p1', info: { project: 'July' } } },
    { id: 'late', submittedAt: '2024-07-21T00:00:00.000Z', state: { projectId: 'p1', info: { project: 'Late' } } },
  ];

  assert.equal(mainpage.resolveSubmitVersionForCutoff(versions, '2024-07-20').id, 'july');
  assert.equal(mainpage.resolveSubmitVersionForCutoff(versions, '2024-06-19'), null);
});

test('loadProjectRecordsFromLocalStorage groups drafts, submit versions, and cutoff dates', () => {
  const storage = new FakeStorage({
    'project-tracker:draft:p1': JSON.stringify({ projectId: 'p1', info: { project: 'Alpha Draft' } }),
    'project-tracker:baseline:p1': JSON.stringify({ projectId: 'p1', info: { project: 'Alpha Base' } }),
    'project-tracker:submit-versions:p1': JSON.stringify([
      { id: 'v1', submittedAt: '2024-06-20T12:00:00.000Z', state: { projectId: 'p1', info: { project: 'Alpha June' } } },
    ]),
    'project-tracker:discussion-cutoffs:p1': JSON.stringify(['2024-06-20', '2024-07-20']),
    'project-tracker:draft:p2': JSON.stringify({ projectId: 'p2', info: { project: 'Beta Draft' } }),
  });

  const records = mainpage.loadProjectRecordsFromLocalStorage(storage);

  assert.deepEqual(toPlain(records.map(record => record.projectId)), ['p1', 'p2']);
  assert.equal(records[0].draft.info.project, 'Alpha Draft');
  assert.equal(records[0].submitVersions[0].id, 'v1');
  assert.deepEqual(toPlain(records[0].cutoffDates), ['2024-07-20', '2024-06-20']);
  assert.deepEqual(toPlain(records[1].cutoffDates), []);
});

test('resolveProjectsForCutoff returns drafts for current and submit snapshots for cutoffs', () => {
  const records = [
    {
      projectId: 'p1',
      draft: mainpage.normalizeProjectSnapshot({ projectId: 'p1', info: { project: 'Alpha Current' } }),
      submitVersions: [
        { id: 'p1-june', submittedAt: '2024-06-20T12:00:00.000Z', state: { projectId: 'p1', info: { project: 'Alpha June' } } },
        { id: 'p1-july', submittedAt: '2024-07-20T12:00:00.000Z', state: { projectId: 'p1', info: { project: 'Alpha July' } } },
      ],
      cutoffDates: ['2024-06-20', '2024-07-20'],
    },
    {
      projectId: 'p2',
      draft: mainpage.normalizeProjectSnapshot({ projectId: 'p2', info: { project: 'Beta Current' } }),
      submitVersions: [
        { id: 'p2-july', submittedAt: '2024-07-20T12:00:00.000Z', state: { projectId: 'p2', info: { project: 'Beta July' } } },
      ],
      cutoffDates: ['2024-07-20'],
    },
  ];

  assert.deepEqual(
    mainpage.resolveProjectsForCutoff(records, 'current').map(project => project.info.project),
    ['Alpha Current', 'Beta Current']
  );
  assert.deepEqual(
    mainpage.resolveProjectsForCutoff(records, 'cutoff:2024-06-20').map(project => project.info.project),
    ['Alpha June']
  );
  assert.deepEqual(
    mainpage.resolveProjectsForCutoff(records, 'cutoff:2024-07-20').map(project => project.info.project),
    ['Alpha July', 'Beta July']
  );
});

test('mainpage renders in-lane timeline overlays and relationship SVGs instead of below-grid panels', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'mainpage.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'mainpage.css'), 'utf8');

  assert.doesNotMatch(source, /project-info-panels/);
  assert.doesNotMatch(css, /project-info-panels/);
  assert.match(source, /renderRelationshipSvg/);
  assert.match(source, /renderTimelineInLaneOverlays/);
  assert.match(source, /createEl\('div', 'timeline-inlane-overlays'\)/);
  assert.doesNotMatch(source, /timeline-overlay-zone/);
  assert.match(css, /\.timeline-inlane-overlays/);
  assert.doesNotMatch(css, /\.timeline-overlay-zone/);
  assert.match(css, /\.tl-relationship-svg/);
  assert.match(css, /\.timeline-summary-box/);
  assert.match(css, /\.milestone-grid-table/);
});
