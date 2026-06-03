(function () {
  'use strict';

  const STORAGE_PREFIX = 'project-tracker';
  const ACTIVE_PROJECT_KEY = `${STORAGE_PREFIX}:activeProjectId`;
  const PREVIOUS_PROJECT_KEY = `${STORAGE_PREFIX}:demo-cutoff-snapshots:previousProjectId`;
  const PROJECT_ID = 'demo-cutoff-snapshots';
  const CUTOFF_DATES = ['2024-06-20', '2024-07-20', '2024-08-20', '2024-09-20'];
  const YEARS = [2024, 2025, 2026];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function dateToCol(value) {
    const match = String(value || '').match(/^(\d{4})-(\d{2})/);
    if (!match) return -1;
    const yearIndex = YEARS.indexOf(Number(match[1]));
    if (yearIndex < 0) return -1;
    return yearIndex * 12 + Number(match[2]) - 1;
  }

  function icon(number) {
    return `stage-logo-${number}`;
  }

  function planStage(id, variantId, date, topLabel, bottomLabel, type, extra) {
    return {
      id,
      variantId,
      col: dateToCol(date),
      type,
      topLabel,
      bottomLabel,
      date,
      isDRS: false,
      drsDetail: '',
      ...(extra || {}),
    };
  }

  function actualStage(id, variantId, date, topLabel, type, extra) {
    return {
      id,
      variantId,
      col: dateToCol(date),
      type,
      topLabel,
      bottomLabel: '',
      date,
      isDRS: false,
      drsDetail: '',
      ...(extra || {}),
    };
  }

  function branchStage(id, branchId, date, topLabel, bottomLabel, type, extra) {
    return {
      id,
      branchId,
      col: dateToCol(date),
      type,
      topLabel,
      bottomLabel,
      date,
      isDRS: false,
      drsDetail: '',
      ...(extra || {}),
    };
  }

  function actualBranchStage(id, branchId, date, topLabel, type, extra) {
    return {
      id,
      branchId,
      col: dateToCol(date),
      type,
      topLabel,
      bottomLabel: '',
      date,
      isDRS: false,
      drsDetail: '',
      ...(extra || {}),
    };
  }

  function eopItems(rows) {
    return rows
      .map((row, index) => ({
        id: `eop-${index}-1`,
        label: row[0],
        date: row[1],
        col: dateToCol(row[1]),
        rowIndex: index,
        colIndex: 1,
      }))
      .sort((a, b) => a.col - b.col || a.rowIndex - b.rowIndex);
  }

  function baseState(cutoffDate) {
    const eopRows = [
      ['DOM Gas EOP', '2025-03'],
      ['DOM CNG EOP', '2025-04'],
    ];

    return {
      projectId: PROJECT_ID,
      info: {
        project: 'Astra Compact Refresh Demo',
        location: 'Pune',
        plant: 'Plant-A',
        type: 'MC',
        status: 'On Track',
        published: false,
      },
      variants: [
        { id: 'v-gas', name: 'DOM Gas' },
        { id: 'v-cng', name: 'DOM CNG' },
      ],
      planNodes: [
        planStage('p-gas-da', 'v-gas', '2024-06', 'DA', 'Beg', icon(1), {
          isDRS: true,
          drsDetail: 'June gate DRS approved for DOM Gas.',
        }),
        planStage('p-cng-da', 'v-cng', '2024-07', 'DA', 'Mid', icon(2)),
      ],
      actualNodes: [
        actualStage('a-gas-kickoff', 'v-gas', '2024-06-18', 'Kickoff', icon(3), {
          isDRS: true,
          drsDetail: 'Kickoff evidence uploaded before June cutoff.',
        }),
      ],
      branches: [],
      actualBranches: [],
      branchNodes: [],
      actualBranchNodes: [],
      mergeLinks: [],
      actualMergeLinks: [],
      stageShifts: [],
      leftTable: {
        cols: ['Milestone', 'DOM Gas', 'DOM CNG', 'EV Export'],
        rows: [
          ['DA', '2024-06', '2024-07', ''],
          ['SOS', '', '', ''],
          ['PP', '', '', ''],
          ['SOP', '', '', ''],
        ],
      },
      rightTable: {
        cols: ['Model Detail', 'Date- month/year'],
        rows: eopRows,
      },
      remarks: 'June cutoff snapshot: base variants and first actual kickoff are finalized.',
      years: clone(YEARS),
      eopDate: eopRows[0][1],
      eopItems: eopItems(eopRows),
      discussionDate: cutoffDate,
      milestoneTableVisible: true,
      labelPositions: {
        'drs:p-gas-da': { x: 690, y: 116 },
        'drs:a-gas-kickoff': { x: 720, y: 472 },
        'milestone:table': { x: 86, y: 36 },
      },
      remarkPosition: { x: 980, y: 578 },
      nid: 200,
    };
  }

  function makeJulyState() {
    const state = clone(baseState('2024-07-20'));
    state.info.status = 'Delayed';
    state.info.published = true;
    state.variants.push({ id: 'v-ev', name: 'EV Export' });
    state.planNodes.push(
      planStage('p-gas-sos', 'v-gas', '2024-10', 'SOS', 'End', icon(4), {
        isDRS: true,
        drsDetail: 'Gas SOS DRS action list opened in July.',
      }),
      planStage('p-cng-sos', 'v-cng', '2024-11', 'SOS', 'Beg', icon(5)),
      planStage('p-ev-da', 'v-ev', '2024-08', 'DA', 'Mid', icon(6))
    );
    state.actualNodes.push(
      actualStage('a-gas-da', 'v-gas', '2024-07-18', 'DA', icon(1)),
      actualStage('a-cng-readiness', 'v-cng', '2024-07-12', 'Readiness', icon(2), {
        isDRS: true,
        drsDetail: 'CNG supplier readiness reviewed before July cutoff.',
      })
    );
    state.branches.push({
      id: 'b-gas-supply',
      variantId: 'v-gas',
      parentNodeId: 'p-gas-da',
      sourceNodeId: 'p-gas-da',
      sourceCol: dateToCol('2024-06'),
      sourceDate: '2024-06',
      label: 'Gas supplier branch',
    });
    state.branchNodes.push(
      branchStage('bp-gas-trial', 'b-gas-supply', '2024-08', 'Trial', 'Mid', icon(7), {
        isDRS: true,
        drsDetail: 'Supplier branch trial DRS created in July.',
      })
    );
    state.mergeLinks.push({
      id: 'm-gas-supply-sos',
      fromNodeId: 'bp-gas-trial',
      fromBranchId: 'b-gas-supply',
      toNodeId: 'p-gas-sos',
      toDate: '2024-10',
      toCol: dateToCol('2024-10'),
    });
    state.leftTable.rows = [
      ['DA', '2024-06', '2024-07', '2024-08'],
      ['SOS', '2024-10', '2024-11', ''],
      ['PP', '', '', ''],
      ['SOP', '', '', ''],
    ];
    state.remarks = 'July cutoff snapshot: EV export row added, Gas branch started, and July actuals are finalized.';
    state.labelPositions['drs:p-gas-sos'] = { x: 930, y: 106 };
    state.labelPositions['drs:a-cng-readiness'] = { x: 760, y: 664 };
    state.labelPositions['drs:bp-gas-trial'] = { x: 790, y: 204 };
    state.nid = 300;
    return state;
  }

  function makeAugustState() {
    const state = clone(makeJulyState());
    state.discussionDate = '2024-08-20';
    state.info.status = 'At Risk';
    state.planNodes.push(
      planStage('p-ev-sos', 'v-ev', '2024-12', 'SOS', 'End', icon(8)),
      planStage('p-gas-pp', 'v-gas', '2025-01', 'PP', 'Mid', icon(9))
    );
    state.actualNodes.push(
      actualStage('a-gas-sos', 'v-gas', '2024-08-22', 'SOS', icon(4), {
        isDRS: true,
        drsDetail: 'Actual SOS slipped after branch trial; risk recorded.',
      }),
      actualStage('a-ev-readiness', 'v-ev', '2024-08-16', 'Readiness', icon(6))
    );
    state.actualBranches.push({
      id: 'ab-gas-recovery',
      variantId: 'v-gas',
      parentNodeId: 'a-gas-da',
      sourceNodeId: 'a-gas-da',
      sourceCol: dateToCol('2024-07'),
      sourceDate: '2024-07-18',
      sourcePlanBranchId: 'b-gas-supply',
      label: 'Actual recovery branch',
    });
    state.actualBranchNodes.push(
      actualBranchStage('abp-gas-recovery-trial', 'ab-gas-recovery', '2024-09-10', 'Recovery', icon(10), {
        isDRS: true,
        drsDetail: 'Recovery branch DRS accepted for rework build.',
      })
    );
    state.actualMergeLinks.push({
      id: 'am-gas-recovery-anchor',
      fromNodeId: 'abp-gas-recovery-trial',
      fromBranchId: 'ab-gas-recovery',
      toNodeId: '',
      toDate: '2024-11',
      toCol: dateToCol('2024-11'),
    });
    state.stageShifts.push({
      id: 'ss-gas-sos-pre',
      sourceNodeId: 'p-gas-sos',
      sourceContext: 'plan',
      mode: 'preponed',
      targetDate: '2024-09',
      targetCol: dateToCol('2024-09'),
      drsDetail: 'Preponed Gas SOS DRS details for management review.',
    });
    state.leftTable.rows = [
      ['DA', '2024-06', '2024-07', '2024-08'],
      ['SOS', '2024-10', '2024-11', '2024-12'],
      ['PP', '2025-01', '', ''],
      ['SOP', '', '', ''],
    ];
    state.remarks = 'August cutoff snapshot: actual recovery branch, preponed SOS marker, and EV SOS plan are finalized.';
    state.labelPositions['drs:a-gas-sos'] = { x: 850, y: 486 };
    state.labelPositions['drs:abp-gas-recovery-trial'] = { x: 900, y: 584 };
    state.labelPositions['shift-drs:ss-gas-sos-pre'] = { x: 1004, y: 316 };
    state.nid = 400;
    return state;
  }

  function makeSeptemberState() {
    const state = clone(makeAugustState());
    const eopRows = [
      ['DOM Gas EOP', '2025-03'],
      ['DOM CNG EOP', '2025-04'],
      ['EV Export EOP', '2025-06'],
    ];
    state.discussionDate = '2024-09-20';
    state.info.status = 'Delayed';
    state.info.published = true;
    state.planNodes.push(
      planStage('p-cng-pp', 'v-cng', '2025-02', 'PP', 'End', icon(10), {
        isDRS: true,
        drsDetail: 'CNG PP DRS package is ready for supplier signoff.',
      }),
      planStage('p-ev-pp', 'v-ev', '2025-03', 'PP', 'Beg', icon(11))
    );
    state.actualNodes.push(
      actualStage('a-cng-da', 'v-cng', '2024-09-05', 'DA', icon(2)),
      actualStage('a-ev-da', 'v-ev', '2024-09-18', 'DA', icon(6), {
        isDRS: true,
        drsDetail: 'EV export DA evidence complete at September cutoff.',
      })
    );
    state.branches.push({
      id: 'b-ev-export',
      variantId: 'v-ev',
      parentNodeId: 'p-ev-da',
      sourceNodeId: 'p-ev-da',
      sourceCol: dateToCol('2024-08'),
      sourceDate: '2024-08',
      label: 'EV export homologation',
    });
    state.branchNodes.push(
      branchStage('bp-ev-homo', 'b-ev-export', '2024-12', 'HOMO', 'Beg', icon(3)),
      branchStage('bp-ev-cert', 'b-ev-export', '2025-04', 'CERT', 'End', icon(5), {
        isDRS: true,
        drsDetail: 'Certification DRS queued for export branch.',
      })
    );
    state.mergeLinks.push({
      id: 'm-ev-export-anchor',
      fromNodeId: 'bp-ev-cert',
      fromBranchId: 'b-ev-export',
      toNodeId: '',
      toDate: '2025-06',
      toCol: dateToCol('2025-06'),
    });
    state.stageShifts.push({
      id: 'ss-cng-pp-post',
      sourceNodeId: 'p-cng-pp',
      sourceContext: 'plan',
      mode: 'postponed',
      targetDate: '2025-04',
      targetCol: dateToCol('2025-04'),
      drsDetail: 'Postponed CNG PP DRS because supplier tooling moved.',
    });
    state.leftTable.rows = [
      ['DA', '2024-06', '2024-07', '2024-08'],
      ['SOS', '2024-10', '2024-11', '2024-12'],
      ['PP', '2025-01', '2025-02', '2025-03'],
      ['SOP', '2025-05', '2025-06', '2025-07'],
    ];
    state.rightTable.rows = eopRows;
    state.eopDate = eopRows[0][1];
    state.eopItems = eopItems(eopRows);
    state.remarks = 'September cutoff snapshot: this is the final submitted baseline before current-only edits.';
    state.labelPositions['drs:p-cng-pp'] = { x: 1230, y: 210 };
    state.labelPositions['drs:a-ev-da'] = { x: 1000, y: 760 };
    state.labelPositions['drs:bp-ev-cert'] = { x: 1398, y: 300 };
    state.labelPositions['shift-drs:ss-cng-pp-post'] = { x: 1450, y: 398 };
    state.remarkPosition = { x: 1180, y: 754 };
    state.nid = 500;
    return state;
  }

  function makeCurrentDraft() {
    const state = clone(makeSeptemberState());
    state.info.project = 'Astra Compact Refresh Demo - Current Draft';
    state.info.status = 'At Risk';
    state.info.published = false;
    state.planNodes.push(
      planStage('p-gas-sop-current', 'v-gas', '2025-05', 'SOP', 'Mid', icon(6), {
        isDRS: true,
        drsDetail: 'Current-only SOP DRS note. This should not appear in older cutoff snapshots.',
      }),
      planStage('p-ev-sop-current', 'v-ev', '2025-07', 'SOP', 'End', icon(8))
    );
    state.actualNodes.push(
      actualStage('a-gas-current-build', 'v-gas', '2024-10-08', 'Build', icon(9), {
        isDRS: true,
        drsDetail: 'Current-only October build actual. Hidden when selecting September or older cutoffs.',
      })
    );
    state.stageShifts.push({
      id: 'ss-current-gas-build-post',
      sourceNodeId: 'a-gas-current-build',
      sourceContext: 'actual',
      mode: 'postponed',
      targetDate: '2024-11',
      targetCol: dateToCol('2024-11'),
      drsDetail: 'Current-only shifted actual build DRS note.',
    });
    state.remarks = 'CURRENT DRAFT ONLY: October edits are visible in Current and hidden in all seeded cutoff snapshots.';
    state.labelPositions['drs:p-gas-sop-current'] = { x: 1536, y: 124 };
    state.labelPositions['drs:a-gas-current-build'] = { x: 1138, y: 482 };
    state.labelPositions['shift-drs:ss-current-gas-build-post'] = { x: 1200, y: 520 };
    state.nid = 900;
    return state;
  }

  function mapStages(nodes, context, extra) {
    return (nodes || []).map((node, index) => ({
      external_id: node.id,
      stage_context: context,
      month: node.date || '',
      column_index: Number.isFinite(node.col) ? node.col : 0,
      shape: node.type || 'stage-logo-1',
      top_label: node.topLabel || '',
      bottom_label: node.bottomLabel || '',
      is_drs: !!node.isDRS,
      drs_detail: node.drsDetail || '',
      source_plan_stage_external_id: node.sourcePlanNodeId || '',
      display_order: index,
      ...(extra ? extra(node) : {}),
    }));
  }

  function makePayload(state) {
    return {
      project: {
        external_id: state.projectId,
        name: state.info.project,
        location: state.info.location,
        plant: state.info.plant,
        project_type: state.info.type,
        status: state.info.status,
        published: !!state.info.published,
        discussion_period_date: state.discussionDate,
        eop_date: state.eopDate,
        eop_dates_json: JSON.stringify(state.eopItems || []),
        stage_shifts_json: JSON.stringify(state.stageShifts || []),
        years_json: JSON.stringify(state.years || []),
        remarks: state.remarks || '',
        milestone_table_json: JSON.stringify(state.leftTable || { cols: [], rows: [] }),
        eop_table_json: JSON.stringify(state.rightTable || { cols: [], rows: [] }),
        layout_json: JSON.stringify({
          labelPositions: state.labelPositions || {},
          remarkPosition: state.remarkPosition || null,
          nid: state.nid || 1,
        }),
      },
      variants: (state.variants || []).map((variant, index) => ({
        external_id: variant.id,
        name: variant.name || '',
        display_order: index,
      })),
      branches: [
        ...(state.branches || []).map((branch, index) => ({
          external_id: branch.id,
          branch_context: 'plan',
          variant_external_id: branch.variantId,
          parent_stage_external_id: branch.parentNodeId || branch.sourceNodeId || '',
          source_stage_external_id: branch.sourceNodeId || branch.parentNodeId || '',
          source_month: branch.sourceDate || '',
          source_column_index: Number.isFinite(branch.sourceCol) ? branch.sourceCol : null,
          source_plan_branch_external_id: '',
          label: branch.label || '',
          display_order: index,
        })),
        ...(state.actualBranches || []).map((branch, index) => ({
          external_id: branch.id,
          branch_context: 'actual',
          variant_external_id: branch.variantId,
          parent_stage_external_id: branch.parentNodeId || branch.sourceNodeId || '',
          source_stage_external_id: branch.sourceNodeId || branch.parentNodeId || '',
          source_month: branch.sourceDate || '',
          source_column_index: Number.isFinite(branch.sourceCol) ? branch.sourceCol : null,
          source_plan_branch_external_id: branch.sourcePlanBranchId || '',
          label: branch.label || '',
          display_order: index,
        })),
      ],
      stages: [
        ...mapStages(state.planNodes, 'plan', node => ({ variant_external_id: node.variantId })),
        ...mapStages(state.actualNodes, 'actual', node => ({ variant_external_id: node.variantId })),
        ...mapStages(state.branchNodes, 'branch_plan', node => ({ branch_external_id: node.branchId })),
        ...mapStages(state.actualBranchNodes, 'branch_actual', node => ({ branch_external_id: node.branchId })),
      ],
      mergeLinks: [
        ...(state.mergeLinks || []).map(link => ({
          external_id: link.id,
          merge_context: 'plan',
          branch_external_id: link.fromBranchId,
          source_stage_external_id: link.fromNodeId,
          target_stage_external_id: link.toNodeId || '',
          target_month: link.toDate || '',
          target_column_index: Number.isFinite(link.toCol) ? link.toCol : null,
        })),
        ...(state.actualMergeLinks || []).map(link => ({
          external_id: link.id,
          merge_context: 'actual',
          branch_external_id: link.fromBranchId,
          source_stage_external_id: link.fromNodeId,
          target_stage_external_id: link.toNodeId || '',
          target_month: link.toDate || '',
          target_column_index: Number.isFinite(link.toCol) ? link.toCol : null,
        })),
      ],
    };
  }

  function makeSubmitVersion(id, submittedAt, state) {
    return {
      id,
      projectId: PROJECT_ID,
      submittedAt,
      discussionDate: state.discussionDate,
      state: clone(state),
      payload: makePayload(state),
    };
  }

  function getDemoData() {
    const june = baseState('2024-06-20');
    const july = makeJulyState();
    const august = makeAugustState();
    const september = makeSeptemberState();
    const current = makeCurrentDraft();
    const versions = [
      makeSubmitVersion('demo-submit-2024-06-20', '2024-06-20T12:00:00.000Z', june),
      makeSubmitVersion('demo-submit-2024-07-20', '2024-07-20T12:00:00.000Z', july),
      makeSubmitVersion('demo-submit-2024-08-20', '2024-08-20T12:00:00.000Z', august),
      makeSubmitVersion('demo-submit-2024-09-20', '2024-09-20T12:00:00.000Z', september),
    ];

    return {
      projectId: PROJECT_ID,
      draft: current,
      baseline: september,
      submitVersions: versions,
      discussionCutoffDates: clone(CUTOFF_DATES),
      dataversePayload: {
        projectId: PROJECT_ID,
        savedAt: '2024-09-20T12:05:00.000Z',
        delta: {
          hasChanges: true,
          changedGroups: ['project', 'variants', 'branches', 'stages', 'mergeLinks'],
          current: makePayload(september),
          baseline: makePayload(august),
        },
        submitVersion: versions[versions.length - 1],
      },
    };
  }

  function getStorageKeys(projectId) {
    return {
      draft: `${STORAGE_PREFIX}:draft:${projectId}`,
      baseline: `${STORAGE_PREFIX}:baseline:${projectId}`,
      submitVersions: `${STORAGE_PREFIX}:submit-versions:${projectId}`,
      discussionCutoffs: `${STORAGE_PREFIX}:discussion-cutoffs:${projectId}`,
      dataversePayload: `${STORAGE_PREFIX}:dataverse-payload:${projectId}`,
    };
  }

  function writeJson(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  function seed(options) {
    const opts = { reload: true, ...(options || {}) };
    const data = getDemoData();
    const keys = getStorageKeys(data.projectId);
    const previousProjectId = window.localStorage.getItem(ACTIVE_PROJECT_KEY);

    if (previousProjectId && previousProjectId !== data.projectId) {
      window.localStorage.setItem(PREVIOUS_PROJECT_KEY, previousProjectId);
    }

    window.localStorage.setItem(ACTIVE_PROJECT_KEY, data.projectId);
    writeJson(keys.draft, data.draft);
    writeJson(keys.baseline, data.baseline);
    writeJson(keys.submitVersions, data.submitVersions);
    writeJson(keys.discussionCutoffs, data.discussionCutoffDates);
    writeJson(keys.dataversePayload, data.dataversePayload);

    if (opts.reload) window.location.reload();
    return data;
  }

  function remove(options) {
    const opts = { reload: true, ...(options || {}) };
    const keys = getStorageKeys(PROJECT_ID);
    const previousProjectId = window.localStorage.getItem(PREVIOUS_PROJECT_KEY);

    [
      keys.draft,
      keys.baseline,
      keys.submitVersions,
      keys.discussionCutoffs,
      keys.dataversePayload,
      PREVIOUS_PROJECT_KEY,
    ].forEach(key => window.localStorage.removeItem(key));

    if (previousProjectId) {
      window.localStorage.setItem(ACTIVE_PROJECT_KEY, previousProjectId);
    } else if (window.localStorage.getItem(ACTIVE_PROJECT_KEY) === PROJECT_ID) {
      window.localStorage.removeItem(ACTIVE_PROJECT_KEY);
    }

    if (opts.reload) window.location.reload();
    return { removedProjectId: PROJECT_ID, restoredProjectId: previousProjectId || '' };
  }

  window.ProjectTrackerCutoffDemo = {
    projectId: PROJECT_ID,
    cutoffDates: clone(CUTOFF_DATES),
    getDemoData,
    seed,
    remove,
  };
  window.seedProjectTrackerCutoffDemo = seed;
}());
