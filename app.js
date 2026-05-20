// ════════════════════════════════════════════════════════════════
// § 1  CONSTANTS + CORE UTILITIES
// ════════════════════════════════════════════════════════════════

const COL = 52, ROH = 90, YH = 34, MH = 30;
const SHIFT_ARROW_ARCH = 46;
const $ = id => document.getElementById(id);
const NODE_SHAPES = [{ value: 'square', label: 'Square' }, { value: 'circle', label: 'Circle' }];
const STORAGE_PREFIX = 'project-tracker';
const ACTIVE_PROJECT_KEY = `${STORAGE_PREFIX}:activeProjectId`;

const fmtDate = d => {
  if (!d) return '';
  const [y, m] = d.split('-');
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m - 1] + ' ' + y;
};

function cloneState(v) {
  return JSON.parse(JSON.stringify(v));
}

function stableStringify(value) {
  function sortVal(val) {
    if (Array.isArray(val)) return val.map(sortVal);
    if (!val || typeof val !== 'object') return val;
    return Object.keys(val).sort().reduce((acc, k) => { acc[k] = sortVal(val[k]); return acc; }, {});
  }
  return JSON.stringify(sortVal(value));
}

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

// ════════════════════════════════════════════════════════════════
// § 2  STORE  ─  Zustand-style reactive store
// ════════════════════════════════════════════════════════════════

function createStore(initializer) {
  let state;
  const listeners = new Set();

  const set = (partial) => {
    const next = typeof partial === 'function' ? partial(state) : partial;
    state = Object.assign({}, state, next);
    listeners.forEach(fn => fn(state));
  };

  const get = () => state;

  const subscribe = (fn) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  };

  state = initializer(set, get);
  return { getState: get, setState: set, subscribe };
}

const INITIAL_DATA = {
  projectId: '',
  info: { project: 'Swift Facelift 2024', location: 'SMG', plant: 'Plant-C', type: 'MC', status: 'Delayed', published: false },
  variants: [],
  planNodes: [],
  actualNodes: [],
  branches: [],
  branchNodes: [],
  actualBranchNodes: [],
  mergeLinks: [],
  stageShifts: [],
  leftTable: { cols: ['Milestone', 'DOM Gas', 'DOM CNG'], rows: [['DA', '', ''], ['SOS', '', '']] },
  rightTable: { cols: ['Model Detail', 'Date- month/year'], rows: [['', '']] },
  remarks: '',
  years: [2024, 2025],
  eopDate: '',
  eopItems: [],
  discussionDate: '2024-09',
  milestoneTableVisible: false,
  labelPositions: {},
  remarkPosition: null,
  nid: 1,
};

const store = createStore((set, get) => ({
  ...cloneState(INITIAL_DATA),

  // ── Project meta ──
  setProjectId: (id) => set({ projectId: id }),
  setInfo: (partial) => set(s => ({ info: { ...s.info, ...partial } })),
  setPublished: (val) => set(s => ({ info: { ...s.info, published: val } })),

  // ── Timeline ──
  setEopDate: (date) => set({ eopDate: date }),
  setEopItems: (items) => set({ eopItems: items || [] }),
  addYear: () => set(s => ({ years: [...s.years, s.years[s.years.length - 1] + 1] })),
  ensureYearVisible: (date) => {
    const match = String(date || '').trim().match(/^(\d{4})-(\d{1,2})$/);
    if (!match) return;
    const target = Number(match[1]);
    set(s => {
      if (s.years[s.years.length - 1] >= target) return {};
      const years = [...s.years];
      while (years[years.length - 1] < target) years.push(years[years.length - 1] + 1);
      return { years };
    });
  },

  // ── Remarks + layout ──
  setRemarks: (text) => set({ remarks: text }),
  setRemarkPosition: (pos) => set({ remarkPosition: pos }),
  setLabelPosition: (key, pos) => set(s => ({ labelPositions: { ...s.labelPositions, [key]: pos } })),
  showMilestoneTable: () => set({ milestoneTableVisible: true }),

  // ── Variants ──
  addVariant: (name) => set(s => ({
    variants: [...s.variants, { id: 'i' + s.nid, name }],
    nid: s.nid + 1,
  })),
  deleteVariant: (id) => set(s => {
    const bids = new Set(s.branches.filter(b => b.variantId === id).map(b => b.id));
    const remainingPlanIds = new Set(s.planNodes.filter(n => n.variantId !== id).map(n => n.id));
    const removedNodeIds = new Set([
      ...s.planNodes.filter(n => n.variantId === id).map(n => n.id),
      ...s.actualNodes.filter(n => n.variantId === id).map(n => n.id),
      ...s.branchNodes.filter(n => bids.has(n.branchId)).map(n => n.id),
      ...s.actualBranchNodes.filter(n => bids.has(n.branchId)).map(n => n.id),
    ]);
    return {
      variants: s.variants.filter(v => v.id !== id),
      planNodes: s.planNodes.filter(n => n.variantId !== id),
      actualNodes: s.actualNodes.filter(n => n.variantId !== id),
      branches: s.branches.filter(b => b.variantId !== id),
      branchNodes: s.branchNodes.filter(n => !bids.has(n.branchId)),
      actualBranchNodes: s.actualBranchNodes.filter(n => !bids.has(n.branchId)),
      mergeLinks: s.mergeLinks.filter(l => !bids.has(l.fromBranchId) && (!l.toNodeId || remainingPlanIds.has(l.toNodeId))),
      stageShifts: s.stageShifts.filter(shift => !removedNodeIds.has(shift.sourceNodeId)),
    };
  }),

  // ── Plan nodes ──
  addPlanNode: (data) => set(s => ({
    planNodes: [...s.planNodes, { id: 'i' + s.nid, isDRS: false, drsDetail: '', ...data }],
    nid: s.nid + 1,
  })),
  removePlanNode: (id) => set(s => ({ planNodes: s.planNodes.filter(n => n.id !== id), ...removeStageShiftsForNodeData(s, id) })),
  movePlanNode: (id, col) => set(s => ({ planNodes: s.planNodes.map(n => n.id === id ? { ...n, col } : n) })),

  // ── Actual nodes ──
  addActualNode: (data) => set(s => ({
    actualNodes: [...s.actualNodes, { id: 'i' + s.nid, isDRS: false, drsDetail: '', ...data }],
    nid: s.nid + 1,
  })),
  removeActualNode: (id) => set(s => ({ actualNodes: s.actualNodes.filter(n => n.id !== id), ...removeStageShiftsForNodeData(s, id) })),
  moveActualNode: (id, col) => set(s => ({ actualNodes: s.actualNodes.map(n => n.id === id ? { ...n, col } : n) })),

  // ── Branch nodes ──
  addBranchNode: (data) => set(s => ({
    branchNodes: [...s.branchNodes, { id: 'i' + s.nid, isDRS: false, drsDetail: '', ...data }],
    mergeLinks: s.mergeLinks.filter(l => l.fromBranchId !== data.branchId),
    nid: s.nid + 1,
  })),
  removeBranchNode: (id) => set(s => removeBranchNodeData(s, id)),
  moveBranchNode: (id, col) => set(s => ({ branchNodes: s.branchNodes.map(n => n.id === id ? { ...n, col } : n) })),

  // ── Actual branch nodes ──
  addActualBranchNode: (data) => set(s => ({
    actualBranchNodes: [...s.actualBranchNodes, { id: 'i' + s.nid, isDRS: false, drsDetail: '', ...data }],
    nid: s.nid + 1,
  })),
  removeActualBranchNode: (id) => set(s => ({ actualBranchNodes: s.actualBranchNodes.filter(n => n.id !== id), ...removeStageShiftsForNodeData(s, id) })),
  moveActualBranchNode: (id, col) => set(s => ({ actualBranchNodes: s.actualBranchNodes.map(n => n.id === id ? { ...n, col } : n) })),

  // ── Branches ──
  addBranch: (data) => set(s => {
    const branch = { id: 'i' + s.nid, ...data };
    const insertAt = s.branches.reduce((idx, b, i) => b.variantId === data.variantId ? i + 1 : idx, s.branches.length);
    const branches = [...s.branches];
    branches.splice(insertAt, 0, branch);
    return { branches, nid: s.nid + 1 };
  }),
  removeBranch: (branchId) => set(s => removeBranchData(s, branchId)),

  copyPlanToActual: () => set(s => copyPlanToActualData(s)),

  // ── Merge links ──
  addMergeLink: (data) => set(s => ({
    mergeLinks: [
      ...s.mergeLinks.filter(l => l.fromNodeId !== data.fromNodeId),
      { id: 'i' + s.nid, ...data },
    ],
    nid: s.nid + 1,
  })),
  removeMergeLinksForNode: (nodeId) => set(s => ({
    mergeLinks: s.mergeLinks.filter(l => l.fromNodeId !== nodeId && l.toNodeId !== nodeId),
  })),
  removeMergeLinksForBranch: (branchId) => set(s => ({
    mergeLinks: s.mergeLinks.filter(l => l.fromBranchId !== branchId),
  })),

  // ── Preponed / postponed stage markers ──
  addStageShift: (data) => set(s => addStageShiftData(s, data)),

  // ── Left (Milestone) table ──
  updateLeftTableCell: (ri, ci, v) => set(s => ({
    leftTable: { ...s.leftTable, rows: s.leftTable.rows.map((r, i) => i === ri ? r.map((c, j) => j === ci ? v : c) : r) },
  })),
  updateLeftTableColName: (ci, name) => set(s => ({
    leftTable: { ...s.leftTable, cols: s.leftTable.cols.map((c, i) => i === ci ? name : c) },
  })),
  addLeftTableRow: () => set(s => ({
    leftTable: { ...s.leftTable, rows: [...s.leftTable.rows, Array(s.leftTable.cols.length).fill('')] },
  })),
  addLeftTableCol: () => set(s => ({
    leftTable: { cols: [...s.leftTable.cols, 'New Col'], rows: s.leftTable.rows.map(r => [...r, '']) },
  })),
  deleteLeftTableRow: (ri) => set(s => ({
    leftTable: { ...s.leftTable, rows: s.leftTable.rows.filter((_, i) => i !== ri) },
  })),
  deleteLeftTableCol: (ci) => set(s => ({
    leftTable: {
      cols: s.leftTable.cols.filter((_, i) => i !== ci),
      rows: s.leftTable.rows.map(r => r.filter((_, i) => i !== ci)),
    },
  })),

  // ── Right (EOP) table ──
  updateRightTableCell: (ri, ci, v) => set(s => ({
    rightTable: { ...s.rightTable, rows: s.rightTable.rows.map((r, i) => i === ri ? r.map((c, j) => j === ci ? v : c) : r) },
  })),
  updateRightTableColName: (ci, name) => set(s => ({
    rightTable: { ...s.rightTable, cols: s.rightTable.cols.map((c, i) => i === ci ? name : c) },
  })),
  addRightTableRow: () => set(s => ({
    rightTable: { ...s.rightTable, rows: [...s.rightTable.rows, Array(s.rightTable.cols.length).fill('')] },
  })),
  addRightTableCol: () => set(s => ({
    rightTable: { cols: [...s.rightTable.cols, 'New Col'], rows: s.rightTable.rows.map(r => [...r, '']) },
  })),
  deleteRightTableRow: (ri) => set(s => ({
    rightTable: { ...s.rightTable, rows: s.rightTable.rows.filter((_, i) => i !== ri) },
  })),
  deleteRightTableCol: (ci) => set(s => ({
    rightTable: {
      cols: s.rightTable.cols.filter((_, i) => i !== ci),
      rows: s.rightTable.rows.map(r => r.filter((_, i) => i !== ci)),
    },
  })),

  // ── Full state replacement (used by persistence layer) ──
  replaceState: (nextState) => set(() => ({
    ...cloneState(INITIAL_DATA),
    ...cloneState(nextState),
    info: { ...INITIAL_DATA.info, ...(nextState.info || {}) },
    leftTable: nextState.leftTable ? cloneState(nextState.leftTable) : cloneState(INITIAL_DATA.leftTable),
    rightTable: nextState.rightTable ? cloneState(nextState.rightTable) : cloneState(INITIAL_DATA.rightTable),
    variants: nextState.variants || [],
    planNodes: nextState.planNodes || [],
    actualNodes: nextState.actualNodes || [],
    branches: nextState.branches || [],
    branchNodes: nextState.branchNodes || [],
    actualBranchNodes: nextState.actualBranchNodes || [],
    mergeLinks: nextState.mergeLinks || [],
    stageShifts: nextState.stageShifts || [],
    years: nextState.years ? cloneState(nextState.years) : cloneState(INITIAL_DATA.years),
    labelPositions: nextState.labelPositions || {},
    eopDate: nextState.eopDate || '',
    eopItems: nextState.eopItems || [],
    discussionDate: nextState.discussionDate || INITIAL_DATA.discussionDate,
    milestoneTableVisible: !!nextState.milestoneTableVisible,
    remarks: nextState.remarks || '',
    remarkPosition: nextState.remarkPosition || null,
  })),
}));

