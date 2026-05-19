// ════════════════════════════════════════════════════════════════
// § 1  CONSTANTS + CORE UTILITIES
// ════════════════════════════════════════════════════════════════

const COL = 52, ROH = 90, YH = 34, MH = 30;
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
  leftTable: { cols: ['Milestone', 'DOM Gas', 'DOM CNG'], rows: [['DA', '', ''], ['SOS', '', '']] },
  rightTable: { cols: ['Model Detail', 'Date- month/year'], rows: [['', '']] },
  remarks: '',
  years: [2024, 2025],
  eopDate: '',
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

  // ── Variants ──
  addVariant: (name) => set(s => ({
    variants: [...s.variants, { id: 'i' + s.nid, name }],
    nid: s.nid + 1,
  })),
  deleteVariant: (id) => set(s => {
    const bids = new Set(s.branches.filter(b => b.variantId === id).map(b => b.id));
    const remainingPlanIds = new Set(s.planNodes.filter(n => n.variantId !== id).map(n => n.id));
    return {
      variants: s.variants.filter(v => v.id !== id),
      planNodes: s.planNodes.filter(n => n.variantId !== id),
      actualNodes: s.actualNodes.filter(n => n.variantId !== id),
      branches: s.branches.filter(b => b.variantId !== id),
      branchNodes: s.branchNodes.filter(n => !bids.has(n.branchId)),
      actualBranchNodes: s.actualBranchNodes.filter(n => !bids.has(n.branchId)),
      mergeLinks: s.mergeLinks.filter(l => !bids.has(l.fromBranchId) && remainingPlanIds.has(l.toNodeId)),
    };
  }),

  // ── Plan nodes ──
  addPlanNode: (data) => set(s => ({
    planNodes: [...s.planNodes, { id: 'i' + s.nid, isDRS: false, drsDetail: '', ...data }],
    nid: s.nid + 1,
  })),
  removePlanNode: (id) => set(s => ({ planNodes: s.planNodes.filter(n => n.id !== id) })),
  movePlanNode: (id, col) => set(s => ({ planNodes: s.planNodes.map(n => n.id === id ? { ...n, col } : n) })),

  // ── Actual nodes ──
  addActualNode: (data) => set(s => ({
    actualNodes: [...s.actualNodes, { id: 'i' + s.nid, isDRS: false, drsDetail: '', ...data }],
    nid: s.nid + 1,
  })),
  removeActualNode: (id) => set(s => ({ actualNodes: s.actualNodes.filter(n => n.id !== id) })),
  moveActualNode: (id, col) => set(s => ({ actualNodes: s.actualNodes.map(n => n.id === id ? { ...n, col } : n) })),

  // ── Branch nodes ──
  addBranchNode: (data) => set(s => ({
    branchNodes: [...s.branchNodes, { id: 'i' + s.nid, isDRS: false, drsDetail: '', ...data }],
    nid: s.nid + 1,
  })),
  removeBranchNode: (id) => set(s => ({ branchNodes: s.branchNodes.filter(n => n.id !== id) })),
  moveBranchNode: (id, col) => set(s => ({ branchNodes: s.branchNodes.map(n => n.id === id ? { ...n, col } : n) })),

  // ── Actual branch nodes ──
  addActualBranchNode: (data) => set(s => ({
    actualBranchNodes: [...s.actualBranchNodes, { id: 'i' + s.nid, isDRS: false, drsDetail: '', ...data }],
    nid: s.nid + 1,
  })),
  removeActualBranchNode: (id) => set(s => ({ actualBranchNodes: s.actualBranchNodes.filter(n => n.id !== id) })),
  moveActualBranchNode: (id, col) => set(s => ({ actualBranchNodes: s.actualBranchNodes.map(n => n.id === id ? { ...n, col } : n) })),

  // ── Branches ──
  addBranch: (data) => set(s => {
    const branch = { id: 'i' + s.nid, ...data };
    const insertAt = s.branches.reduce((idx, b, i) => b.variantId === data.variantId ? i + 1 : idx, s.branches.length);
    const branches = [...s.branches];
    branches.splice(insertAt, 0, branch);
    return { branches, nid: s.nid + 1 };
  }),

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
    years: nextState.years ? cloneState(nextState.years) : cloneState(INITIAL_DATA.years),
    labelPositions: nextState.labelPositions || {},
    eopDate: nextState.eopDate || '',
    remarks: nextState.remarks || '',
    remarkPosition: nextState.remarkPosition || null,
  })),
}));

// ════════════════════════════════════════════════════════════════
// § 3  DOMAIN  ─  pure functions (no DOM, no store mutations)
// ════════════════════════════════════════════════════════════════

const totalCols = (state) => state.years.length * 12;
const hasEopLane = (state) => !!state.eopDate;
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

function parseEopDate(state) {
  const row = (state.rightTable.rows || [])[0] || [];
  const raw = (row[1] || '').trim();
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
    display_order: index,
    ...extra(node),
  }));
}

