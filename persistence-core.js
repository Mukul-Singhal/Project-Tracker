(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ProjectTrackerPersistence = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const STORAGE_PREFIX = 'project-tracker';
  const ACTIVE_PROJECT_KEY = `${STORAGE_PREFIX}:activeProjectId`;

  function getStorageKeys(projectId) {
    return {
      draft: `${STORAGE_PREFIX}:draft:${projectId}`,
      baseline: `${STORAGE_PREFIX}:baseline:${projectId}`
    };
  }

  function stableStringify(value) {
    return JSON.stringify(sortValue(value));
  }

  function sortValue(value) {
    if (Array.isArray(value)) return value.map(sortValue);
    if (!value || typeof value !== 'object') return value;
    return Object.keys(value).sort().reduce((acc, key) => {
      acc[key] = sortValue(value[key]);
      return acc;
    }, {});
  }

  function cloneState(state) {
    return JSON.parse(JSON.stringify(state));
  }

  function normalizeStateForPersistence(state) {
    const copy = cloneState(state);
    delete copy._dirty;
    delete copy._syncStatus;
    return copy;
  }

  function isDirty(draft, baseline) {
    return stableStringify(normalizeStateForPersistence(draft)) !== stableStringify(normalizeStateForPersistence(baseline));
  }

  function createDataversePayload(state) {
    const s = normalizeStateForPersistence(state);
    const project = {
      external_id: s.projectId || '',
      name: s.info?.project || '',
      location: s.info?.location || '',
      plant: s.info?.plant || '',
      project_type: s.info?.type || '',
      status: s.info?.status || '',
      published: !!s.info?.published,
      eop_date: s.eopDate || '',
      years_json: JSON.stringify(s.years || []),
      remarks: s.remarks || '',
      milestone_table_json: JSON.stringify(s.leftTable || { cols: [], rows: [] }),
      eop_table_json: JSON.stringify(s.rightTable || { cols: [], rows: [] }),
      layout_json: JSON.stringify({
        labelPositions: s.labelPositions || {},
        remarkPosition: s.remarkPosition || null,
        nid: s.nid || 1
      })
    };

    return {
      project,
      variants: (s.variants || []).map((variant, index) => ({
        external_id: variant.id,
        name: variant.name || '',
        display_order: index
      })),
      branches: (s.branches || []).map((branch, index) => ({
        external_id: branch.id,
        variant_external_id: branch.variantId,
        parent_stage_external_id: branch.parentNodeId,
        label: branch.label || '',
        display_order: index
      })),
      stages: [
        ...mapStages(s.planNodes, 'plan', node => ({ variant_external_id: node.variantId })),
        ...mapStages(s.actualNodes, 'actual', node => ({ variant_external_id: node.variantId })),
        ...mapStages(s.branchNodes, 'branch_plan', node => ({ branch_external_id: node.branchId })),
        ...mapStages(s.actualBranchNodes, 'branch_actual', node => ({ branch_external_id: node.branchId }))
      ],
      mergeLinks: (s.mergeLinks || []).map(link => ({
        external_id: link.id,
        branch_external_id: link.fromBranchId,
        source_stage_external_id: link.fromNodeId,
        target_stage_external_id: link.toNodeId
      }))
    };
  }

  function createDataverseDelta(draft, baseline) {
    const nextPayload = createDataversePayload(draft);
    const prevPayload = createDataversePayload(baseline || {});
    const changedGroups = ['project', 'variants', 'branches', 'stages', 'mergeLinks'].filter(group => {
      return stableStringify(nextPayload[group]) !== stableStringify(prevPayload[group]);
    });

    return {
      hasChanges: changedGroups.length > 0,
      changedGroups,
      current: nextPayload,
      baseline: prevPayload
    };
  }

  function mapStages(nodes, context, extra) {
    return (nodes || []).map((node, index) => ({
      external_id: node.id,
      stage_context: context,
      month: node.date || '',
      column_index: Number.isFinite(node.col) ? node.col : 0,
      shape: node.type || 'square',
      top_label: node.topLabel || '',
      bottom_label: node.bottomLabel || '',
      display_order: index,
      ...extra(node)
    }));
  }

  return {
    ACTIVE_PROJECT_KEY,
    STORAGE_PREFIX,
    getStorageKeys,
    stableStringify,
    cloneState,
    normalizeStateForPersistence,
    isDirty,
    createDataversePayload,
    createDataverseDelta
  };
});