// ════════════════════════════════════════════════════════════════
// § 3  DOMAIN  ─  pure functions (no DOM, no store mutations)
// ════════════════════════════════════════════════════════════════

const totalCols = (state) => state.years.length * 12;
const hasEopLane = (state) => !!state.eopDate || !!(state.eopItems && state.eopItems.length);
const getTopOffset = (state) => hasEopLane(state) ? ROH : 0;

function getBranchesForVariant(state, variantId) {
  return state.branches.filter(b => b.variantId === variantId);
}

function getPlanLanes(state) {
  return state.variants.flatMap(v => [
    { type: 'plan', variantId: v.id, label: v.name },
    ...getBranchesForVariant(state, v.id).map(b => ({
      type: 'branch', branchId: b.id, variantId: v.id, label: b.label,
    })),
  ]);
}

function getActualLanes(state) {
  return state.variants.flatMap(v => [
    { type: 'actual', variantId: v.id, label: v.name },
    ...getBranchesForVariant(state, v.id).map(b => ({
      type: 'actualBranch', branchId: b.id, variantId: v.id, label: b.label,
    })),
  ]);
}

function findPlanLaneIndex(state, type, id) {
  return getPlanLanes(state).findIndex(l =>
    type === 'plan' ? l.variantId === id && l.type === 'plan' : l.branchId === id && l.type === 'branch'
  );
}

function findActualLaneIndex(state, type, id) {
  return getActualLanes(state).findIndex(l =>
    type === 'actual' ? l.variantId === id && l.type === 'actual' : l.branchId === id && l.type === 'actualBranch'
  );
}

const getPlannedH = (state) => getPlanLanes(state).length * ROH;
const getActualH = (state) => getActualLanes(state).length * ROH;
const getDividerH = (state) => state.variants.length ? 4 : 0;
const getGridGroupH = (state) => getTopOffset(state) + getPlannedH(state) + getDividerH(state) + getActualH(state);
const getSidebarH = (state) => getGridGroupH(state);

function dateToCol(date, state) {
  if (!date) return -1;
  const match = String(date).trim().match(/^(\d{4})-(\d{1,2})$/);
  if (!match) return -1;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const yearIndex = state.years.indexOf(year);
  if (yearIndex < 0 || month < 1 || month > 12) return -1;
  return yearIndex * 12 + month - 1;
}

function colToDate(col, state) {
  const year = state.years[Math.floor(col / 12)];
  const month = (col % 12) + 1;
  if (!year || month < 1 || month > 12) return '';
  return `${year}-${String(month).padStart(2, '0')}`;
}

function getDiscussionPeriodCols(state) {
  const current = dateToCol(state.discussionDate, state);
  const maxCol = totalCols(state) - 1;
  if (current < 0 || maxCol < 0) return { prev: null, current: null, next: null };
  return {
    prev: current > 0 ? current - 1 : null,
    current,
    next: current < maxCol ? current + 1 : null,
  };
}

function getDiscussionPeriodClass(col, state) {
  const cols = getDiscussionPeriodCols(state);
  if (col === cols.current) return 'discussion-current';
  if (col === cols.prev) return 'discussion-prev';
  if (col === cols.next) return 'discussion-next';
  return '';
}

function normalizeMonthInput(raw) {
  raw = String(raw || '').trim();
  if (/^\d{4}-\d{2}$/.test(raw)) return raw;
  const monthYear = raw.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})$/i);
  if (monthYear) {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    return `${monthYear[2]}-${String(months.indexOf(monthYear[1].slice(0, 3).toLowerCase()) + 1).padStart(2, '0')}`;
  }
  const slash = raw.match(/^(\d{1,2})\/(\d{4})$/);
  if (slash) return `${slash[2]}-${String(Number(slash[1])).padStart(2, '0')}`;
  return '';
}

function parseEopItems(state) {
  const table = state.rightTable || { cols: [], rows: [] };
  const dateCols = (table.cols || [])
    .map((col, index) => (/date|month/i.test(col || '') ? index : -1))
    .filter(index => index >= 0);
  const cols = dateCols.length ? dateCols : [1];
  const items = [];

  (table.rows || []).forEach((row, rowIndex) => {
    const label = String((row && row[0]) || '').trim();
    cols.forEach(colIndex => {
      const date = normalizeMonthInput(row && row[colIndex]);
      if (!date) return;
      items.push({
        id: `eop-${rowIndex}-${colIndex}`,
        label,
        date,
        col: dateToCol(date, state),
        rowIndex,
        colIndex,
      });
    });
  });

  return items.sort((a, b) => a.col - b.col || a.rowIndex - b.rowIndex || a.colIndex - b.colIndex);
}

function getEopItemsForState(state) {
  if (state.eopItems && state.eopItems.length) return state.eopItems;
  if (!state.eopDate) return [];
  return [{ id: 'eop-primary', label: '', date: state.eopDate, col: dateToCol(state.eopDate, state), rowIndex: 0, colIndex: 1 }];
}

function getMilestoneTableRows(state) {
  const table = state.leftTable || { cols: [], rows: [] };
  const cols = (table.cols || []).map(col => String(col || '').trim());
  const rows = (table.rows || [])
    .map(row => cols.map((_, index) => String((row && row[index]) || '').trim()))
    .filter(row => row.some(Boolean));
  return { cols, rows };
}

function getBranchSourcePoint(branch, state) {
  const sourceNodeId = branch.sourceNodeId || branch.parentNodeId;
  const sourceNode = sourceNodeId ? state.planNodes.find(n => n.id === sourceNodeId) : null;
  if (sourceNode) return getPlanNodeCenter(sourceNode, state);
  const laneIdx = findPlanLaneIndex(state, 'plan', branch.variantId);
  const col = Number.isFinite(branch.sourceCol) ? branch.sourceCol : dateToCol(branch.sourceDate, state);
  if (laneIdx < 0 || col < 0) return null;
  return { x: col * COL + COL / 2, y: getTopOffset(state) + laneIdx * ROH + ROH / 2 };
}

function getBranchLaneAnchorPoint(branch, state) {
  const laneIdx = findPlanLaneIndex(state, 'branch', branch.id);
  const col = Number.isFinite(branch.sourceCol) ? branch.sourceCol : dateToCol(branch.sourceDate, state);
  if (laneIdx < 0 || col < 0) return null;
  return { x: col * COL + COL / 2, y: getTopOffset(state) + laneIdx * ROH + ROH / 2 };
}

function getMergeTargetPoint(link, state) {
  if (link.toNodeId) {
    const toNode = state.planNodes.find(n => n.id === link.toNodeId);
    if (toNode) return getPlanNodeCenter(toNode, state);
  }
  const branch = state.branches.find(b => b.id === link.fromBranchId);
  if (!branch) return null;
  const laneIdx = findPlanLaneIndex(state, 'plan', branch.variantId);
  const col = Number.isFinite(link.toCol) ? link.toCol : dateToCol(link.toDate, state);
  if (laneIdx < 0 || col < 0) return null;
  return { x: col * COL + COL / 2, y: getTopOffset(state) + laneIdx * ROH + ROH / 2 };
}

function findPlanNodeAtCol(state, variantId, col) {
  return state.planNodes
    .filter(n => n.variantId === variantId && n.col === col)
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))[0] || null;
}

function getInitialPlanNodeForVariant(state, variantId) {
  return (state.planNodes || [])
    .filter(n => n.variantId === variantId)
    .sort((a, b) => a.col - b.col || String(a.id).localeCompare(String(b.id)))[0] || null;
}

function canStartBranchAtCol(state, variantId, col) {
  const initial = getInitialPlanNodeForVariant(state, variantId);
  return !!initial && Number.isFinite(col) && col >= initial.col;
}

function getLastPlanNodeForVariant(state, variantId) {
  return (state.planNodes || [])
    .filter(n => n.variantId === variantId)
    .sort((a, b) => a.col - b.col || String(a.id).localeCompare(String(b.id)))
    .slice(-1)[0] || null;
}

function getMergeTargetCol(link, state) {
  if (Number.isFinite(link.toCol)) return link.toCol;
  if (link.toNodeId) {
    const node = (state.planNodes || []).find(n => n.id === link.toNodeId);
    if (node) return node.col;
  }
  return dateToCol(link.toDate, state);
}

function getLastBranchNode(branchId, state) {
  return (state.branchNodes || [])
    .filter(n => n.branchId === branchId)
    .sort((a, b) => a.col - b.col || String(a.id).localeCompare(String(b.id)))
    .slice(-1)[0] || null;
}

function isLastBranchNode(node, state) {
  if (!node || !node.branchId) return false;
  const last = getLastBranchNode(node.branchId, state);
  return !!last && last.id === node.id;
}

function getNextPlanNodeAfterBranchSource(branch, state) {
  if (!branch) return null;
  const sourceCol = Number.isFinite(branch.sourceCol)
    ? branch.sourceCol
    : dateToCol(branch.sourceDate, state);
  return (state.planNodes || [])
    .filter(n => n.variantId === branch.variantId && n.col > sourceCol)
    .sort((a, b) => a.col - b.col || String(a.id).localeCompare(String(b.id)))[0] || null;
}

function canMergeBranchNodeToCol(node, col, state) {
  if (!isLastBranchNode(node, state)) {
    return { ok: false, reason: 'Only the last branch stage can merge.' };
  }
  if (!Number.isFinite(col)) {
    return { ok: false, reason: 'Select a valid merge month.' };
  }
  return { ok: true, reason: '' };
}

function removeBranchData(state, branchId) {
  const removedIds = new Set([
    ...(state.branchNodes || []).filter(n => n.branchId === branchId).map(n => n.id),
    ...(state.actualBranchNodes || []).filter(n => n.branchId === branchId).map(n => n.id),
  ]);
  return {
    branches: (state.branches || []).filter(b => b.id !== branchId),
    branchNodes: (state.branchNodes || []).filter(n => n.branchId !== branchId),
    actualBranchNodes: (state.actualBranchNodes || []).filter(n => n.branchId !== branchId),
    mergeLinks: (state.mergeLinks || []).filter(l => l.fromBranchId !== branchId),
    stageShifts: (state.stageShifts || []).filter(shift => !removedIds.has(shift.sourceNodeId)),
  };
}

function removeBranchNodeData(state, nodeId) {
  const node = (state.branchNodes || []).find(n => n.id === nodeId);
  if (!node) return { branchNodes: state.branchNodes || [] };
  const branchNodes = (state.branchNodes || []).filter(n => n.id !== nodeId);
  const branchStillHasNodes = branchNodes.some(n => n.branchId === node.branchId);
  if (!branchStillHasNodes) {
    return removeBranchData(state, node.branchId);
  }
  return {
    branches: state.branches || [],
    branchNodes,
    actualBranchNodes: state.actualBranchNodes || [],
    mergeLinks: (state.mergeLinks || []).filter(l => l.fromNodeId !== nodeId),
    ...removeStageShiftsForNodeData(state, nodeId),
  };
}