function createDataversePayload(state) {
  const s = normalizeStateForDataverse(state);
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
      nid: s.nid || 1,
    }),
  };

  return {
    project,
    variants: (s.variants || []).map((v, i) => ({ external_id: v.id, name: v.name || '', display_order: i })),
    branches: (s.branches || []).map((b, i) => ({
      external_id: b.id,
      variant_external_id: b.variantId,
      parent_stage_external_id: b.parentNodeId,
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
      target_stage_external_id: l.toNodeId,
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
  state.years.forEach(yr => {
    const yb = document.createElement('div');
    yb.className = 'yr-block';
    yb.style.width = (COL * 12) + 'px';
    yb.textContent = yr;
    yearHeader.appendChild(yb);
    for (let m = 1; m <= 12; m++) {
      const mc = document.createElement('div');
      mc.className = 'mo-cell';
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
      ? makeBranchSubRow(tc, lane.branchId, 'branch', lane.label)
      : makeSubRow(tc, lane.variantId, 'plan');
    grp.appendChild(sr);
  });

  const dv = document.createElement('div');
  dv.className = 'pa-grid-div';
  dv.style.height = '4px';
  dv.style.background = 'var(--border2)';
  grp.appendChild(dv);

  getActualLanes(state).forEach((lane, index) => {
    const sr = lane.type === 'actualBranch'
      ? makeBranchSubRow(tc, lane.branchId, 'actualBranch', lane.label)
      : makeSubRow(tc, lane.variantId, 'actual');
    if (index === 0) sr.classList.add('actual-first');
    grp.appendChild(sr);
  });

  tlGrid.appendChild(grp);
  drawLines(grp, state);
  renderVariantLabels(state);
  renderCanvasRemarks(state);
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
    c.className = 'g-cell eop-cell';
    row.appendChild(c);
  }
  grp.appendChild(row);
  const col = dateToCol(state.eopDate, state);
  if (col < 0) return;
  const y = ROH / 2;
  const x = col * COL + COL / 2;
  const line = document.createElement('div');
  line.className = 'eop-line';
  line.style.cssText = `left:0;top:${y - 1}px;width:${x}px`;
  row.appendChild(line);
  const mark = document.createElement('div');
  mark.className = 'eop-x';
  mark.style.cssText = `left:${x - 8}px;top:${y - 12}px`;
  mark.textContent = 'X';
  row.appendChild(mark);
}

function makeSubRow(tc, vId, rType) {
  const sr = document.createElement('div');
  sr.className = 'grid-sub-row ' + (rType === 'plan' ? 'plan-sub' : 'actual-sub');
  sr.style.height = ROH + 'px';
  sr.style.position = 'relative';
  for (let col = 0; col < tc; col++) {
    const c = document.createElement('div');
    c.className = 'g-cell';
    c.dataset.col = col;
    c.dataset.vId = vId;
    c.dataset.rType = rType;
    c.addEventListener('click', onCellClick);
    sr.appendChild(c);
  }
  return sr;
}

function makeBranchSubRow(tc, branchId, rType, label) {
  const sr = document.createElement('div');
  sr.className = 'grid-sub-row branch-sub' + (rType === 'actualBranch' ? ' actual-branch-sub' : '');
  sr.style.height = ROH + 'px';
  sr.style.position = 'relative';
  for (let col = 0; col < tc; col++) {
    const c = document.createElement('div');
    c.className = 'g-cell';
    c.dataset.col = col;
    c.dataset.branchId = branchId;
    c.dataset.rType = rType;
    c.addEventListener('click', onCellClick);
    sr.appendChild(c);
  }
  const pill = document.createElement('div');
  pill.className = 'branch-div-pill' + (rType === 'actualBranch' ? ' actual-branch-pill' : '');
  pill.textContent = '↳ ' + (label || 'Branch');
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
    const parent = state.planNodes.find(n => n.id === br.parentNodeId);
    const firstChild = getFirstBranchNode(br.id, state);
    if (!parent || !firstChild) return;
    const from = getPlanNodeCenter(parent, state);
    const to = getBranchNodeCenter(firstChild, state);
    if (!from || !to) return;
    addArrowPath(svg, from, to, 'branch-start-arrow', 'branchStartArrow');
    hasArrows = true;
  });

  state.mergeLinks.forEach(link => {
    const fromNode = state.branchNodes.find(n => n.id === link.fromNodeId && n.branchId === link.fromBranchId);
    const toNode = state.planNodes.find(n => n.id === link.toNodeId);
    if (!fromNode || !toNode) return;
    const from = getBranchNodeCenter(fromNode, state);
    const to = getPlanNodeCenter(toNode, state);
    if (!from || !to) return;
    addArrowPath(svg, from, to, 'merge-link-arrow', 'mergeLinkArrow');
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
        <path d="M0,0 L8,4 L0,8 Z" fill="#7c3aed"></path>
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

function renderNodes(state) {
  document.querySelectorAll('.node').forEach(e => e.remove());
  const grp = tlGrid.querySelector('.grid-vr-grp');
  if (!grp) return;

  state.planNodes.forEach(n => {
    const laneIdx = findPlanLaneIndex(state, 'plan', n.variantId);
    if (laneIdx < 0) return;
    const y = getTopOffset(state) + laneIdx * ROH + ROH / 2;
    const el = mkNode(n, 'plan');
    el.style.cssText = `left:${n.col * COL + COL / 2 - 14}px;top:${y - 14}px`;
    grp.appendChild(el);
  });

  state.branchNodes.forEach(n => {
    const laneIdx = findPlanLaneIndex(state, 'branch', n.branchId);
    if (laneIdx < 0) return;
    const y = getTopOffset(state) + laneIdx * ROH + ROH / 2;
    const el = mkNode(n, 'branch');
    el.style.cssText = `left:${n.col * COL + COL / 2 - 14}px;top:${y - 14}px`;
    grp.appendChild(el);
  });

  state.actualNodes.forEach(n => {
    const laneIdx = findActualLaneIndex(state, 'actual', n.variantId);
    if (laneIdx < 0) return;
    const y = getTopOffset(state) + getPlannedH(state) + 4 + laneIdx * ROH + ROH / 2;
    const el = mkNode(n, 'actual');
    el.style.cssText = `left:${n.col * COL + COL / 2 - 14}px;top:${y - 14}px`;
    grp.appendChild(el);
  });

  state.actualBranchNodes.forEach(n => {
    const laneIdx = findActualLaneIndex(state, 'branch', n.branchId);
    if (laneIdx < 0) return;
    const y = getTopOffset(state) + getPlannedH(state) + 4 + laneIdx * ROH + ROH / 2;
    const el = mkNode(n, 'actualBranch');
    el.style.cssText = `left:${n.col * COL + COL / 2 - 14}px;top:${y - 14}px`;
    grp.appendChild(el);
  });

  updateMergeTargetClasses();
}

function mkNode(n, rType) {
  const el = document.createElement('div');
  const cls = rType === 'plan' ? 'plan-node' : rType === 'branch' ? 'branch-node' : 'actual-node';
  el.className = 'node ' + cls;
  el.dataset.nodeId = n.id;
  el.dataset.rType = rType;
  if (n.variantId) el.dataset.variantId = n.variantId;
  if (n.branchId) el.dataset.branchId = n.branchId;

  const dh = n.date ? `<span class="node-date">${fmtDate(n.date)}</span>` : '';
  const drsIndicator = n.isDRS ? '<span class="node-drs-badge" title="DRS Available">DRS</span>' : '';
  const shape = n.type === 'circle' ? 'circle' : 'square';
  el.innerHTML = `
    <span class="node-label-top">${escapeHtml(n.topLabel || '')}</span>
    <div class="node-shape ${shape}"></div>
    <span class="node-label-bottom">${escapeHtml(n.bottomLabel || '')}</span>
    ${dh}${drsIndicator}<button class="node-del">✕</button>`;

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

function renderBottomTables(state) {
  state = state || store.getState();
  renderDynTable('msTableWrap', state.leftTable, {
    updateCell: (ri, ci, v) => { store.getState().updateLeftTableCell(ri, ci, v); scheduleDraftSave(); },
    updateColName: (ci, name) => { store.getState().updateLeftTableColName(ci, name); scheduleDraftSave(); },
    deleteCol: (ci) => { store.getState().deleteLeftTableCol(ci); renderBottomTables(); persistDraftNow(); },
    deleteRow: (ri) => { store.getState().deleteLeftTableRow(ri); renderBottomTables(); persistDraftNow(); },
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
let modalCb = null;
let dragVL = null, dvox = 0, dvoy = 0;
let dragRemark = null, drox = 0, droy = 0;
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
  ctxId = nodeId; ctxRowType = rType;
  ctxMenu.style.cssText = `left:${e.clientX}px;top:${e.clientY}px`;
  ctxMenu.classList.add('active');
  $('ctxBranch').style.display = rType === 'plan' ? 'block' : 'none';
  $('ctxMerge').style.display = rType === 'branch' ? 'block' : 'none';
}

$('ctxBranch').addEventListener('click', () => {
  ctxMenu.classList.remove('active');
  const parent = store.getState().planNodes.find(n => n.id === ctxId);
  if (!parent) return;
  openModal('New Branch', `<div class="form-group"><label>Branch Label</label><input id="f_bl" type="text" placeholder="e.g. Gas variant"/></div>`, () => {
    const label = $('f_bl').value.trim() || 'Branch';
    store.getState().addBranch({ variantId: parent.variantId, parentNodeId: ctxId, label });
    renderAll(); persistDraftNow();
  });
});

$('ctxMerge').addEventListener('click', e => {
  e.stopPropagation();
  ctxMenu.classList.remove('active');
  const fromNode = store.getState().branchNodes.find(n => n.id === ctxId);
  if (!fromNode) return;
  setMergePick({ fromNodeId: fromNode.id, fromBranchId: fromNode.branchId });
});

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
  const eopDate = parseEopDate(state);
  if (!eopDate) {
    alert('Enter EOP date in the Date column as YYYY-MM (use the month picker).');
    return;
  }
  store.getState().ensureYearVisible(eopDate);
  store.getState().setEopDate(eopDate);
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

$('modalOk').addEventListener('click', () => { if (modalCb) modalCb(); closeModal(); });
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
