(function () {
  'use strict';

  const STORAGE_PREFIX = 'project-tracker';
  const ACTIVE_PROJECT_KEY = `${STORAGE_PREFIX}:activeProjectId`;
  const PREVIOUS_PROJECT_KEY = `${STORAGE_PREFIX}:multi-cutoff-demo:previousProjectId`;
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
    return rows.map((row, index) => ({
      id: `eop-${index + 1}`,
      label: row[0],
      date: row[1],
      col: dateToCol(row[1]),
      rowIndex: index,
      colIndex: 1,
    }));
  }

  function baseState(config, cutoffDate) {
    return {
      projectId: config.projectId,
      info: { ...config.info },
      variants: clone(config.variants),
      planNodes: [],
      actualNodes: [],
      branches: [],
      actualBranches: [],
      branchNodes: [],
      actualBranchNodes: [],
      mergeLinks: [],
      actualMergeLinks: [],
      stageShifts: [],
      leftTable: clone(config.leftTable),
      rightTable: { cols: ['Model Detail', 'Date- month/year'], rows: clone(config.eopRows) },
      remarks: '',
      years: clone(YEARS),
      eopDate: config.eopRows[0] ? config.eopRows[0][1] : '',
      eopItems: eopItems(config.eopRows),
      discussionDate: cutoffDate,
      milestoneTableVisible: true,
      labelPositions: {},
      remarkPosition: { x: 940, y: 520 },
      nid: 100,
    };
  }

  function mapStages(nodes, context, extra) {
    return (nodes || []).map((node, index) => ({
      external_id: node.id,
      stage_context: context,
      month: node.date || '',
      column_index: Number.isFinite(node.col) ? node.col : 0,
      shape: node.type || icon(1),
      top_label: node.topLabel || '',
      bottom_label: node.bottomLabel || '',
      is_drs: !!node.isDRS,
      drs_detail: node.drsDetail || '',
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
        layout_json: JSON.stringify({ labelPositions: state.labelPositions || {}, remarkPosition: state.remarkPosition || null }),
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

  function submitVersion(projectId, cutoffDate, state) {
    return {
      id: `${projectId}-submit-${cutoffDate}`,
      projectId,
      submittedAt: `${cutoffDate}T12:00:00.000Z`,
      discussionDate: cutoffDate,
      state: clone(state),
      payload: makePayload(state),
    };
  }

  function buildProject(config) {
    let state = baseState(config, CUTOFF_DATES[0]);
    const snapshots = CUTOFF_DATES.map((cutoffDate, index) => {
      state = clone(state);
      state.discussionDate = cutoffDate;
      config.steps[index](state);
      state.nid = 200 + index * 100;
      return clone(state);
    });
    const baseline = clone(snapshots[snapshots.length - 1]);
    const draft = clone(baseline);
    config.current(draft);
    draft.nid = 900;

    return {
      projectId: config.projectId,
      draft,
      baseline,
      submitVersions: snapshots.map((snapshot, index) => submitVersion(config.projectId, CUTOFF_DATES[index], snapshot)),
      discussionCutoffDates: clone(CUTOFF_DATES),
      dataversePayload: {
        projectId: config.projectId,
        savedAt: `${CUTOFF_DATES[CUTOFF_DATES.length - 1]}T12:05:00.000Z`,
        delta: { hasChanges: true, changedGroups: ['project', 'variants', 'branches', 'stages'], current: makePayload(baseline), baseline: makePayload(snapshots[snapshots.length - 2]) },
        submitVersion: submitVersion(config.projectId, CUTOFF_DATES[CUTOFF_DATES.length - 1], baseline),
      },
    };
  }

  const CONFIGS = [
    {
      projectId: 'demo-astra-compact',
      info: { project: 'Astra Compact Refresh', location: 'Pune', plant: 'Plant-A', type: 'MC', status: 'On Track', published: false },
      variants: [{ id: 'gas', name: 'DOM Gas' }, { id: 'cng', name: 'DOM CNG' }, { id: 'ev', name: 'EV Export' }],
      leftTable: { cols: ['Milestone', 'DOM Gas', 'DOM CNG', 'EV Export'], rows: [['DA', '2024-06', '2024-07', '2024-08'], ['SOS', '', '', ''], ['PP', '', '', ''], ['SOP', '', '', '']] },
      eopRows: [['DOM Gas EOP', '2025-03'], ['DOM CNG EOP', '2025-04'], ['EV Export EOP', '2025-06']],
      steps: [
        state => {
          state.planNodes.push(planStage('astra-gas-da', 'gas', '2024-06', 'DA', 'Beg', icon(1), { isDRS: true, drsDetail: 'Gas DA approved at June cutoff.' }));
          state.planNodes.push(planStage('astra-cng-da', 'cng', '2024-07', 'DA', 'Mid', icon(2)));
          state.actualNodes.push(actualStage('astra-gas-kickoff', 'gas', '2024-06-18', 'Kickoff', icon(3)));
          state.remarks = 'June cutoff: Gas and CNG base plan locked.';
        },
        state => {
          state.info.status = 'Delayed';
          state.planNodes.push(planStage('astra-gas-sos', 'gas', '2024-10', 'SOS', 'End', icon(4), { isDRS: true, drsDetail: 'Gas SOS DRS opened after supplier review.' }));
          state.planNodes.push(planStage('astra-cng-sos', 'cng', '2024-11', 'SOS', 'Beg', icon(5)));
          state.planNodes.push(planStage('astra-ev-da', 'ev', '2024-08', 'DA', 'Mid', icon(6)));
          state.actualNodes.push(actualStage('astra-gas-da', 'gas', '2024-07-18', 'DA', icon(1)));
          state.branches.push({ id: 'astra-gas-supply', variantId: 'gas', parentNodeId: 'astra-gas-da', sourceNodeId: 'astra-gas-da', sourceCol: dateToCol('2024-06'), sourceDate: '2024-06', label: 'Gas supplier branch' });
          state.branchNodes.push(branchStage('astra-gas-trial', 'astra-gas-supply', '2024-08', 'Trial', 'Mid', icon(7)));
          state.mergeLinks.push({ id: 'astra-gas-supply-merge', fromNodeId: 'astra-gas-trial', fromBranchId: 'astra-gas-supply', toNodeId: 'astra-gas-sos', toDate: '2024-10', toCol: dateToCol('2024-10') });
          state.leftTable.rows[1] = ['SOS', '2024-10', '2024-11', ''];
          state.remarks = 'July cutoff: supplier branch and EV export variant added.';
        },
        state => {
          state.info.status = 'At Risk';
          state.planNodes.push(planStage('astra-ev-sos', 'ev', '2024-12', 'SOS', 'End', icon(8)));
          state.planNodes.push(planStage('astra-gas-pp', 'gas', '2025-01', 'PP', 'Mid', icon(9)));
          state.actualNodes.push(actualStage('astra-gas-sos', 'gas', '2024-08-22', 'SOS', icon(4), { isDRS: true, drsDetail: 'Actual SOS slipped after branch trial.' }));
          state.actualBranches.push({ id: 'astra-gas-recovery', variantId: 'gas', parentNodeId: 'astra-gas-da', sourceNodeId: 'astra-gas-da', sourceCol: dateToCol('2024-07'), sourceDate: '2024-07-18', sourcePlanBranchId: 'astra-gas-supply', label: 'Actual recovery branch' });
          state.actualBranchNodes.push(actualBranchStage('astra-gas-recovery-trial', 'astra-gas-recovery', '2024-09-10', 'Recovery', icon(10)));
          state.stageShifts.push({ id: 'astra-gas-sos-pre', sourceNodeId: 'astra-gas-sos', sourceContext: 'plan', mode: 'preponed', targetDate: '2024-09', targetCol: dateToCol('2024-09'), drsDetail: 'Preponed Gas SOS for management review.' });
          state.leftTable.rows[2] = ['PP', '2025-01', '', ''];
          state.remarks = 'August cutoff: recovery branch and preponed SOS marker finalized.';
        },
        state => {
          state.info.status = 'Delayed';
          state.info.published = true;
          state.planNodes.push(planStage('astra-cng-pp', 'cng', '2025-02', 'PP', 'End', icon(10)));
          state.planNodes.push(planStage('astra-ev-pp', 'ev', '2025-03', 'PP', 'Beg', icon(11)));
          state.actualNodes.push(actualStage('astra-cng-da', 'cng', '2024-09-05', 'DA', icon(2)));
          state.actualNodes.push(actualStage('astra-ev-da', 'ev', '2024-09-18', 'DA', icon(6), { isDRS: true, drsDetail: 'EV export DA evidence complete.' }));
          state.branches.push({ id: 'astra-ev-homologation', variantId: 'ev', parentNodeId: 'astra-ev-da', sourceNodeId: 'astra-ev-da', sourceCol: dateToCol('2024-08'), sourceDate: '2024-08', label: 'EV homologation' });
          state.branchNodes.push(branchStage('astra-ev-cert', 'astra-ev-homologation', '2025-04', 'CERT', 'End', icon(5)));
          state.mergeLinks.push({ id: 'astra-ev-merge', fromNodeId: 'astra-ev-cert', fromBranchId: 'astra-ev-homologation', toNodeId: '', toDate: '2025-06', toCol: dateToCol('2025-06') });
          state.leftTable.rows[3] = ['SOP', '2025-05', '2025-06', '2025-07'];
          state.remarks = 'September cutoff: final submitted portfolio baseline.';
        },
      ],
      current: state => {
        state.info.status = 'At Risk';
        state.info.published = false;
        state.planNodes.push(planStage('astra-gas-sop-current', 'gas', '2025-05', 'SOP', 'Mid', icon(6), { isDRS: true, drsDetail: 'Current-only SOP DRS note.' }));
        state.actualNodes.push(actualStage('astra-gas-current-build', 'gas', '2024-10-08', 'Build', icon(9)));
        state.remarks = 'CURRENT: October edits are visible only in Current.';
      },
    },
    {
      projectId: 'demo-orion-suv',
      info: { project: 'Orion SUV Launch', location: 'Chakan', plant: 'Plant-B', type: 'FMC', status: 'On Track', published: false },
      variants: [{ id: 'petrol', name: 'Petrol AT' }, { id: 'diesel', name: 'Diesel MT' }],
      leftTable: { cols: ['Milestone', 'Petrol AT', 'Diesel MT'], rows: [['DA', '2024-08', '2024-09'], ['SOS', '', ''], ['PP', '', ''], ['SOP', '', '']] },
      eopRows: [['Petrol AT EOP', '2025-08'], ['Diesel MT EOP', '2025-10']],
      steps: [
        state => {
          state.planNodes.push(planStage('orion-petrol-da', 'petrol', '2024-08', 'DA', 'Beg', icon(2)));
          state.planNodes.push(planStage('orion-diesel-da', 'diesel', '2024-09', 'DA', 'Mid', icon(3)));
          state.actualNodes.push(actualStage('orion-style-freeze', 'petrol', '2024-06-14', 'Style', icon(4)));
          state.remarks = 'June cutoff: SUV concept and DA windows aligned.';
        },
        state => {
          state.planNodes.push(planStage('orion-petrol-sos', 'petrol', '2024-12', 'SOS', 'Mid', icon(5), { isDRS: true, drsDetail: 'Petrol SOS needs supplier BOM closure.' }));
          state.planNodes.push(planStage('orion-diesel-sos', 'diesel', '2025-01', 'SOS', 'End', icon(6)));
          state.actualNodes.push(actualStage('orion-petrol-da', 'petrol', '2024-07-25', 'DA', icon(2)));
          state.leftTable.rows[1] = ['SOS', '2024-12', '2025-01'];
          state.remarks = 'July cutoff: SOS dates shifted later than compact project.';
        },
        state => {
          state.info.status = 'At Risk';
          state.branches.push({ id: 'orion-diesel-emission', variantId: 'diesel', parentNodeId: 'orion-diesel-da', sourceNodeId: 'orion-diesel-da', sourceCol: dateToCol('2024-09'), sourceDate: '2024-09', label: 'Emission calibration' });
          state.branchNodes.push(branchStage('orion-diesel-cal', 'orion-diesel-emission', '2024-11', 'CAL', 'Mid', icon(7), { isDRS: true, drsDetail: 'Emission calibration action list opened.' }));
          state.mergeLinks.push({ id: 'orion-diesel-cal-merge', fromNodeId: 'orion-diesel-cal', fromBranchId: 'orion-diesel-emission', toNodeId: 'orion-diesel-sos', toDate: '2025-01', toCol: dateToCol('2025-01') });
          state.planNodes.push(planStage('orion-petrol-pp', 'petrol', '2025-03', 'PP', 'Beg', icon(8)));
          state.actualNodes.push(actualStage('orion-diesel-readiness', 'diesel', '2024-08-19', 'Ready', icon(3)));
          state.leftTable.rows[2] = ['PP', '2025-03', ''];
          state.remarks = 'August cutoff: diesel emission branch started.';
        },
        state => {
          state.info.published = true;
          state.planNodes.push(planStage('orion-diesel-pp', 'diesel', '2025-04', 'PP', 'Mid', icon(9)));
          state.planNodes.push(planStage('orion-petrol-sop', 'petrol', '2025-07', 'SOP', 'End', icon(10)));
          state.actualNodes.push(actualStage('orion-petrol-sos', 'petrol', '2024-09-28', 'SOS', icon(5)));
          state.stageShifts.push({ id: 'orion-diesel-pp-post', sourceNodeId: 'orion-diesel-pp', sourceContext: 'plan', mode: 'postponed', targetDate: '2025-05', targetCol: dateToCol('2025-05'), drsDetail: 'Diesel PP moved after calibration retest.' });
          state.leftTable.rows[3] = ['SOP', '2025-07', '2025-08'];
          state.remarks = 'September cutoff: SUV baseline includes postponed diesel PP risk.';
        },
      ],
      current: state => {
        state.info.status = 'Delayed';
        state.planNodes.push(planStage('orion-diesel-sop-current', 'diesel', '2025-08', 'SOP', 'Mid', icon(11)));
        state.actualNodes.push(actualStage('orion-current-cal', 'diesel', '2024-10-15', 'CAL', icon(7), { isDRS: true, drsDetail: 'Current-only calibration evidence.' }));
        state.remarks = 'CURRENT: Orion has October diesel calibration actuals.';
      },
    },
    {
      projectId: 'demo-vega-ev',
      info: { project: 'Vega EV Platform', location: 'Sanand', plant: 'Plant-C', type: 'EV', status: 'On Track', published: false },
      variants: [{ id: 'standard', name: 'Standard Range' }, { id: 'long', name: 'Long Range' }],
      leftTable: { cols: ['Milestone', 'Standard Range', 'Long Range'], rows: [['DA', '2024-07', '2024-08'], ['SOS', '', ''], ['PP', '', ''], ['SOP', '', '']] },
      eopRows: [['Standard Range EOP', '2026-01'], ['Long Range EOP', '2026-03']],
      steps: [
        state => {
          state.planNodes.push(planStage('vega-standard-da', 'standard', '2024-07', 'DA', 'Mid', icon(6), { isDRS: true, drsDetail: 'Battery pack concept approved.' }));
          state.planNodes.push(planStage('vega-long-da', 'long', '2024-08', 'DA', 'End', icon(8)));
          state.actualNodes.push(actualStage('vega-pack-kickoff', 'standard', '2024-06-27', 'Pack', icon(6)));
          state.remarks = 'June cutoff: EV platform kicks off after battery concept freeze.';
        },
        state => {
          state.planNodes.push(planStage('vega-standard-sos', 'standard', '2024-11', 'SOS', 'Beg', icon(9)));
          state.actualNodes.push(actualStage('vega-standard-da', 'standard', '2024-07-16', 'DA', icon(6)));
          state.branches.push({ id: 'vega-homologation', variantId: 'long', parentNodeId: 'vega-long-da', sourceNodeId: 'vega-long-da', sourceCol: dateToCol('2024-08'), sourceDate: '2024-08', label: 'Homologation path' });
          state.branchNodes.push(branchStage('vega-homo-test', 'vega-homologation', '2024-10', 'HOMO', 'Beg', icon(10)));
          state.leftTable.rows[1] = ['SOS', '2024-11', ''];
          state.remarks = 'July cutoff: homologation path opened for Long Range.';
        },
        state => {
          state.info.status = 'At Risk';
          state.planNodes.push(planStage('vega-long-sos', 'long', '2025-01', 'SOS', 'Mid', icon(11)));
          state.planNodes.push(planStage('vega-standard-pp', 'standard', '2025-04', 'PP', 'End', icon(12)));
          state.actualNodes.push(actualStage('vega-long-da', 'long', '2024-08-23', 'DA', icon(8), { isDRS: true, drsDetail: 'Long Range DA evidence delayed by cell supplier.' }));
          state.branchNodes.push(branchStage('vega-cert', 'vega-homologation', '2025-02', 'CERT', 'Mid', icon(5)));
          state.mergeLinks.push({ id: 'vega-homo-merge', fromNodeId: 'vega-cert', fromBranchId: 'vega-homologation', toNodeId: '', toDate: '2025-03', toCol: dateToCol('2025-03') });
          state.leftTable.rows[2] = ['PP', '2025-04', ''];
          state.remarks = 'August cutoff: certification branch extended into 2025.';
        },
        state => {
          state.info.published = true;
          state.planNodes.push(planStage('vega-long-pp', 'long', '2025-05', 'PP', 'Beg', icon(2)));
          state.planNodes.push(planStage('vega-standard-sop', 'standard', '2025-09', 'SOP', 'Mid', icon(3)));
          state.actualNodes.push(actualStage('vega-standard-sos', 'standard', '2024-09-12', 'SOS', icon(9)));
          state.actualBranches.push({ id: 'vega-actual-pack-rework', variantId: 'standard', parentNodeId: 'vega-standard-sos', sourceNodeId: 'vega-standard-sos', sourceCol: dateToCol('2024-09'), sourceDate: '2024-09-12', label: 'Pack rework' });
          state.actualBranchNodes.push(actualBranchStage('vega-pack-rework-build', 'vega-actual-pack-rework', '2024-10-04', 'Rework', icon(4)));
          state.leftTable.rows[3] = ['SOP', '2025-09', '2025-10'];
          state.remarks = 'September cutoff: EV platform submitted with pack rework actual branch.';
        },
      ],
      current: state => {
        state.info.status = 'At Risk';
        state.planNodes.push(planStage('vega-long-sop-current', 'long', '2025-10', 'SOP', 'End', icon(5), { isDRS: true, drsDetail: 'Current-only Long Range SOP DRS.' }));
        state.stageShifts.push({ id: 'vega-standard-sop-post', sourceNodeId: 'vega-standard-sop', sourceContext: 'plan', mode: 'postponed', targetDate: '2025-10', targetCol: dateToCol('2025-10'), drsDetail: 'Current-only SOP shift for pack validation.' });
        state.remarks = 'CURRENT: Vega adds Long Range SOP and a current-only SOP shift.';
      },
    },
  ];

  function getDemoData() {
    const projects = CONFIGS.map(buildProject);
    return {
      projectIds: projects.map(project => project.projectId),
      cutoffDates: clone(CUTOFF_DATES),
      projects,
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
    const previousProjectId = window.localStorage.getItem(ACTIVE_PROJECT_KEY);
    if (previousProjectId && !data.projectIds.includes(previousProjectId)) {
      window.localStorage.setItem(PREVIOUS_PROJECT_KEY, previousProjectId);
    }

    data.projects.forEach(project => {
      const keys = getStorageKeys(project.projectId);
      writeJson(keys.draft, project.draft);
      writeJson(keys.baseline, project.baseline);
      writeJson(keys.submitVersions, project.submitVersions);
      writeJson(keys.discussionCutoffs, project.discussionCutoffDates);
      writeJson(keys.dataversePayload, project.dataversePayload);
    });
    window.localStorage.setItem(ACTIVE_PROJECT_KEY, data.projectIds[0]);

    if (opts.reload) window.location.reload();
    return data;
  }

  function remove(options) {
    const opts = { reload: true, ...(options || {}) };
    const data = getDemoData();
    data.projectIds.forEach(projectId => {
      const keys = getStorageKeys(projectId);
      [keys.draft, keys.baseline, keys.submitVersions, keys.discussionCutoffs, keys.dataversePayload]
        .forEach(key => window.localStorage.removeItem(key));
    });

    const previousProjectId = window.localStorage.getItem(PREVIOUS_PROJECT_KEY);
    window.localStorage.removeItem(PREVIOUS_PROJECT_KEY);
    if (previousProjectId) {
      window.localStorage.setItem(ACTIVE_PROJECT_KEY, previousProjectId);
    } else if (data.projectIds.includes(window.localStorage.getItem(ACTIVE_PROJECT_KEY))) {
      window.localStorage.removeItem(ACTIVE_PROJECT_KEY);
    }

    if (opts.reload) window.location.reload();
    return { removedProjectIds: data.projectIds, restoredProjectId: previousProjectId || '' };
  }

  window.ProjectTrackerMultiDemo = {
    projectIds: CONFIGS.map(config => config.projectId),
    cutoffDates: clone(CUTOFF_DATES),
    getDemoData,
    seed,
    remove,
  };
  window.seedProjectTrackerMultiDemo = seed;
}());