function canAddStageShift(node, mode, targetCol) {
  if (!node || !Number.isFinite(targetCol)) return { ok: false, reason: 'Select a valid month.' };
  if (mode === 'preponed') {
    return targetCol < node.col
      ? { ok: true, reason: '' }
      : { ok: false, reason: 'Preponed month must be before the selected stage.' };
  }
  if (mode === 'postponed') {
    return targetCol > node.col
      ? { ok: true, reason: '' }
      : { ok: false, reason: 'Postponed month must be after the selected stage.' };
  }
  return { ok: false, reason: 'Choose preponed or postponed.' };
}

function addStageShiftData(state, data) {
  const shift = {
    id: 'i' + (state.nid || 1),
    sourceNodeId: data.sourceNodeId,
    sourceContext: data.sourceContext,
    mode: data.mode,
    targetDate: data.targetDate,
    targetCol: data.targetCol,
  };
  return {
    stageShifts: [...(state.stageShifts || []), shift],
    nid: (state.nid || 1) + 1,
  };
}

function removeStageShiftsForNodeData(state, nodeId) {
  return {
    stageShifts: (state.stageShifts || []).filter(shift => shift.sourceNodeId !== nodeId),
  };
}

function copyStageForActual(node, id, contextKey) {
  const copy = {
    id,
    sourcePlanNodeId: node.id,
    col: node.col,
    type: node.type || 'square',
    topLabel: node.topLabel || '',
    bottomLabel: node.bottomLabel || '',
    date: node.date || '',
    isDRS: !!node.isDRS,
    drsDetail: node.drsDetail || '',
  };
  copy[contextKey] = node[contextKey];
  return copy;
}

function syncCopiedNodes(planNodes, actualNodes, contextKey, nextId) {
  const sourceIds = new Set(planNodes.map(n => n.id));
  const bySource = new Map(actualNodes.filter(n => n.sourcePlanNodeId).map(n => [n.sourcePlanNodeId, n]));
  const preserved = actualNodes.filter(n => !n.sourcePlanNodeId || !sourceIds.has(n.sourcePlanNodeId));
  const copied = planNodes.map(planNode => {
    const existing = bySource.get(planNode.id);
    const id = existing ? existing.id : `i${nextId.value++}`;
    return copyStageForActual(planNode, id, contextKey);
  });
  return [...preserved, ...copied];
}

function copyPlanToActualData(state) {
  const nextId = { value: state.nid || 1 };
  const actualNodes = syncCopiedNodes(state.planNodes || [], state.actualNodes || [], 'variantId', nextId);
  const actualBranchNodes = syncCopiedNodes(state.branchNodes || [], state.actualBranchNodes || [], 'branchId', nextId);
  return { actualNodes, actualBranchNodes, nid: nextId.value };
}

// ════════════════════════════════════════════════════════════════
// § 4  PERSISTENCE  ─  localStorage + Dataverse bridge
// ════════════════════════════════════════════════════════════════

let persistenceReady = false;
let suppressDraftSave = false;
let draftSaveTimer = null;

function getStorageKeys(projectId) {
  return {
    draft: `${STORAGE_PREFIX}:draft:${projectId}`,
    baseline: `${STORAGE_PREFIX}:baseline:${projectId}`,
  };
}

function readLocalJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn('Could not read local draft data:', err);
    return null;
  }
}

function writeLocalJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('Could not write local draft data:', err);
  }
}

function removeLocalItem(key) {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn('Could not remove local draft data:', err);
  }
}

function getOrCreateActiveProjectId() {
  try {
    const existing = localStorage.getItem(ACTIVE_PROJECT_KEY);
    if (existing) return existing;
    const next = `local-${Date.now()}`;
    localStorage.setItem(ACTIVE_PROJECT_KEY, next);
    return next;
  } catch (err) {
    console.warn('Draft storage unavailable:', err);
    return `local-${Date.now()}`;
  }
}

function getCurrentStorageKeys() {
  const { projectId } = store.getState();
  const id = projectId || getOrCreateActiveProjectId();
  return getStorageKeys(id);
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

function captureState() {
  return normalizeStateForPersistence(store.getState());
}

function getBaselineState() {
  return readLocalJson(getCurrentStorageKeys().baseline) || captureState();
}

function persistDraftNow() {
  if (!persistenceReady || suppressDraftSave) return;
  writeLocalJson(getCurrentStorageKeys().draft, captureState());
  updateDraftStatus();
}

function scheduleDraftSave() {
  if (!persistenceReady || suppressDraftSave) return;
  clearTimeout(draftSaveTimer);
  draftSaveTimer = setTimeout(persistDraftNow, 80);
}

function updateDraftStatus(message) {
  const status = $('draftStatus');
  if (!status) return;
  const draft = readLocalJson(getCurrentStorageKeys().draft) || captureState();
  const baseline = getBaselineState();
  const dirty = isDirty(draft, baseline);
  status.hidden = !dirty && !message;
  $('draftStatusText').textContent = message || (dirty ? 'Draft changes' : 'Saved');
}

function syncHeaderInputsFromState() {
  const { info, remarks } = store.getState();
  $('fProject').value = info.project || '';
  $('fLocation').value = info.location || '';
  $('fPlant').value = info.plant || '';
  $('fProjType').value = info.type || '';
  $('fStatus').value = info.status || 'On Track';
  $('remarksBox').textContent = remarks || '';
  syncPubBtn();
}

function loadSample() {
  store.getState().replaceState({
    variants: [{ id: 'v1', name: 'DOM Gas' }, { id: 'v2', name: 'DOM CNG' }],
    nid: 50,
    planNodes: [
      { id: 'p1', variantId: 'v1', col: 5, type: 'square', topLabel: 'DA', bottomLabel: '', date: '2024-06', isDRS: false, drsDetail: '' },
      { id: 'p2', variantId: 'v1', col: 9, type: 'square', topLabel: 'SOS', bottomLabel: '', date: '2024-10', isDRS: false, drsDetail: '' },
      { id: 'p3', variantId: 'v2', col: 6, type: 'square', topLabel: 'DA', bottomLabel: '', date: '2024-07', isDRS: false, drsDetail: '' },
    ],
    actualNodes: [
      { id: 'a1', variantId: 'v1', col: 6, type: 'square', topLabel: '', bottomLabel: '', date: '2024-07', isDRS: false, drsDetail: '' },
    ],
  });
}

function initPersistenceState() {
  const projectId = getOrCreateActiveProjectId();
  const keys = getStorageKeys(projectId);
  const draft = readLocalJson(keys.draft);
  const baseline = readLocalJson(keys.baseline);

  if (draft) {
    store.getState().replaceState({ ...draft, projectId });
  } else if (baseline) {
    store.getState().replaceState({ ...baseline, projectId });
    writeLocalJson(keys.draft, captureState());
  } else {
    loadSample();
    store.getState().setProjectId(projectId);
    const initial = captureState();
    writeLocalJson(keys.draft, initial);
    writeLocalJson(keys.baseline, initial);
  }

  if (!readLocalJson(keys.baseline)) writeLocalJson(keys.baseline, captureState());
  persistenceReady = true;
}

function revertDraftToBaseline() {
  const baseline = getBaselineState();
  suppressDraftSave = true;
  store.getState().replaceState(baseline);
  const keys = getCurrentStorageKeys();
  removeLocalItem(keys.draft);
  writeLocalJson(keys.draft, captureState());
  syncHeaderInputsFromState();
  renderAll();
  suppressDraftSave = false;
  persistDraftNow();
  updateDraftStatus('Reverted');
  setTimeout(() => updateDraftStatus(), 1400);
}

function adoptProjectId(nextProjectId, snapshot) {
  const { projectId } = store.getState();
  if (!nextProjectId || nextProjectId === projectId) return snapshot;
  const oldKeys = getCurrentStorageKeys();
  const nextSnapshot = { ...snapshot, projectId: nextProjectId };
  store.getState().setProjectId(nextProjectId);
  try {
    localStorage.setItem(ACTIVE_PROJECT_KEY, nextProjectId);
  } catch (err) {
    console.warn('Could not update active project id:', err);
  }
  removeLocalItem(oldKeys.draft);
  removeLocalItem(oldKeys.baseline);
  return nextSnapshot;
}

function normalizeStateForDataverse(state) {
  return normalizeStateForPersistence(state);
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
    is_drs: !!node.isDRS,
    drs_detail: node.drsDetail || '',
    source_plan_stage_external_id: node.sourcePlanNodeId || '',
    display_order: index,
    ...extra(node),
  }));
}

function createDataversePayload(state) {
  const s = normalizeStateForDataverse(state);
  const eopItems = s.eopItems && s.eopItems.length ? s.eopItems : parseEopItems(s);
  const primaryEopDate = s.eopDate || (eopItems[0] && eopItems[0].date) || '';
  const project = {
    external_id: s.projectId || '',
    name: s.info?.project || '',
    location: s.info?.location || '',
    plant: s.info?.plant || '',
    project_type: s.info?.type || '',
    status: s.info?.status || '',
    published: !!s.info?.published,
    discussion_period_date: s.discussionDate || '',
    eop_date: primaryEopDate,
    eop_dates_json: JSON.stringify(eopItems || []),
    stage_shifts_json: JSON.stringify(s.stageShifts || []),
    years_json: JSON.stringify(s.years || []),
    remarks: s.remarks || '',
    milestone_table_json: JSON.stringify(s.leftTable || { cols: [], rows: [] }),
    eop_table_json: JSON.stringify(s.rightTable || { cols: [], rows: [] }),
    layout_json: JSON.stringify({
      labelPositions: s.labelPositions || {},
      remarkPosition: s.remarkPosition || null,
      nid: s.nid || 1,
    }),
  };

  return {
    project,
    variants: (s.variants || []).map((v, i) => ({ external_id: v.id, name: v.name || '', display_order: i })),
    branches: (s.branches || []).map((b, i) => ({
      external_id: b.id,
      variant_external_id: b.variantId,
      parent_stage_external_id: b.parentNodeId || b.sourceNodeId || '',
      source_stage_external_id: b.sourceNodeId || b.parentNodeId || '',
      source_month: b.sourceDate || '',
      source_column_index: Number.isFinite(b.sourceCol) ? b.sourceCol : null,
      label: b.label || '',
      display_order: i,
    })),
    stages: [
      ...mapStages(s.planNodes, 'plan', n => ({ variant_external_id: n.variantId })),
      ...mapStages(s.actualNodes, 'actual', n => ({ variant_external_id: n.variantId })),
      ...mapStages(s.branchNodes, 'branch_plan', n => ({ branch_external_id: n.branchId })),
      ...mapStages(s.actualBranchNodes, 'branch_actual', n => ({ branch_external_id: n.branchId })),
    ],
    mergeLinks: (s.mergeLinks || []).map(l => ({
      external_id: l.id,
      branch_external_id: l.fromBranchId,
      source_stage_external_id: l.fromNodeId,
      target_stage_external_id: l.toNodeId || '',
      target_month: l.toDate || '',
      target_column_index: Number.isFinite(l.toCol) ? l.toCol : null,
    })),
  };
}

function createDataverseDelta(draft, baseline) {
  const nextPayload = createDataversePayload(draft);
  const prevPayload = createDataversePayload(baseline || {});
  const changedGroups = ['project', 'variants', 'branches', 'stages', 'mergeLinks'].filter(
    g => stableStringify(nextPayload[g]) !== stableStringify(prevPayload[g])
  );
  return { hasChanges: changedGroups.length > 0, changedGroups, current: nextPayload, baseline: prevPayload };
}

async function saveDraftToDataverse(draft, baseline) {
  const delta = createDataverseDelta(draft, baseline);
  const bridge = window.ProjectTrackerDataverse;

  if (bridge && typeof bridge.saveProject === 'function') {
    return bridge.saveProject({ projectId: draft.projectId, delta, payload: delta.current });
  }

  writeLocalJson(`${STORAGE_PREFIX}:dataverse-payload:${draft.projectId}`, {
    projectId: draft.projectId,
    savedAt: new Date().toISOString(),
    delta,
  });
  console.warn('ProjectTrackerDataverse.saveProject not configured; Dataverse payload saved locally.');
  return { projectId: draft.projectId, developmentOnly: true };
}

// ════════════════════════════════════════════════════════════════
// § 5  RENDERERS  ─  receive state, write DOM, never call set()
// ════════════════════════════════════════════════════════════════

// DOM element refs (stable across renders)
const yearHeader = $('yearHeader');
const monthHeader = $('monthHeader');
const tlGrid = $('tlGrid');
const sbRows = $('sbRows');
const tlScroll = $('tlScroll');
const nodePopup = $('nodePopup');
const ctxMenu = $('ctxMenu');
const modalOverlay = $('modalOverlay');
const modalBody = $('modalBody');
const modalTitle = $('modalTitle');

function renderAll() {
  const s = store.getState();
  renderHeaders(s);
  renderSidebar(s);
  renderGrid(s);
  renderNodes(s);
  renderBottomTables(s);
}

function renderHeaders(state) {
  yearHeader.innerHTML = '';
  monthHeader.innerHTML = '';
  const tc = totalCols(state);
  yearHeader.style.width = monthHeader.style.width = (tc * COL) + 'px';
  state.years.forEach((yr, yearIndex) => {
    const yb = document.createElement('div');
    yb.className = 'yr-block';
    yb.style.width = (COL * 12) + 'px';
    yb.textContent = yr;
    yearHeader.appendChild(yb);
    for (let m = 1; m <= 12; m++) {
      const col = yearIndex * 12 + m - 1;
      const mc = document.createElement('div');
      mc.className = ['mo-cell', getDiscussionPeriodClass(col, state)].filter(Boolean).join(' ');
      mc.style.width = COL + 'px';
      mc.textContent = m;
      monthHeader.appendChild(mc);
    }
  });
}

function renderSidebar(state) {
  sbRows.innerHTML = '';
  const totalH = getSidebarH(state);
  if (!state.variants.length) {
    sbRows.innerHTML = '<div class="empty-sb">No variants yet.<br>Add one in the header.</div>';
    return;
  }
  const row = document.createElement('div');
  row.className = 'sidebar-row';
  row.style.height = totalH + 'px';
  row.innerHTML = `
    <div class="sr-cell sno" style="height:${totalH}px">1</div>
    <div class="sr-cell proj" style="height:${totalH}px">
      <span class="vr-name">${escapeHtml(state.info.project || '—')}</span>
    </div>
    <div class="sr-cell loc" style="height:${totalH}px">${escapeHtml(state.info.location || '—')}</div>
    <div class="sr-cell plant" style="height:${totalH}px">${escapeHtml(state.info.plant || '—')}</div>
    <div class="sr-cell pa" style="height:${totalH}px;flex-direction:column;padding:0">
      ${hasEopLane(state) ? `<div class="pa-eop-spacer" style="height:${getTopOffset(state)}px"></div>` : ''}
      <div class="pa-plan" style="height:${getPlannedH(state)}px">plan</div>
      <div class="pa-divider" style="height:${getDividerH(state)}px"></div>
      <div class="pa-actual" style="height:${getActualH(state)}px">Actual</div>
    </div>`;
  sbRows.appendChild(row);
}

function renderGrid(state) {
  tlGrid.innerHTML = '';
  const tc = totalCols(state);
  tlGrid.style.width = (tc * COL) + 'px';

  if (!state.variants.length) {
    const h = document.createElement('div');
    h.className = 'empty-hint';
    h.innerHTML = '<div class="emo">🕐</div><div>Add a variant to get started</div>';
    tlGrid.appendChild(h);
    return;
  }

  const grp = document.createElement('div');
  grp.className = 'grid-vr-grp';
  grp.style.position = 'relative';
  grp.style.height = getGridGroupH(state) + 'px';
  grp.dataset.vId = state.variants[0] ? state.variants[0].id : '';

  renderEopLane(grp, tc, state);

  getPlanLanes(state).forEach(lane => {
    const sr = lane.type === 'branch'
      ? makeBranchSubRow(tc, lane.branchId, 'branch', lane.label, state)
      : makeSubRow(tc, lane.variantId, 'plan', state);
    grp.appendChild(sr);
  });

  const dv = document.createElement('div');
  dv.className = 'pa-grid-div';
  dv.style.height = '4px';
  dv.style.background = 'var(--border2)';
  grp.appendChild(dv);

  getActualLanes(state).forEach((lane, index) => {
    const sr = lane.type === 'actualBranch'
      ? makeBranchSubRow(tc, lane.branchId, 'actualBranch', lane.label, state)
      : makeSubRow(tc, lane.variantId, 'actual', state);
    if (index === 0) sr.classList.add('actual-first');
    grp.appendChild(sr);
  });

  tlGrid.appendChild(grp);
  drawLines(grp, state);
  renderVariantLabels(state);
  renderCanvasRemarks(state);
  renderMilestoneTableOverlay(state);
  renderMergeHint(state);
}

function renderEopLane(grp, tc, state) {
  if (!hasEopLane(state)) return;
  const row = document.createElement('div');
  row.className = 'grid-sub-row eop-row';
  row.style.height = ROH + 'px';
  row.style.position = 'relative';
  for (let col = 0; col < tc; col++) {
    const c = document.createElement('div');
    c.className = ['g-cell', 'eop-cell', getDiscussionPeriodClass(col, state)].filter(Boolean).join(' ');
    row.appendChild(c);
  }
  grp.appendChild(row);
  const items = getEopItemsForState(state)
    .map(item => ({ ...item, col: Number.isFinite(item.col) ? item.col : dateToCol(item.date, state) }))
    .filter(item => item.col >= 0);
  if (items.length) {
    const y = ROH / 2;
    const maxX = Math.max(...items.map(item => item.col * COL + COL / 2));
    const line = document.createElement('div');
    line.className = 'eop-line';
    line.style.cssText = `left:0;top:${y - 1}px;width:${maxX}px`;
    row.appendChild(line);
  }
  items.forEach(item => {
    const col = Number.isFinite(item.col) ? item.col : dateToCol(item.date, state);
    if (col < 0) return;
    const y = ROH / 2;
    const x = col * COL + COL / 2;
    const mark = document.createElement('div');
    mark.className = 'eop-x';
    mark.style.cssText = `left:${x - 8}px;top:${y - 12}px`;
    mark.textContent = 'X';
    mark.title = [item.label, item.date].filter(Boolean).join(' - ');
    row.appendChild(mark);
    if (item.label) {
      const label = document.createElement('div');
      label.className = 'eop-label';
      label.style.cssText = `left:${x + 9}px;top:${y + 8}px`;
      label.textContent = item.label;
      row.appendChild(label);
    }
  });
}

function makeSubRow(tc, vId, rType, state) {
  const sr = document.createElement('div');
  sr.className = 'grid-sub-row ' + (rType === 'plan' ? 'plan-sub' : 'actual-sub');
  sr.style.height = ROH + 'px';
  sr.style.position = 'relative';
  for (let col = 0; col < tc; col++) {
    const c = document.createElement('div');
    c.className = ['g-cell', getDiscussionPeriodClass(col, state)].filter(Boolean).join(' ');
    c.dataset.col = col;
    c.dataset.vId = vId;
    c.dataset.rType = rType;
    c.addEventListener('click', onCellClick);
    if (rType === 'plan') c.addEventListener('contextmenu', showCellCtx);
    sr.appendChild(c);
  }
  return sr;
}

function makeBranchSubRow(tc, branchId, rType, label, state) {
  const sr = document.createElement('div');
  sr.className = 'grid-sub-row branch-sub' + (rType === 'actualBranch' ? ' actual-branch-sub' : '');
  sr.style.height = ROH + 'px';
  sr.style.position = 'relative';
  for (let col = 0; col < tc; col++) {
    const c = document.createElement('div');
    c.className = ['g-cell', getDiscussionPeriodClass(col, state)].filter(Boolean).join(' ');
    c.dataset.col = col;
    c.dataset.branchId = branchId;
    c.dataset.rType = rType;
    c.addEventListener('click', onCellClick);
    sr.appendChild(c);
  }
  const pill = document.createElement('div');
  pill.className = 'branch-div-pill' + (rType === 'actualBranch' ? ' actual-branch-pill' : '');
  const pillText = document.createElement('span');
  pillText.textContent = '↳ ' + (label || 'Branch');
  pill.appendChild(pillText);
  if (rType === 'branch') {
    const del = document.createElement('button');
    del.className = 'branch-pill-del';
    del.type = 'button';
    del.title = 'Delete branch row';
    del.textContent = '×';
    del.addEventListener('click', e => {
      e.stopPropagation();
      store.getState().removeBranch(branchId);
      if (mergePick && mergePick.fromBranchId === branchId) clearMergePick();
      renderAll();
      persistDraftNow();
    });
    pill.appendChild(del);
  }
  sr.appendChild(pill);
  return sr;
}

function drawLines(grp, state) {
  document.querySelectorAll('.tl-line,.tl-relationship-svg').forEach(e => e.remove());
  if (!grp || !state.variants.length) return;

  state.variants.forEach(vr => {
    const laneIdx = findPlanLaneIndex(state, 'plan', vr.id);
    if (laneIdx < 0) return;
    const pn = state.planNodes.filter(n => n.variantId === vr.id).sort((a, b) => a.col - b.col);
    const y = getTopOffset(state) + laneIdx * ROH + ROH / 2;
    for (let i = 0; i < pn.length - 1; i++)
      mkLine(grp, pn[i].col * COL + COL / 2, y, pn[i + 1].col * COL + COL / 2, y, '#2563eb');
    const lastPlan = pn[pn.length - 1];
    if (lastPlan) {
      const branchIds = new Set(state.branches.filter(b => b.variantId === vr.id).map(b => b.id));
      const maxMergeCol = Math.max(-1, ...state.mergeLinks
        .filter(link => branchIds.has(link.fromBranchId))
        .map(link => getMergeTargetCol(link, state))
        .filter(col => Number.isFinite(col)));
      if (maxMergeCol > lastPlan.col) {
        mkLine(grp, lastPlan.col * COL + COL / 2, y, maxMergeCol * COL + COL / 2, y, '#2563eb');
      }
    }
  });

  state.branches.forEach(br => {
    const laneIdx = findPlanLaneIndex(state, 'branch', br.id);
    if (laneIdx < 0) return;
    const bY = getTopOffset(state) + laneIdx * ROH + ROH / 2;
    const bn = state.branchNodes.filter(n => n.branchId === br.id).sort((a, b) => a.col - b.col);
    for (let i = 0; i < bn.length - 1; i++)
      mkLine(grp, bn[i].col * COL + COL / 2, bY, bn[i + 1].col * COL + COL / 2, bY, '#00c9b1');
  });

  state.variants.forEach(vr => {
    const laneIdx = findActualLaneIndex(state, 'actual', vr.id);
    if (laneIdx < 0) return;
    const an = state.actualNodes.filter(n => n.variantId === vr.id).sort((a, b) => a.col - b.col);
    const y = getTopOffset(state) + getPlannedH(state) + 4 + laneIdx * ROH + ROH / 2;
    for (let i = 0; i < an.length - 1; i++)
      mkLine(grp, an[i].col * COL + COL / 2, y, an[i + 1].col * COL + COL / 2, y, '#f97316');
  });

  state.branches.forEach(br => {
    const laneIdx = findActualLaneIndex(state, 'branch', br.id);
    if (laneIdx < 0) return;
    const y = getTopOffset(state) + getPlannedH(state) + 4 + laneIdx * ROH + ROH / 2;
    const nodes = state.actualBranchNodes.filter(n => n.branchId === br.id).sort((a, b) => a.col - b.col);
    for (let i = 0; i < nodes.length - 1; i++)
      mkLine(grp, nodes[i].col * COL + COL / 2, y, nodes[i + 1].col * COL + COL / 2, y, '#f97316');
  });

  drawRelationshipArrows(grp, state);
}

function mkLine(parent, x1, y1, x2, y2, color) {
  const d = document.createElement('div');
  d.className = 'tl-line';
  d.style.cssText = `position:absolute;background:${color};opacity:.8;z-index:3;pointer-events:none;left:${Math.min(x1, x2)}px;top:${y1 - 1}px;width:${Math.abs(x2 - x1)}px;height:2px`;
  parent.appendChild(d);
}

function drawRelationshipArrows(grp, state) {
  const svg = makeRelationshipSvg(state);
  let hasArrows = false;

  state.branches.forEach(br => {
    const firstChild = getFirstBranchNode(br.id, state);
    const from = getBranchSourcePoint(br, state);
    const to = firstChild ? getBranchNodeCenter(firstChild, state) : getBranchLaneAnchorPoint(br, state);
    if (!from || !to) return;
    addArrowPath(svg, from, to, 'branch-start-arrow', 'branchStartArrow');
    hasArrows = true;
  });

  state.mergeLinks.forEach(link => {
    const fromNode = state.branchNodes.find(n => n.id === link.fromNodeId && n.branchId === link.fromBranchId);
    if (!fromNode) return;
    const from = getBranchNodeCenter(fromNode, state);
    const to = getMergeTargetPoint(link, state);
    if (!from || !to) return;
    addMergeBackPath(svg, from, to);
    hasArrows = true;
  });

  (state.stageShifts || []).forEach(shift => {
    const source = findStageByContext(state, shift.sourceContext, shift.sourceNodeId);
    if (!source) return;
    const from = getStageCenterByContext(source, shift.sourceContext, state);
    const to = getStageShiftTargetCenter(shift, source, state);
    if (!from || !to) return;
    addStageShiftConnectorLine(svg, from, to, shift.mode);
    addStageShiftArrow(svg, from, to, shift.mode);
    hasArrows = true;
  });

  if (hasArrows) grp.appendChild(svg);
}

function makeRelationshipSvg(state) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('tl-relationship-svg');
  const w = totalCols(state) * COL;
  const h = getGridGroupH(state);
  svg.setAttribute('width', w);
  svg.setAttribute('height', h);
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.innerHTML = `
    <defs>
      <marker id="branchStartArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L8,4 L0,8 Z" fill="#00c9b1"></path>
      </marker>
      <marker id="mergeLinkArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L8,4 L0,8 Z" fill="#00c9b1"></path>
      </marker>
      <marker id="preponedOpenArrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
        <path d="M0,1 L8,5 L0,9" fill="none" stroke="#dc2626" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
      </marker>
      <marker id="postponedOpenArrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
        <path d="M0,1 L8,5 L0,9" fill="none" stroke="#ea580c" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
      </marker>
    </defs>`;
  return svg;
}

function addArrowPath(svg, from, to, cls, markerId) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const midY = from.y + (to.y - from.y) / 2;
  path.setAttribute('class', cls);
  path.setAttribute('d', `M ${from.x} ${from.y} L ${from.x} ${midY} L ${to.x} ${midY} L ${to.x} ${to.y}`);
  path.setAttribute('marker-end', `url(#${markerId})`);
  svg.appendChild(path);
}

function addMergeBackPath(svg, from, to) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('class', 'merge-link-arrow');
  path.setAttribute('d', `M ${from.x} ${from.y} L ${to.x} ${from.y} L ${to.x} ${to.y}`);
  svg.appendChild(path);
}

function addStageShiftConnectorLine(svg, from, to, mode) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('class', `stage-shift-normal-line ${mode}-shift-line`);
  path.setAttribute('d', `M ${from.x} ${from.y} L ${to.x} ${to.y}`);
  svg.appendChild(path);
}

function addStageShiftArrow(svg, from, to, mode) {
  const midX = from.x + (to.x - from.x) / 2;
  const archY = Math.min(from.y, to.y) - SHIFT_ARROW_ARCH;
  const d = `M ${from.x} ${from.y} Q ${midX} ${archY} ${to.x} ${to.y}`;
  const markerId = mode === 'preponed' ? 'preponedOpenArrow' : 'postponedOpenArrow';
  const outline = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  outline.setAttribute('class', 'stage-shift-arrow-outline');
  outline.setAttribute('d', d);
  svg.appendChild(outline);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('class', `stage-shift-arrow ${mode}-shift-arrow`);
  path.setAttribute('d', d);
  path.setAttribute('marker-end', `url(#${markerId})`);
  svg.appendChild(path);
}

function getFirstBranchNode(branchId, state) {
  return state.branchNodes
    .filter(n => n.branchId === branchId)
    .sort((a, b) => a.col - b.col || String(a.id).localeCompare(String(b.id)))[0] || null;
}

function getPlanNodeCenter(node, state) {
  const laneIdx = findPlanLaneIndex(state, 'plan', node.variantId);
  if (laneIdx < 0) return null;
  return { x: node.col * COL + COL / 2, y: getTopOffset(state) + laneIdx * ROH + ROH / 2 };
}

function getBranchNodeCenter(node, state) {
  const laneIdx = findPlanLaneIndex(state, 'branch', node.branchId);
  if (laneIdx < 0) return null;
  return { x: node.col * COL + COL / 2, y: getTopOffset(state) + laneIdx * ROH + ROH / 2 };
}

function getActualNodeCenter(node, state) {
  const laneIdx = findActualLaneIndex(state, 'actual', node.variantId);
  if (laneIdx < 0) return null;
  return { x: node.col * COL + COL / 2, y: getTopOffset(state) + getPlannedH(state) + 4 + laneIdx * ROH + ROH / 2 };
}

function getActualBranchNodeCenter(node, state) {
  const laneIdx = findActualLaneIndex(state, 'branch', node.branchId);
  if (laneIdx < 0) return null;
  return { x: node.col * COL + COL / 2, y: getTopOffset(state) + getPlannedH(state) + 4 + laneIdx * ROH + ROH / 2 };
}

function findStageByContext(state, context, nodeId) {
  const map = {
    plan: state.planNodes || [],
    actual: state.actualNodes || [],
    branch: state.branchNodes || [],
    actualBranch: state.actualBranchNodes || [],
  };
  return (map[context] || []).find(n => n.id === nodeId) || null;
}

function getStageCenterByContext(node, context, state) {
  if (context === 'plan') return getPlanNodeCenter(node, state);
  if (context === 'branch') return getBranchNodeCenter(node, state);
  if (context === 'actual') return getActualNodeCenter(node, state);
  if (context === 'actualBranch') return getActualBranchNodeCenter(node, state);
  return null;
}

function getStageShiftTargetCenter(shift, source, state) {
  const from = getStageCenterByContext(source, shift.sourceContext, state);
  if (!from || !Number.isFinite(shift.targetCol)) return null;
  return { x: shift.targetCol * COL + COL / 2, y: from.y };
}

function renderNodes(state) {
  document.querySelectorAll('.node,.drs-detail-label').forEach(e => e.remove());
  const grp = tlGrid.querySelector('.grid-vr-grp');
  if (!grp) return;
  const shiftedNodeIds = new Set((state.stageShifts || []).map(shift => shift.sourceNodeId));

  state.planNodes.forEach(n => {
    const laneIdx = findPlanLaneIndex(state, 'plan', n.variantId);
    if (laneIdx < 0) return;
    const y = getTopOffset(state) + laneIdx * ROH + ROH / 2;
    const el = mkNode(n, 'plan', shiftedNodeIds.has(n.id));
    el.style.cssText = `left:${n.col * COL + COL / 2 - 14}px;top:${y - 14}px`;
    grp.appendChild(el);
    addDrsDetailLabel(grp, n, n.col * COL + COL / 2, y, state);
  });

  state.branchNodes.forEach(n => {
    const laneIdx = findPlanLaneIndex(state, 'branch', n.branchId);
    if (laneIdx < 0) return;
    const y = getTopOffset(state) + laneIdx * ROH + ROH / 2;
    const el = mkNode(n, 'branch', shiftedNodeIds.has(n.id));
    el.style.cssText = `left:${n.col * COL + COL / 2 - 14}px;top:${y - 14}px`;
    grp.appendChild(el);
    addDrsDetailLabel(grp, n, n.col * COL + COL / 2, y, state);
  });

  state.actualNodes.forEach(n => {
    const laneIdx = findActualLaneIndex(state, 'actual', n.variantId);
    if (laneIdx < 0) return;
    const y = getTopOffset(state) + getPlannedH(state) + 4 + laneIdx * ROH + ROH / 2;
    const el = mkNode(n, 'actual', shiftedNodeIds.has(n.id));
    el.style.cssText = `left:${n.col * COL + COL / 2 - 14}px;top:${y - 14}px`;
    grp.appendChild(el);
    addDrsDetailLabel(grp, n, n.col * COL + COL / 2, y, state);
  });

  state.actualBranchNodes.forEach(n => {
    const laneIdx = findActualLaneIndex(state, 'branch', n.branchId);
    if (laneIdx < 0) return;
    const y = getTopOffset(state) + getPlannedH(state) + 4 + laneIdx * ROH + ROH / 2;
    const el = mkNode(n, 'actualBranch', shiftedNodeIds.has(n.id));
    el.style.cssText = `left:${n.col * COL + COL / 2 - 14}px;top:${y - 14}px`;
    grp.appendChild(el);
    addDrsDetailLabel(grp, n, n.col * COL + COL / 2, y, state);
  });

  renderStageShiftNodes(grp, state);
  updateMergeTargetClasses();
}

function addDrsDetailLabel(grp, node, x, y, state) {
  const text = String(node.drsDetail || '').trim();
  if (!node.isDRS || !text) return;
  const el = document.createElement('div');
  el.className = 'drs-detail-label';
  el.dataset.labelKey = `drs:${node.id}`;
  el.title = text;
  el.textContent = text;
  const labelWidth = 150;
  const gridW = totalCols(state) * COL;
  const rightFits = x + 22 + labelWidth < gridW;
  const defaultPos = { x: rightFits ? x + 22 : Math.max(4, x - labelWidth - 22), y: y + 12 };
  const pos = state.labelPositions[`drs:${node.id}`] || defaultPos;
  el.style.cssText = `left:${pos.x}px;top:${pos.y}px`;
  el.addEventListener('mousedown', startDrsLabelDrag);
  grp.appendChild(el);
}

function mkNode(n, rType, hasShift) {
  const el = document.createElement('div');
  const cls = rType === 'plan' ? 'plan-node' : rType === 'branch' ? 'branch-node' : 'actual-node';
  el.className = 'node ' + cls;
  el.dataset.nodeId = n.id;
  el.dataset.rType = rType;
  if (n.variantId) el.dataset.variantId = n.variantId;
  if (n.branchId) el.dataset.branchId = n.branchId;

  const dh = n.date ? `<span class="node-date">${fmtDate(n.date)}</span>` : '';
  const shape = n.type === 'circle' ? 'circle' : 'square';
  el.innerHTML = `
    <span class="node-label-top">${escapeHtml(n.topLabel || '')}</span>
    <div class="node-shape ${shape}"></div>
    <span class="node-label-bottom">${escapeHtml(n.bottomLabel || '')}</span>
    ${dh}${hasShift ? '<span class="node-shift-cross">×</span>' : ''}<button class="node-del">✕</button>`;

  el.querySelector('.node-del').addEventListener('click', e => {
    e.stopPropagation();
    const a = store.getState();
    if (rType === 'plan') { a.removePlanNode(n.id); a.removeMergeLinksForNode(n.id); }
    else if (rType === 'branch') { a.removeBranchNode(n.id); a.removeMergeLinksForNode(n.id); }
    else if (rType === 'actualBranch') a.removeActualBranchNode(n.id);
    else { a.removeActualNode(n.id); a.removeMergeLinksForNode(n.id); }
    if (mergePick && mergePick.fromNodeId === n.id) clearMergePick();
    const s = store.getState();
    renderGrid(s); renderNodes(s); persistDraftNow();
  });

  el.addEventListener('click', e => handleMergeTargetClick(e, n, rType));
  el.addEventListener('mousedown', startNodeDrag);
  el.addEventListener('contextmenu', e => { e.preventDefault(); showCtx(e, n.id, rType); });
  return el;
}

function renderStageShiftNodes(grp, state) {
  (state.stageShifts || []).forEach(shift => {
    const source = findStageByContext(state, shift.sourceContext, shift.sourceNodeId);
    if (!source) return;
    const target = getStageShiftTargetCenter(shift, source, state);
    if (!target) return;
    const el = mkShiftedNode(source, shift);
    el.style.cssText = `left:${target.x - 14}px;top:${target.y - 14}px`;
    grp.appendChild(el);
  });
}

function mkShiftedNode(source, shift) {
  const el = document.createElement('div');
  const shape = source.type === 'circle' ? 'circle' : 'square';
  el.className = `node shifted-node shifted-${shift.mode}`;
  el.dataset.sourceNodeId = shift.sourceNodeId;
  el.dataset.shiftId = shift.id;
  el.innerHTML = `
    <span class="node-label-top">${escapeHtml(source.topLabel || '')}</span>
    <div class="node-shape ${shape}"></div>
    <span class="node-label-bottom">${escapeHtml(source.bottomLabel || '')}</span>
    ${shift.targetDate ? `<span class="node-date">${fmtDate(shift.targetDate)}</span>` : ''}
    <span class="shift-mode-label">${shift.mode === 'preponed' ? 'Preponed' : 'Postponed'}</span>`;
  return el;
}

function renderBottomTables(state) {
  state = state || store.getState();
  renderDynTable('msTableWrap', state.leftTable, {
    updateCell: (ri, ci, v) => { store.getState().updateLeftTableCell(ri, ci, v); renderMilestoneTableOverlay(store.getState()); scheduleDraftSave(); },
    updateColName: (ci, name) => { store.getState().updateLeftTableColName(ci, name); renderMilestoneTableOverlay(store.getState()); scheduleDraftSave(); },
    deleteCol: (ci) => { store.getState().deleteLeftTableCol(ci); renderBottomTables(); renderMilestoneTableOverlay(store.getState()); persistDraftNow(); },
    deleteRow: (ri) => { store.getState().deleteLeftTableRow(ri); renderBottomTables(); renderMilestoneTableOverlay(store.getState()); persistDraftNow(); },
  });
  renderDynTable('eopTableWrap', state.rightTable, {
    updateCell: (ri, ci, v) => { store.getState().updateRightTableCell(ri, ci, v); scheduleDraftSave(); },
    updateColName: (ci, name) => { store.getState().updateRightTableColName(ci, name); scheduleDraftSave(); },
    deleteCol: (ci) => { store.getState().deleteRightTableCol(ci); renderBottomTables(); persistDraftNow(); },
    deleteRow: (ri) => { store.getState().deleteRightTableRow(ri); renderBottomTables(); persistDraftNow(); },
  });
}

function renderDynTable(wrapId, tbl, cbs) {
  const wrap = $(wrapId);
  wrap.innerHTML = '';
  const table = document.createElement('table');
  table.className = 'dyn-table';

  const thead = document.createElement('thead');
  const htr = document.createElement('tr');
  tbl.cols.forEach((col, ci) => {
    const th = document.createElement('th');
    th.className = 'dyn-th';
    const sp = document.createElement('span');
    sp.contentEditable = 'true';
    sp.className = 'th-name';
    sp.textContent = col;
    sp.addEventListener('blur', () => cbs.updateColName(ci, sp.textContent.trim()));
    th.appendChild(sp);
    if (ci > 0) {
      const dx = document.createElement('button');
      dx.className = 'col-del';
      dx.textContent = '×';
      dx.addEventListener('click', () => cbs.deleteCol(ci));
      th.appendChild(dx);
    }
    htr.appendChild(th);
  });
  thead.appendChild(htr);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  tbl.rows.forEach((row, ri) => {
    const tr = document.createElement('tr');
    row.forEach((cell, ci) => {
      const td = document.createElement('td');
      const isDateCol = tbl.cols[ci] && /date|month/i.test(tbl.cols[ci]);

      if (isDateCol) {
        td.className = 'dyn-td dyn-td-date';
        const inp = document.createElement('input');
        inp.type = 'month';
        inp.value = cell || '';
        inp.className = 'dyn-date-input';
        inp.addEventListener('change', () => cbs.updateCell(ri, ci, inp.value));
        td.appendChild(inp);
      } else {
        td.className = 'dyn-td' + (cell ? ' filled' : '');
        td.contentEditable = 'true';
        td.textContent = cell;
        td.addEventListener('input', () => {
          cbs.updateCell(ri, ci, td.textContent.trim());
          td.classList.toggle('filled', !!td.textContent.trim());
        });
      }
      tr.appendChild(td);
    });

    const tdx = document.createElement('td');
    tdx.className = 'dyn-td row-del-cell';
    const rdx = document.createElement('button');
    rdx.className = 'row-del';
    rdx.textContent = '×';
    rdx.addEventListener('click', () => cbs.deleteRow(ri));
    tdx.appendChild(rdx);
    tr.appendChild(tdx);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
}

function renderVariantLabels(state) {
  tlGrid.querySelectorAll('.vr-float-label').forEach(e => e.remove());
  getPlanLanes(state).forEach((lane, laneIdx) => {
    if (lane.type !== 'plan') return;
    addVariantLabel(`plan:${lane.variantId}`, lane.variantId, lane.label, 50,
      getTopOffset(state) + laneIdx * ROH + ROH / 2 - 7, 'plan', state);
  });
  getActualLanes(state).forEach((lane, laneIdx) => {
    if (lane.type !== 'actual') return;
    addVariantLabel(`actual:${lane.variantId}`, lane.variantId, lane.label, 50,
      getTopOffset(state) + getPlannedH(state) + 4 + laneIdx * ROH + ROH / 2 - 7, 'actual', state);
  });
}

function addVariantLabel(key, variantId, text, defaultX, defaultY, mode, state) {
  const el = document.createElement('div');
  el.className = 'vr-float-label ' + (mode === 'actual' ? 'actual-vr-label' : 'plan-vr-label');
  el.dataset.labelKey = key;
  el.dataset.vrId = variantId;
  const pos = state.labelPositions[key] || { x: defaultX, y: defaultY };
  el.style.cssText = `left:${pos.x}px;top:${pos.y}px`;
  el.textContent = text || '';
  const del = document.createElement('button');
  del.className = 'vfl-del';
  del.textContent = '×';
  del.addEventListener('click', event => {
    event.stopPropagation();
    window.deleteVariant(variantId);
  });
  el.appendChild(del);
  el.addEventListener('mousedown', startVLabelDrag);
  tlGrid.appendChild(el);
}

function renderCanvasRemarks(state) {
  tlGrid.querySelectorAll('.canvas-remark').forEach(e => e.remove());
  if (!state.remarks) return;
  const el = document.createElement('div');
  el.className = 'canvas-remark';
  const defaultY = getTopOffset(state) + getPlannedH(state) + 4 + ROH / 2 + 18;
  const pos = state.remarkPosition || { x: 120, y: defaultY };
  el.style.cssText = `left:${pos.x}px;top:${pos.y}px`;
  el.textContent = state.remarks;
  el.addEventListener('mousedown', startRemarkDrag);
  tlGrid.appendChild(el);
}

function renderMilestoneTableOverlay(state) {
  tlGrid.querySelectorAll('.milestone-grid-table').forEach(e => e.remove());
  if (!state.milestoneTableVisible) return;
  const data = getMilestoneTableRows(state);
  if (!data.cols.length || !data.rows.length) return;

  const el = document.createElement('div');
  el.className = 'milestone-grid-table';
  el.dataset.labelKey = 'milestone:table';
  const defaultPos = { x: 132, y: getTopOffset(state) + 14 };
  const pos = state.labelPositions['milestone:table'] || defaultPos;
  el.style.cssText = `left:${pos.x}px;top:${pos.y}px`;

  const title = document.createElement('div');
  title.className = 'milestone-grid-title';
  title.textContent = 'Milestone Table';
  el.appendChild(title);

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const htr = document.createElement('tr');
  data.cols.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col;
    htr.appendChild(th);
  });
  thead.appendChild(htr);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  data.rows.forEach(row => {
    const tr = document.createElement('tr');
    row.forEach(cell => {
      const td = document.createElement('td');
      td.textContent = cell;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  el.appendChild(table);

  el.addEventListener('mousedown', startMilestoneTableDrag);
  tlGrid.appendChild(el);
}

function renderMergeHint(state) {
  tlGrid.querySelectorAll('.merge-target-hint').forEach(e => e.remove());
  if (!mergePick) return;
  const grp = tlGrid.querySelector('.grid-vr-grp');
  if (!grp) return;
  const branch = state.branches.find(b => b.id === mergePick.fromBranchId);
  if (!branch) return;
  const laneIdx = findPlanLaneIndex(state, 'plan', branch.variantId);
  if (laneIdx < 0) return;
  const hint = document.createElement('div');
  hint.className = 'merge-target-hint';
  hint.style.top = (getTopOffset(state) + laneIdx * ROH + 8) + 'px';
  hint.textContent = 'Select parent stage to merge';
  grp.appendChild(hint);
}

function updateMergeTargetClasses() {
  document.querySelectorAll('.node.merge-valid-target,.node.merge-invalid-target').forEach(el => {
    el.classList.remove('merge-valid-target', 'merge-invalid-target');
  });
  if (!mergePick) return;
  const state = store.getState();
  const branch = state.branches.find(b => b.id === mergePick.fromBranchId);
  if (!branch) return;
  document.querySelectorAll('.plan-node').forEach(el => {
    el.classList.add(el.dataset.variantId === branch.variantId ? 'merge-valid-target' : 'merge-invalid-target');
  });
}

async function exportPDF() {
  const overlay = $('pdfOverlay'), st = $('pdfStatus');
  overlay.classList.add('active');
  st.textContent = 'Capturing…';
  const app = document.querySelector('.app');
  const prev = { h: app.style.height, of: app.style.overflow };
  app.style.height = 'auto';
  app.style.overflow = 'visible';
  document.querySelectorAll('.node-del,.vr-del-btn,.col-del,.row-del').forEach(el => el.style.display = 'none');
  await new Promise(r => setTimeout(r, 160));
  try {
    st.textContent = 'Rendering…';
    const canvas = await html2canvas(app, {
      scale: 2, useCORS: true,
      backgroundColor: document.body.dataset.theme === 'dark' ? '#0d1117' : '#dbe8f5',
      scrollX: 0, scrollY: 0, width: app.scrollWidth, height: app.scrollHeight,
      windowWidth: app.scrollWidth, windowHeight: app.scrollHeight,
    });
    st.textContent = 'Building PDF…';
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pW = pdf.internal.pageSize.getWidth(), pH = pdf.internal.pageSize.getHeight(), mg = 8;
    const maxW = pW - mg * 2, maxH = pH - mg * 2;
    const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
    const iW = canvas.width * ratio, iH = canvas.height * ratio;
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', mg + (maxW - iW) / 2, mg + (maxH - iH) / 2, iW, iH);
    pdf.save(`${store.getState().info.project || 'timeline'}_A4.pdf`);
    st.textContent = 'Done!';
    setTimeout(() => overlay.classList.remove('active'), 700);
  } catch (err) {
    st.textContent = 'Error: ' + err.message;
    setTimeout(() => overlay.classList.remove('active'), 2500);
  } finally {
    app.style.height = prev.h;
    app.style.overflow = prev.of;
    document.querySelectorAll('.node-del,.vr-del-btn,.col-del,.row-del').forEach(el => el.style.display = '');
  }
}

// ════════════════════════════════════════════════════════════════
// § 6  EVENTS  ─  call store actions, then re-render as needed
// ════════════════════════════════════════════════════════════════

// Transient UI state (not persisted, not in store)
let pendCell = null;
let dragNode = null, dox = 0, doy = 0;
let ctxId = null, ctxRowType = null;
let ctxCell = null;
let modalCb = null;
let dragVL = null, dvox = 0, dvoy = 0;
let dragRemark = null, drox = 0, droy = 0;
let dragDrsLabel = null, ddlx = 0, ddly = 0;
let dragMilestoneTable = null, dmox = 0, dmoy = 0;
let mergePick = null;

// ── Header form ──
function bindHeader() {
  const { info, remarks } = store.getState();
  $('fProject').value = info.project;
  $('fLocation').value = info.location;
  $('fPlant').value = info.plant;
  $('fProjType').value = info.type;
  $('fStatus').value = info.status;
  $('remarksBox').textContent = remarks || '';
  syncPubBtn();

  const map = { fProject: 'project', fLocation: 'location', fPlant: 'plant', fProjType: 'type', fStatus: 'status' };
  Object.entries(map).forEach(([id, key]) => {
    $(id).addEventListener('input', () => {
      store.getState().setInfo({ [key]: $(id).value });
      if (key === 'project' || key === 'location' || key === 'plant') renderSidebar(store.getState());
      scheduleDraftSave();
    });
  });

  $('publishToggle').addEventListener('click', () => {
    store.getState().setPublished(!store.getState().info.published);
    syncPubBtn();
    persistDraftNow();
  });

  $('revertDraftBtn').addEventListener('click', revertDraftToBaseline);

  $('remarksBox').addEventListener('input', () => {
    store.getState().setRemarks($('remarksBox').textContent.trim());
    renderCanvasRemarks(store.getState());
    scheduleDraftSave();
  });
}

function syncPubBtn() {
  const btn = $('publishToggle');
  const pub = store.getState().info.published;
  btn.textContent = pub ? '✓ Published' : 'Not Publish';
  btn.classList.toggle('published', pub);
}

// ── Cell click → open node popup ──
function onCellClick(e) {
  if (e.target.closest('.node')) return;
  if (mergePick) { clearMergePick(); return; }
  const cell = e.currentTarget;
  const col = +cell.dataset.col;
  const vId = cell.dataset.vId;
  const rType = cell.dataset.rType;
  const branchId = cell.dataset.branchId || null;
  pendCell = { col, vId, rType, branchId };
  const r = cell.getBoundingClientRect();
  nodePopup.style.cssText = `left:${r.left}px;top:${r.bottom + 4}px`;
  nodePopup.classList.add('active');
  $('npTop').value = '';
  $('npBottom').value = '';
  $('npDate').value = '';
  $('npShape').value = $('nodeTypeSelect').value;
  $('npIsDRS').checked = false;
  $('npDrsDetail').style.display = 'none';
  $('npDrsDetail').value = '';
  $('npTop').focus();
}

// ── Node popup ──
$('npIsDRS').addEventListener('change', () => {
  $('npDrsDetail').style.display = $('npIsDRS').checked ? 'block' : 'none';
});

$('npConfirm').addEventListener('click', () => {
  if (!pendCell) return;
  const { col, vId, rType, branchId } = pendCell;
  const base = {
    col,
    type: $('npShape').value,
    topLabel: $('npTop').value.trim(),
    bottomLabel: $('npBottom').value.trim(),
    date: $('npDate').value,
    isDRS: $('npIsDRS').checked,
    drsDetail: $('npIsDRS').checked ? $('npDrsDetail').value.trim() : '',
  };
  const a = store.getState();
  if (rType === 'plan') a.addPlanNode({ ...base, variantId: vId });
  else if (rType === 'branch') a.addBranchNode({ ...base, branchId });
  else if (rType === 'actualBranch') a.addActualBranchNode({ ...base, branchId });
  else a.addActualNode({ ...base, variantId: vId });

  nodePopup.classList.remove('active');
  pendCell = null;
  const s = store.getState();
  renderGrid(s); renderNodes(s); persistDraftNow();
});

$('npCancel').addEventListener('click', () => {
  nodePopup.classList.remove('active');
  pendCell = null;
});

// ── Context menu ──
function showCtx(e, nodeId, rType) {
  ctxId = nodeId; ctxRowType = rType; ctxCell = null;
  const state = store.getState();
  const planNode = rType === 'plan' ? state.planNodes.find(n => n.id === nodeId) : null;
  const branchNode = rType === 'branch' ? state.branchNodes.find(n => n.id === nodeId) : null;
  ctxMenu.style.cssText = `left:${e.clientX}px;top:${e.clientY}px`;
  ctxMenu.classList.add('active');
  $('ctxBranch').textContent = '🌿 New Branch from here';
  $('ctxBranch').style.display = planNode && canStartBranchAtCol(state, planNode.variantId, planNode.col) ? 'block' : 'none';
  $('ctxMerge').style.display = rType === 'branch' && isLastBranchNode(branchNode, state) ? 'block' : 'none';
  $('ctxMerge').textContent = 'Merge to month';
  $('ctxPreponed').style.display = 'block';
  $('ctxPostponed').style.display = 'block';
  $('ctxDelete').style.display = 'block';
}

function showCellCtx(e) {
  e.preventDefault();
  const cell = e.currentTarget;
  const col = +cell.dataset.col;
  const vId = cell.dataset.vId;
  if (!canStartBranchAtCol(store.getState(), vId, col)) {
    ctxMenu.classList.remove('active');
    return;
  }
  ctxId = null;
  ctxRowType = 'planCell';
  ctxCell = { col, vId };
  ctxMenu.style.cssText = `left:${e.clientX}px;top:${e.clientY}px`;
  ctxMenu.classList.add('active');
  $('ctxBranch').textContent = '🌿 New Branch from this month';
  $('ctxBranch').style.display = 'block';
  $('ctxMerge').style.display = 'none';
  $('ctxPreponed').style.display = 'none';
  $('ctxPostponed').style.display = 'none';
  $('ctxDelete').style.display = 'none';
}

$('ctxBranch').addEventListener('click', () => {
  ctxMenu.classList.remove('active');
  const state = store.getState();
  const parent = ctxId ? state.planNodes.find(n => n.id === ctxId) : null;
  const sourceCol = parent ? parent.col : ctxCell && ctxCell.col;
  const variantId = parent ? parent.variantId : ctxCell && ctxCell.vId;
  if (!variantId || !Number.isFinite(sourceCol)) return;
  if (!canStartBranchAtCol(state, variantId, sourceCol)) return;
  const sourceDate = (parent && parent.date) || colToDate(sourceCol, state);
  openModal('New Branch', `<div class="form-group"><label>Branch Label</label><input id="f_bl" type="text" placeholder="e.g. Gas variant"/></div>`, () => {
    const label = $('f_bl').value.trim() || 'Branch';
    store.getState().addBranch({
      variantId,
      parentNodeId: parent ? parent.id : '',
      sourceNodeId: parent ? parent.id : '',
      sourceCol,
      sourceDate,
      label,
    });
    ctxCell = null;
    renderAll(); persistDraftNow();
  });
});

$('ctxMerge').addEventListener('click', e => {
  e.stopPropagation();
  ctxMenu.classList.remove('active');
  const fromNode = store.getState().branchNodes.find(n => n.id === ctxId);
  if (!fromNode) return;
  openModal('Merge Branch', `<div class="form-group"><label>Merge Month</label><input id="f_merge_month" type="month"/></div>`, () => {
    const date = $('f_merge_month').value;
    if (!date) {
      alert('Select a merge month.');
      return false;
    }
    store.getState().ensureYearVisible(date);
    const state = store.getState();
    const branch = state.branches.find(b => b.id === fromNode.branchId);
    if (!branch) return;
    const col = dateToCol(date, state);
    const validation = canMergeBranchNodeToCol(fromNode, col, state);
    if (!validation.ok) {
      alert(validation.reason);
      return false;
    }
    const targetNode = findPlanNodeAtCol(state, branch.variantId, col);
    store.getState().addMergeLink({
      fromNodeId: fromNode.id,
      fromBranchId: fromNode.branchId,
      toNodeId: targetNode ? targetNode.id : '',
      toCol: col,
      toDate: date,
    });
    renderAll(); persistDraftNow();
    return true;
  });
});

$('ctxPreponed').addEventListener('click', () => openStageShiftModal('preponed'));
$('ctxPostponed').addEventListener('click', () => openStageShiftModal('postponed'));

function openStageShiftModal(mode) {
  ctxMenu.classList.remove('active');
  const state = store.getState();
  const source = findStageByContext(state, ctxRowType, ctxId);
  if (!source) return;
  const title = mode === 'preponed' ? 'Preponed Stage' : 'Postponed Stage';
  const label = mode === 'preponed' ? 'Preponed Month' : 'Postponed Month';
  openModal(title, `<div class="form-group"><label>${label}</label><input id="f_shift_month" type="month"/></div>`, () => {
    const date = $('f_shift_month').value;
    if (!date) {
      alert(`Select a ${mode === 'preponed' ? 'preponed' : 'postponed'} month.`);
      return false;
    }
    store.getState().ensureYearVisible(date);
    const nextState = store.getState();
    const targetCol = dateToCol(date, nextState);
    const validation = canAddStageShift(source, mode, targetCol);
    if (!validation.ok) {
      alert(validation.reason);
      return false;
    }
    store.getState().addStageShift({
      sourceNodeId: source.id,
      sourceContext: ctxRowType,
      mode,
      targetDate: date,
      targetCol,
    });
    renderAll(); persistDraftNow();
    return true;
  });
}

$('ctxDelete').addEventListener('click', () => {
  ctxMenu.classList.remove('active');
  if (!ctxId) return;
  const a = store.getState();
  if (ctxRowType === 'plan') { a.removePlanNode(ctxId); a.removeMergeLinksForNode(ctxId); }
  else if (ctxRowType === 'branch') { a.removeBranchNode(ctxId); a.removeMergeLinksForNode(ctxId); }
  else if (ctxRowType === 'actualBranch') a.removeActualBranchNode(ctxId);
  else { a.removeActualNode(ctxId); a.removeMergeLinksForNode(ctxId); }
  if (mergePick && mergePick.fromNodeId === ctxId) clearMergePick();
  ctxId = null;
  const s = store.getState();
  renderGrid(s); renderNodes(s); persistDraftNow();
});

document.addEventListener('click', e => {
  if (!ctxMenu.contains(e.target)) ctxMenu.classList.remove('active');
  if (mergePick && !e.target.closest('.node') && !e.target.closest('#ctxMenu')) clearMergePick();
});

// ── Merge pick ──
function setMergePick(nextPick) {
  mergePick = nextPick;
  document.body.classList.add('merge-select-mode');
  updateMergeTargetClasses();
  renderMergeHint(store.getState());
}

function clearMergePick() {
  mergePick = null;
  document.body.classList.remove('merge-select-mode');
  updateMergeTargetClasses();
  renderMergeHint(store.getState());
}

function handleMergeTargetClick(e, node, rType) {
  if (!mergePick) return false;
  e.preventDefault();
  e.stopPropagation();
  if (rType !== 'plan') return true;

  const state = store.getState();
  const branch = state.branches.find(b => b.id === mergePick.fromBranchId);
  if (!branch || branch.variantId !== node.variantId) return true;

  store.getState().addMergeLink({
    fromNodeId: mergePick.fromNodeId,
    fromBranchId: mergePick.fromBranchId,
    toNodeId: node.id,
  });
  clearMergePick();
  renderAll(); persistDraftNow();
  return true;
}

// ── Variants ──
$('addVariantBtn').addEventListener('click', () => {
  const name = $('variantInput').value.trim();
  if (!name) return;
  store.getState().addVariant(name);
  $('variantInput').value = '';
  renderAll(); persistDraftNow();
});

$('variantInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') $('addVariantBtn').click();
});

window.deleteVariant = (id) => {
  if (!confirm('Delete this variant and all its stages?')) return;
  const branchIds = new Set(store.getState().branches.filter(b => b.variantId === id).map(b => b.id));
  store.getState().deleteVariant(id);
  if (mergePick && branchIds.has(mergePick.fromBranchId)) clearMergePick();
  renderAll(); persistDraftNow();
};

// ── Bottom table buttons ──
$('addMsRowBtn').addEventListener('click', () => { store.getState().addLeftTableRow(); renderBottomTables(); persistDraftNow(); });
$('addMsColBtn').addEventListener('click', () => { store.getState().addLeftTableCol(); renderBottomTables(); persistDraftNow(); });
$('addEopRowBtn').addEventListener('click', () => { store.getState().addRightTableRow(); renderBottomTables(); persistDraftNow(); });
$('addEopColBtn').addEventListener('click', () => { store.getState().addRightTableCol(); renderBottomTables(); persistDraftNow(); });

$('copyActualBtn').addEventListener('click', () => {
  store.getState().copyPlanToActual();
  renderAll();
  persistDraftNow();
  updateDraftStatus('Plan copied to Actual');
  setTimeout(() => updateDraftStatus(), 1400);
});

// ── Drag nodes ──
function startNodeDrag(e) {
  if (e.target.classList.contains('node-del')) return;
  if (mergePick) return;
  e.preventDefault();
  dragNode = e.currentTarget;
  const r = dragNode.getBoundingClientRect();
  dox = e.clientX - r.left; doy = e.clientY - r.top;
  dragNode.style.opacity = '.6'; dragNode.style.zIndex = '50';
  document.addEventListener('mousemove', onNodeMove);
  document.addEventListener('mouseup', onNodeUp);
}

function onNodeMove(e) {
  if (!dragNode) return;
  const grp = dragNode.closest('.grid-vr-grp');
  const gr = grp.getBoundingClientRect();
  dragNode.style.left = Math.max(0, e.clientX - gr.left - dox) + 'px';
  dragNode.style.top = Math.max(0, e.clientY - gr.top - doy) + 'px';
}

function onNodeUp(e) {
  if (!dragNode) return;
  const grp = dragNode.closest('.grid-vr-grp');
  const gr = grp.getBoundingClientRect();
  const nid = dragNode.dataset.nodeId;
  const rType = dragNode.dataset.rType;
  const state = store.getState();
  const newCol = Math.max(0, Math.min(Math.floor((e.clientX - gr.left - dox + 14) / COL), totalCols(state) - 1));
  const a = store.getState();
  if (rType === 'plan') a.movePlanNode(nid, newCol);
  else if (rType === 'branch') a.moveBranchNode(nid, newCol);
  else if (rType === 'actualBranch') a.moveActualBranchNode(nid, newCol);
  else a.moveActualNode(nid, newCol);

  dragNode.style.opacity = '1'; dragNode.style.zIndex = '5';
  dragNode = null;
  document.removeEventListener('mousemove', onNodeMove);
  document.removeEventListener('mouseup', onNodeUp);
  const s = store.getState();
  renderGrid(s); renderNodes(s); persistDraftNow();
}

// ── Drag variant labels ──
function startVLabelDrag(e) {
  if (e.target.classList.contains('vfl-del')) return;
  e.preventDefault();
  dragVL = e.currentTarget;
  const r = dragVL.getBoundingClientRect();
  dvox = e.clientX - r.left; dvoy = e.clientY - r.top;
  dragVL.style.zIndex = '20';
  document.addEventListener('mousemove', onVLMove);
  document.addEventListener('mouseup', onVLUp);
}

function onVLMove(e) {
  if (!dragVL) return;
  const gr = tlGrid.getBoundingClientRect();
  dragVL.style.left = (e.clientX - gr.left - dvox) + 'px';
  dragVL.style.top = (e.clientY - gr.top - dvoy) + 'px';
}

function onVLUp(e) {
  if (!dragVL) return;
  const gr = tlGrid.getBoundingClientRect();
  const key = dragVL.dataset.labelKey;
  if (key) {
    store.getState().setLabelPosition(key, {
      x: e.clientX - gr.left - dvox,
      y: e.clientY - gr.top - dvoy,
    });
  }
  dragVL.style.zIndex = '6';
  dragVL = null;
  document.removeEventListener('mousemove', onVLMove);
  document.removeEventListener('mouseup', onVLUp);
  persistDraftNow();
}

// ── Drag remarks ──
function startRemarkDrag(e) {
  e.preventDefault();
  dragRemark = e.currentTarget;
  const r = dragRemark.getBoundingClientRect();
  drox = e.clientX - r.left; droy = e.clientY - r.top;
  dragRemark.style.zIndex = '25';
  document.addEventListener('mousemove', onRemarkMove);
  document.addEventListener('mouseup', onRemarkUp);
}

function onRemarkMove(e) {
  if (!dragRemark) return;
  const gr = tlGrid.getBoundingClientRect();
  dragRemark.style.left = (e.clientX - gr.left - drox) + 'px';
  dragRemark.style.top = (e.clientY - gr.top - droy) + 'px';
}

function onRemarkUp(e) {
  if (!dragRemark) return;
  const gr = tlGrid.getBoundingClientRect();
  store.getState().setRemarkPosition({
    x: e.clientX - gr.left - drox,
    y: e.clientY - gr.top - droy,
  });
  dragRemark.style.zIndex = '7';
  dragRemark = null;
  document.removeEventListener('mousemove', onRemarkMove);
  document.removeEventListener('mouseup', onRemarkUp);
  persistDraftNow();
}

// ── Drag milestone table ──
function startMilestoneTableDrag(e) {
  e.preventDefault();
  dragMilestoneTable = e.currentTarget;
  const r = dragMilestoneTable.getBoundingClientRect();
  dmox = e.clientX - r.left; dmoy = e.clientY - r.top;
  dragMilestoneTable.style.zIndex = '27';
  document.addEventListener('mousemove', onMilestoneTableMove);
  document.addEventListener('mouseup', onMilestoneTableUp);
}

function onMilestoneTableMove(e) {
  if (!dragMilestoneTable) return;
  const gr = tlGrid.getBoundingClientRect();
  dragMilestoneTable.style.left = (e.clientX - gr.left - dmox) + 'px';
  dragMilestoneTable.style.top = (e.clientY - gr.top - dmoy) + 'px';
}

function onMilestoneTableUp(e) {
  if (!dragMilestoneTable) return;
  const gr = tlGrid.getBoundingClientRect();
  const key = dragMilestoneTable.dataset.labelKey;
  if (key) {
    store.getState().setLabelPosition(key, {
      x: e.clientX - gr.left - dmox,
      y: e.clientY - gr.top - dmoy,
    });
  }
  dragMilestoneTable.style.zIndex = '9';
  dragMilestoneTable = null;
  document.removeEventListener('mousemove', onMilestoneTableMove);
  document.removeEventListener('mouseup', onMilestoneTableUp);
  persistDraftNow();
}

// ── Drag DRS detail labels ──
function startDrsLabelDrag(e) {
  e.preventDefault();
  e.stopPropagation();
  dragDrsLabel = e.currentTarget;
  const r = dragDrsLabel.getBoundingClientRect();
  ddlx = e.clientX - r.left; ddly = e.clientY - r.top;
  dragDrsLabel.style.zIndex = '26';
  document.addEventListener('mousemove', onDrsLabelMove);
  document.addEventListener('mouseup', onDrsLabelUp);
}

function onDrsLabelMove(e) {
  if (!dragDrsLabel) return;
  const grp = dragDrsLabel.closest('.grid-vr-grp');
  const gr = grp.getBoundingClientRect();
  dragDrsLabel.style.left = (e.clientX - gr.left - ddlx) + 'px';
  dragDrsLabel.style.top = (e.clientY - gr.top - ddly) + 'px';
}

function onDrsLabelUp(e) {
  if (!dragDrsLabel) return;
  const grp = dragDrsLabel.closest('.grid-vr-grp');
  const gr = grp.getBoundingClientRect();
  const key = dragDrsLabel.dataset.labelKey;
  if (key) {
    store.getState().setLabelPosition(key, {
      x: e.clientX - gr.left - ddlx,
      y: e.clientY - gr.top - ddly,
    });
  }
  dragDrsLabel.style.zIndex = '8';
  dragDrsLabel = null;
  document.removeEventListener('mousemove', onDrsLabelMove);
  document.removeEventListener('mouseup', onDrsLabelUp);
  persistDraftNow();
}

// ── Theme ──
$('themeToggleBtn').addEventListener('click', () => {
  const isDark = document.body.dataset.theme === 'dark';
  document.body.dataset.theme = isDark ? 'light' : 'dark';
  $('themeToggleBtn').textContent = isDark ? '🌙' : '☀️';
});

// ── Add year ──
$('addYearBtn').addEventListener('click', () => {
  store.getState().addYear();
  renderAll(); persistDraftNow();
});

// ── Submit / Back ──
$('submitBtn').addEventListener('click', async () => {
  const state = store.getState();
  if (getMilestoneTableRows(state).rows.length) {
    store.getState().showMilestoneTable();
    renderAll();
    persistDraftNow();
  }
  const parsedEopItems = parseEopItems(state);
  if (!parsedEopItems.length) {
    alert('Enter at least one EOP date in a Date/Month column as YYYY-MM (use the month picker).');
    return;
  }
  parsedEopItems.forEach(item => store.getState().ensureYearVisible(item.date));
  const eopItems = parseEopItems(store.getState());
  store.getState().setEopItems(eopItems);
  store.getState().setEopDate(eopItems[0].date);
  renderAll();
  persistDraftNow();

  const draft = captureState();
  const baseline = getBaselineState();
  if (!isDirty(draft, baseline)) {
    updateDraftStatus('Already saved');
    setTimeout(() => updateDraftStatus(), 1400);
    return;
  }

  const submitBtn = $('submitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving…';
  try {
    const result = await saveDraftToDataverse(draft, baseline);
    const submitted = adoptProjectId(result && result.projectId, draft);
    const keys = getCurrentStorageKeys();
    writeLocalJson(keys.baseline, submitted);
    writeLocalJson(keys.draft, submitted);
    store.getState().replaceState(submitted);
    syncHeaderInputsFromState();
    updateDraftStatus(result && result.developmentOnly ? 'Saved locally for Dataverse' : 'Saved');
    setTimeout(() => updateDraftStatus(), 1800);
  } catch (err) {
    console.error(err);
    updateDraftStatus('Save failed');
    alert('Could not save to Dataverse. Your local draft is still saved in this browser.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit';
  }
});

$('backBtn').addEventListener('click', () => {
  if (confirm('Go back? Unsaved changes will be lost.')) history.back();
});

// ── PDF export ──
$('exportBtn').addEventListener('click', exportPDF);
$('pdfA4Btn').addEventListener('click', exportPDF);

// ── Close popups ──
document.addEventListener('click', e => {
  if (!nodePopup.contains(e.target) && !e.target.closest('.g-cell')) {
    nodePopup.classList.remove('active');
    pendCell = null;
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    nodePopup.classList.remove('active');
    ctxMenu.classList.remove('active');
    if (mergePick) clearMergePick();
  }
});

// ── Scroll sync ──
function syncScroll() {
  tlScroll.addEventListener('scroll', () => { sbRows.scrollTop = tlScroll.scrollTop; });
  sbRows.addEventListener('scroll', () => { tlScroll.scrollTop = sbRows.scrollTop; });
}

// ── Sidebar resize ──
function setupResize() {
  const handle = $('sidebarResizeHandle'), sb = $('sidebar');
  let resizing = false;
  handle.addEventListener('mousedown', () => {
    resizing = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });
  document.addEventListener('mousemove', e => {
    if (resizing) sb.style.width = Math.max(240, Math.min(560, e.clientX)) + 'px';
  });
  document.addEventListener('mouseup', () => {
    if (resizing) { resizing = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; }
  });
}

// ── Modal ──
function openModal(title, bodyHTML, onOk) {
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHTML;
  modalCb = onOk;
  modalOverlay.classList.add('active');
  setTimeout(() => { const f = modalBody.querySelector('input'); if (f) f.focus(); }, 80);
}

function closeModal() {
  modalOverlay.classList.remove('active');
  modalCb = null;
}

$('modalOk').addEventListener('click', () => {
  if (modalCb && modalCb() === false) return;
  closeModal();
});
$('modalCancel').addEventListener('click', closeModal);
$('modalClose').addEventListener('click', closeModal);
$('modalOverlay').addEventListener('click', e => { if (e.target === $('modalOverlay')) closeModal(); });

// ── Shape select helper ──
function fillShapeSelect(selectEl) {
  selectEl.innerHTML = NODE_SHAPES.map(s => `<option value="${s.value}">${s.label}</option>`).join('');
}

// ════════════════════════════════════════════════════════════════
// § 7  BOOTSTRAP
// ════════════════════════════════════════════════════════════════

store.subscribe(scheduleDraftSave);

initPersistenceState();
bindHeader();
fillShapeSelect($('nodeTypeSelect'));
fillShapeSelect($('npShape'));
renderAll();
updateDraftStatus();
syncScroll();
setupResize();
