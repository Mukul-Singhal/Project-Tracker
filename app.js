// ─── STATE ───────────────────────────────────────────────────────────────────
const S = {
  projectId: '',
  info: { project: 'Swift Facelift 2024', location: 'SMG', plant: 'Plant-C', type: 'MC', status: 'Delayed', published: false },
  variants: [],      // [{id,name}]
  planNodes: [],     // [{id,variantId,col,type,topLabel,bottomLabel,date}]
  actualNodes: [],   // same shape
  branches: [],      // [{id,variantId,parentNodeId,label}]
  branchNodes: [],   // [{id,branchId,col,type,topLabel,bottomLabel,date}]
  actualBranchNodes: [],
  mergeLinks: [],    // [{id,fromNodeId,fromBranchId,toNodeId}]
  leftTable: { cols: ['Milestone', 'DOM Gas', 'DOM CNG'], rows: [['DA', '', ''], ['SOS', '', '']] },
  rightTable: { cols: ['Model Detail', 'Date- month/year'], rows: [['', '']] },
  remarks: '',
  years: [2024, 2025],
  eopDate: '',
  labelPositions: {},
  remarkPosition: null,
  nid: 1
};

const NODE_SHAPES = [
  { value: 'square', label: 'Square' },
  { value: 'circle', label: 'Circle' },
];

const COL = 52, ROH = 90, YH = 34, MH = 30;
const $ = id => document.getElementById(id);
const P = window.ProjectTrackerPersistence;
const uid = () => 'i' + (S.nid++);
const fmtDate = d => { if (!d) return ''; const [y, m] = d.split('-'); return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m - 1] + ' ' + y };
const totalCols = () => S.years.length * 12;
const isDisc = col => false;

// ─── LANE HELPERS ────────────────────────────────────────────────────────────
const hasEopLane = () => !!S.eopDate;
const getTopOffset = () => hasEopLane() ? ROH : 0;

function dateToCol(date) {
  if (!date) return -1;
  const match = String(date).trim().match(/^(\d{4})-(\d{1,2})$/);
  if (!match) return -1;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const yearIndex = S.years.indexOf(year);
  if (yearIndex < 0 || month < 1 || month > 12) return -1;
  return yearIndex * 12 + month - 1;
}

function ensureYearVisible(date) {
  const match = String(date || '').trim().match(/^(\d{4})-(\d{1,2})$/);
  if (!match) return;
  const targetYear = Number(match[1]);
  while (S.years[S.years.length - 1] < targetYear) S.years.push(S.years[S.years.length - 1] + 1);
}

function getBranchesForVariant(variantId) {
  return S.branches.filter(b => b.variantId === variantId);
}

function getPlanLanes() {
  return S.variants.flatMap(v => [
    { type: 'plan', variantId: v.id, label: v.name },
    ...getBranchesForVariant(v.id).map(b => ({ type: 'branch', branchId: b.id, variantId: v.id, label: b.label }))
  ]);
}

function getActualLanes() {
  return S.variants.flatMap(v => [
    { type: 'actual', variantId: v.id, label: v.name },
    ...getBranchesForVariant(v.id).map(b => ({ type: 'actualBranch', branchId: b.id, variantId: v.id, label: b.label }))
  ]);
}

function findPlanLaneIndex(type, id) {
  return getPlanLanes().findIndex(l => type === 'plan' ? l.variantId === id && l.type === 'plan' : l.branchId === id && l.type === 'branch');
}

function findActualLaneIndex(type, id) {
  return getActualLanes().findIndex(l => type === 'actual' ? l.variantId === id && l.type === 'actual' : l.branchId === id && l.type === 'actualBranch');
}

const getPlannedH = () => getPlanLanes().length * ROH;
const getActualH = () => getActualLanes().length * ROH;
const getDividerH = () => S.variants.length ? 4 : 0;
const getSidebarH = () => getTopOffset() + getPlannedH() + getDividerH() + getActualH();
const getGridGroupH = () => getTopOffset() + getPlannedH() + 4 + getActualH();
const getPB = vid => S.branches.filter(b => b.variantId === vid);

// DOM refs
const yearHeader = $('yearHeader'), monthHeader = $('monthHeader'), tlGrid = $('tlGrid');
const sbRows = $('sbRows'), tlScroll = $('tlScroll');
const nodePopup = $('nodePopup'), ctxMenu = $('ctxMenu');
const modalOverlay = $('modalOverlay'), modalBody = $('modalBody'), modalTitle = $('modalTitle');
let pendCell = null, dragNode = null, dox = 0, doy = 0, ctxId = null, ctxRowType = null, modalCb = null, dragVL = null, dvox = 0, dvoy = 0, dragRemark = null, drox = 0, droy = 0, mergePick = null;
const STATE_DEFAULTS = P.cloneState(S);
let persistenceReady = false, suppressDraftSave = false, draftSaveTimer = null;

// ─── SAMPLE DATA ─────────────────────────────────────────────────────────────
function loadSample() {
  S.variants = [{ id: 'v1', name: 'DOM Gas' }, { id: 'v2', name: 'DOM CNG' }];
  S.nid = 50;
  S.planNodes = [
    { id: 'p1', variantId: 'v1', col: 5, type: 'square', topLabel: 'DA', bottomLabel: '', date: '2024-06' },
    { id: 'p2', variantId: 'v1', col: 9, type: 'square', topLabel: 'SOS', bottomLabel: '', date: '2024-10' },
    { id: 'p3', variantId: 'v2', col: 6, type: 'square', topLabel: 'DA', bottomLabel: '', date: '2024-07' },
  ];
  S.actualNodes = [
    { id: 'a1', variantId: 'v1', col: 6, type: 'square', topLabel: '', bottomLabel: '', date: '2024-07' },
  ];
}

// ─── LOCAL DRAFT + DATAVERSE PERSISTENCE ────────────────────────────────────
function initPersistenceState() {
  const projectId = getOrCreateActiveProjectId();
  const keys = P.getStorageKeys(projectId);
  const draft = readLocalJson(keys.draft);
  const baseline = readLocalJson(keys.baseline);

  if (draft) {
    replaceState({ ...draft, projectId });
  } else if (baseline) {
    replaceState({ ...baseline, projectId });
    writeLocalJson(keys.draft, captureState());
  } else {
    loadSample();
    S.projectId = projectId;
    const initial = captureState();
    writeLocalJson(keys.draft, initial);
    writeLocalJson(keys.baseline, initial);
  }

  if (!readLocalJson(keys.baseline)) writeLocalJson(keys.baseline, captureState());
  persistenceReady = true;
}

function getOrCreateActiveProjectId() {
  try {
    const existing = localStorage.getItem(P.ACTIVE_PROJECT_KEY);
    if (existing) return existing;
    const next = `local-${Date.now()}`;
    localStorage.setItem(P.ACTIVE_PROJECT_KEY, next);
    return next;
  } catch (err) {
    console.warn('Draft storage unavailable:', err);
    return `local-${Date.now()}`;
  }
}

function getCurrentStorageKeys() {
  if (!S.projectId) S.projectId = getOrCreateActiveProjectId();
  return P.getStorageKeys(S.projectId);
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

function captureState() {
  return P.normalizeStateForPersistence(S);
}

function replaceState(nextState) {
  const merged = {
    ...P.cloneState(STATE_DEFAULTS),
    ...P.cloneState(nextState),
    info: { ...STATE_DEFAULTS.info, ...(nextState.info || {}) },
    leftTable: nextState.leftTable || P.cloneState(STATE_DEFAULTS.leftTable),
    rightTable: nextState.rightTable || P.cloneState(STATE_DEFAULTS.rightTable),
    variants: nextState.variants || [],
    planNodes: nextState.planNodes || [],
    actualNodes: nextState.actualNodes || [],
    branches: nextState.branches || [],
    branchNodes: nextState.branchNodes || [],
    actualBranchNodes: nextState.actualBranchNodes || [],
    mergeLinks: nextState.mergeLinks || [],
    years: nextState.years || P.cloneState(STATE_DEFAULTS.years),
    labelPositions: nextState.labelPositions || {}
  };
  Object.keys(S).forEach(key => delete S[key]);
  Object.assign(S, merged);
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

function getBaselineState() {
  return readLocalJson(getCurrentStorageKeys().baseline) || captureState();
}

function updateDraftStatus(message) {
  const status = $('draftStatus');
  if (!status) return;
  const draft = readLocalJson(getCurrentStorageKeys().draft) || captureState();
  const baseline = getBaselineState();
  const dirty = P.isDirty(draft, baseline);
  status.hidden = !dirty && !message;
  $('draftStatusText').textContent = message || (dirty ? 'Draft changes' : 'Saved');
}

function syncHeaderInputsFromState() {
  $('fProject').value = S.info.project || '';
  $('fLocation').value = S.info.location || '';
  $('fPlant').value = S.info.plant || '';
  $('fProjType').value = S.info.type || '';
  $('fStatus').value = S.info.status || 'On Track';
  $('remarksBox').textContent = S.remarks || '';
  syncPubBtn();
}

function revertDraftToBaseline() {
  const baseline = getBaselineState();
  suppressDraftSave = true;
  replaceState(baseline);
  removeLocalItem(getCurrentStorageKeys().draft);
  writeLocalJson(getCurrentStorageKeys().draft, captureState());
  syncHeaderInputsFromState();
  renderAll();
  suppressDraftSave = false;
  persistDraftNow();
  updateDraftStatus('Reverted');
  setTimeout(() => updateDraftStatus(), 1400);
}

function adoptProjectId(nextProjectId, snapshot) {
  if (!nextProjectId || nextProjectId === S.projectId) return snapshot;
  const oldKeys = getCurrentStorageKeys();
  const nextSnapshot = { ...snapshot, projectId: nextProjectId };
  S.projectId = nextProjectId;
  try {
    localStorage.setItem(P.ACTIVE_PROJECT_KEY, nextProjectId);
  } catch (err) {
    console.warn('Could not update active project id:', err);
  }
  removeLocalItem(oldKeys.draft);
  removeLocalItem(oldKeys.baseline);
  return nextSnapshot;
}

async function saveDraftToDataverse(draft, baseline) {
  const delta = P.createDataverseDelta(draft, baseline);
  const bridge = window.ProjectTrackerDataverse;

  if (bridge && typeof bridge.saveProject === 'function') {
    return bridge.saveProject({ projectId: draft.projectId, delta, payload: delta.current });
  }

  writeLocalJson(`${P.STORAGE_PREFIX}:dataverse-payload:${draft.projectId}`, {
    projectId: draft.projectId,
    savedAt: new Date().toISOString(),
    delta
  });
  console.warn('ProjectTrackerDataverse.saveProject is not configured; saved Dataverse payload locally for development.');
  return { projectId: draft.projectId, developmentOnly: true };
}

// ─── RENDER ALL ──────────────────────────────────────────────────────────────
function renderAll() {
  renderHeaders();
  renderSidebar();
  renderGrid();
  renderNodes();
  renderBottomTables();
  scheduleDraftSave();
}

// ─── YEAR/MONTH HEADERS ──────────────────────────────────────────────────────
function renderHeaders() {
  yearHeader.innerHTML = ''; monthHeader.innerHTML = '';
  const tc = totalCols();
  yearHeader.style.width = monthHeader.style.width = (tc * COL) + 'px';
  S.years.forEach((yr, yi) => {
    const yb = document.createElement('div');
    yb.className = 'yr-block'; yb.style.width = (COL * 12) + 'px'; yb.textContent = yr;
    yearHeader.appendChild(yb);
    for (let m = 1; m <= 12; m++) {
      const mc = document.createElement('div');
      mc.className = 'mo-cell'; mc.style.width = COL + 'px'; mc.textContent = m;
      monthHeader.appendChild(mc);
    }
  });
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function renderSidebar() {
  sbRows.innerHTML = '';
  const totalH = getSidebarH();
  if (!S.variants.length) {
    sbRows.innerHTML = '<div class="empty-sb">No variants yet.<br>Add one in the header.</div>';
    return;
  }
  const row = document.createElement('div');
  row.className = 'sidebar-row';
  row.style.height = totalH + 'px';

  row.innerHTML = `
    <div class="sr-cell sno" style="height:${totalH}px">1</div>
    <div class="sr-cell proj" style="height:${totalH}px">
      <span class="vr-name">${S.info.project || '—'}</span>
    </div>
    <div class="sr-cell loc" style="height:${totalH}px">${S.info.location || '—'}</div>
    <div class="sr-cell plant" style="height:${totalH}px">${S.info.plant || '—'}</div>
    <div class="sr-cell pa" style="height:${totalH}px;flex-direction:column;padding:0">
      ${hasEopLane() ? `<div class="pa-eop-spacer" style="height:${getTopOffset()}px"></div>` : ''}
      <div class="pa-plan" style="height:${getPlannedH()}px">plan</div>
      <div class="pa-divider" style="height:${getDividerH()}px"></div>
      <div class="pa-actual" style="height:${getActualH()}px">Actual</div>
    </div>`;
  sbRows.appendChild(row);
}

// ─── GRID ─────────────────────────────────────────────────────────────────────
function renderGrid() {
  tlGrid.innerHTML = '';
  const tc = totalCols();
  tlGrid.style.width = (tc * COL) + 'px';
  if (!S.variants.length) {
    const h = document.createElement('div');
    h.className = 'empty-hint';
    h.innerHTML = '<div class="emo">🕐</div><div>Add a variant to get started</div>';
    tlGrid.appendChild(h);
    return;
  }

  const grp = document.createElement('div');
  grp.className = 'grid-vr-grp';
  grp.style.position = 'relative';
  grp.style.height = getGridGroupH() + 'px';
  grp.dataset.vId = S.variants[0] ? S.variants[0].id : '';

  renderEopLane(grp, tc);

  getPlanLanes().forEach(lane => {
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

  getActualLanes().forEach((lane, index) => {
    const sr = lane.type === 'actualBranch'
      ? makeBranchSubRow(tc, lane.branchId, 'actualBranch', lane.label)
      : makeSubRow(tc, lane.variantId, 'actual');
    if (index === 0) sr.classList.add('actual-first');
    grp.appendChild(sr);
  });

  tlGrid.appendChild(grp);
  drawLines();
  renderVariantLabels();
  renderCanvasRemarks();
  renderMergeHint();
  scheduleDraftSave();
}

function renderEopLane(grp, tc) {
  if (!hasEopLane()) return;
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
  const col = dateToCol(S.eopDate);
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
  sr.style.height = ROH + 'px'; sr.style.position = 'relative';
  for (let col = 0; col < tc; col++) {
    const c = document.createElement('div');
    c.className = 'g-cell';
    c.dataset.col = col; c.dataset.vId = vId; c.dataset.rType = rType;
    c.addEventListener('click', onCellClick);
    sr.appendChild(c);
  }
  return sr;
}

function makeBranchSubRow(tc, branchId, rType = 'branch', label = '') {
  const sr = document.createElement('div');
  sr.className = 'grid-sub-row branch-sub' + (rType === 'actualBranch' ? ' actual-branch-sub' : '');
  sr.style.height = ROH + 'px'; sr.style.position = 'relative';
  for (let col = 0; col < tc; col++) {
    const c = document.createElement('div');
    c.className = 'g-cell';
    c.dataset.col = col; c.dataset.branchId = branchId; c.dataset.rType = rType;
    c.addEventListener('click', onCellClick);
    sr.appendChild(c);
  }
  const pill = document.createElement('div');
  pill.className = 'branch-div-pill' + (rType === 'actualBranch' ? ' actual-branch-pill' : '');
  pill.textContent = '↳ ' + (label || 'Branch');
  sr.appendChild(pill);
  return sr;
}

// ─── LINES ───────────────────────────────────────────────────────────────────
function drawLines() {
  document.querySelectorAll('.tl-line,.tl-relationship-svg').forEach(e => e.remove());
  const grp = tlGrid.querySelector('.grid-vr-grp');
  if (!grp || !S.variants.length) return;

  // PLANNED LINES
  S.variants.forEach(vr => {
    const laneIdx = findPlanLaneIndex('plan', vr.id);
    if (laneIdx < 0) return;
    const pn = S.planNodes.filter(n => n.variantId === vr.id).sort((a, b) => a.col - b.col);
    const y = getTopOffset() + laneIdx * ROH + ROH / 2;
    for (let i = 0; i < pn.length - 1; i++)
      mkLine(grp, pn[i].col * COL + COL / 2, y, pn[i + 1].col * COL + COL / 2, y, '#2563eb');
  });

  // BRANCH LINES
  S.branches.forEach(br => {
    const branchLaneIdx = findPlanLaneIndex('branch', br.id);
    if (branchLaneIdx < 0) return;
    const bY = getTopOffset() + branchLaneIdx * ROH + ROH / 2;
    const bn = S.branchNodes.filter(n => n.branchId === br.id).sort((a, b) => a.col - b.col);
    for (let i = 0; i < bn.length - 1; i++)
      mkLine(grp, bn[i].col * COL + COL / 2, bY, bn[i + 1].col * COL + COL / 2, bY, '#00c9b1');
  });

  // ACTUAL LINES
  S.variants.forEach(vr => {
    const laneIdx = findActualLaneIndex('actual', vr.id);
    if (laneIdx < 0) return;
    const an = S.actualNodes.filter(n => n.variantId === vr.id).sort((a, b) => a.col - b.col);
    const y = getTopOffset() + getPlannedH() + 4 + laneIdx * ROH + ROH / 2;
    for (let i = 0; i < an.length - 1; i++)
      mkLine(grp, an[i].col * COL + COL / 2, y, an[i + 1].col * COL + COL / 2, y, '#f97316');
  });

  // ACTUAL BRANCH LINES
  S.branches.forEach(br => {
    const laneIdx = findActualLaneIndex('branch', br.id);
    if (laneIdx < 0) return;
    const y = getTopOffset() + getPlannedH() + 4 + laneIdx * ROH + ROH / 2;
    const nodes = S.actualBranchNodes.filter(n => n.branchId === br.id).sort((a, b) => a.col - b.col);
    for (let i = 0; i < nodes.length - 1; i++)
      mkLine(grp, nodes[i].col * COL + COL / 2, y, nodes[i + 1].col * COL + COL / 2, y, '#f97316');
  });

  drawRelationshipArrows(grp);
}

function mkLine(parent, x1, y1, x2, y2, color) {
  const d = document.createElement('div');
  d.className = 'tl-line';
  d.style.cssText = `position:absolute;background:${color};opacity:.8;z-index:3;pointer-events:none;left:${Math.min(x1, x2)}px;top:${y1 - 1}px;width:${Math.abs(x2 - x1)}px;height:2px`;
  parent.appendChild(d);
}
function drawRelationshipArrows(grp) {
  const svg = makeRelationshipSvg();
  let hasArrows = false;

  S.branches.forEach(br => {
    const parent = S.planNodes.find(n => n.id === br.parentNodeId);
    const firstChild = getFirstBranchNode(br.id);
    if (!parent || !firstChild) return;
    const from = getPlanNodeCenter(parent);
    const to = getBranchNodeCenter(firstChild);
    if (!from || !to) return;
    addArrowPath(svg, from, to, 'branch-start-arrow', 'branchStartArrow');
    hasArrows = true;
  });

  S.mergeLinks.forEach(link => {
    const fromNode = S.branchNodes.find(n => n.id === link.fromNodeId && n.branchId === link.fromBranchId);
    const toNode = S.planNodes.find(n => n.id === link.toNodeId);
    if (!fromNode || !toNode) return;
    const from = getBranchNodeCenter(fromNode);
    const to = getPlanNodeCenter(toNode);
    if (!from || !to) return;
    addArrowPath(svg, from, to, 'merge-link-arrow', 'mergeLinkArrow');
    hasArrows = true;
  });

  if (hasArrows) grp.appendChild(svg);
}

function makeRelationshipSvg() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('tl-relationship-svg');
  svg.setAttribute('width', totalCols() * COL);
  svg.setAttribute('height', getGridGroupH());
  svg.setAttribute('viewBox', `0 0 ${totalCols() * COL} ${getGridGroupH()}`);
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

function getFirstBranchNode(branchId) {
  return S.branchNodes
    .filter(n => n.branchId === branchId)
    .sort((a, b) => a.col - b.col || String(a.id).localeCompare(String(b.id)))[0] || null;
}

function getPlanNodeCenter(node) {
  const laneIdx = findPlanLaneIndex('plan', node.variantId);
  if (laneIdx < 0) return null;
  return { x: node.col * COL + COL / 2, y: getTopOffset() + laneIdx * ROH + ROH / 2 };
}

function getBranchNodeCenter(node) {
  const laneIdx = findPlanLaneIndex('branch', node.branchId);
  if (laneIdx < 0) return null;
  return { x: node.col * COL + COL / 2, y: getTopOffset() + laneIdx * ROH + ROH / 2 };
}

// ─── NODES ───────────────────────────────────────────────────────────────────
function renderNodes() {
  document.querySelectorAll('.node').forEach(e => e.remove());
  const grp = tlGrid.querySelector('.grid-vr-grp');
  if (!grp) return;

  // PLAN NODES
  S.planNodes.forEach(n => {
    const laneIdx = findPlanLaneIndex('plan', n.variantId);
    if (laneIdx < 0) return;
    const y = getTopOffset() + laneIdx * ROH + ROH / 2;
    const el = mkNode(n, 'plan');
    el.style.cssText = `left:${n.col * COL + COL / 2 - 14}px;top:${y - 14}px`;
    grp.appendChild(el);
  });

  // BRANCH NODES
  S.branchNodes.forEach(n => {
    const laneIdx = findPlanLaneIndex('branch', n.branchId);
    if (laneIdx < 0) return;
    const y = getTopOffset() + laneIdx * ROH + ROH / 2;
    const el = mkNode(n, 'branch');
    el.style.cssText = `left:${n.col * COL + COL / 2 - 14}px;top:${y - 14}px`;
    grp.appendChild(el);
  });

  // ACTUAL NODES
  S.actualNodes.forEach(n => {
    const laneIdx = findActualLaneIndex('actual', n.variantId);
    if (laneIdx < 0) return;
    const y = getTopOffset() + getPlannedH() + 4 + laneIdx * ROH + ROH / 2;
    const el = mkNode(n, 'actual');
    el.style.cssText = `left:${n.col * COL + COL / 2 - 14}px;top:${y - 14}px`;
    grp.appendChild(el);
  });

  // ACTUAL BRANCH NODES
  S.actualBranchNodes.forEach(n => {
    const laneIdx = findActualLaneIndex('branch', n.branchId);
    if (laneIdx < 0) return;
    const y = getTopOffset() + getPlannedH() + 4 + laneIdx * ROH + ROH / 2;
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
  el.dataset.nodeId = n.id; el.dataset.rType = rType;
  if (n.variantId) el.dataset.variantId = n.variantId;
  if (n.branchId) el.dataset.branchId = n.branchId;
  const dh = n.date ? `<span class="node-date">${fmtDate(n.date)}</span>` : '';
  el.innerHTML = `
    <span class="node-label-top">${n.topLabel || ''}</span>
    <div class="node-shape ${n.type}"></div>
    <span class="node-label-bottom">${n.bottomLabel || ''}</span>
    ${dh}<button class="node-del">✕</button>`;
  el.querySelector('.node-del').addEventListener('click', e => {
    e.stopPropagation();
    if (rType === 'plan') S.planNodes = S.planNodes.filter(x => x.id !== n.id);
    else if (rType === 'branch') S.branchNodes = S.branchNodes.filter(x => x.id !== n.id);
    else if (rType === 'actualBranch') S.actualBranchNodes = S.actualBranchNodes.filter(x => x.id !== n.id);
    else S.actualNodes = S.actualNodes.filter(x => x.id !== n.id);
    removeMergeLinksForNode(n.id);
    renderGrid(); renderNodes(); persistDraftNow();
  });
  el.addEventListener('click', e => handleMergeTargetClick(e, n, rType));
  el.addEventListener('mousedown', startNodeDrag);
  el.addEventListener('contextmenu', e => { e.preventDefault(); showCtx(e, n.id, rType); });
  return el;
}

// ─── CELL CLICK ──────────────────────────────────────────────────────────────
function onCellClick(e) {
  if (e.target.closest('.node')) return;
  if (mergePick) {
    clearMergePick();
    return;
  }
  const col = +this.dataset.col, vId = this.dataset.vId, rType = this.dataset.rType, branchId = this.dataset.branchId || null;
  pendCell = { col, vId, rType, branchId };
  const r = this.getBoundingClientRect();
  nodePopup.style.cssText = `left:${r.left}px;top:${r.bottom + 4}px`;
  nodePopup.classList.add('active');
  $('npTop').value = ''; $('npBottom').value = ''; $('npDate').value = '';
  $('npShape').value = $('nodeTypeSelect').value;
  $('npTop').focus();
}
$('npConfirm').addEventListener('click', () => {
  if (!pendCell) return;
  const { col, vId, rType, branchId } = pendCell;
  const nd = {
    id: uid(), col, type: $('npShape').value,
    topLabel: $('npTop').value.trim(), bottomLabel: $('npBottom').value.trim(), date: $('npDate').value
  };
  if (rType === 'plan') { nd.variantId = vId; S.planNodes.push(nd); }
  else if (rType === 'branch') { nd.branchId = branchId; S.branchNodes.push(nd); }
  else if (rType === 'actualBranch') { nd.branchId = branchId; S.actualBranchNodes.push(nd); }
  else { nd.variantId = vId; S.actualNodes.push(nd); }
  nodePopup.classList.remove('active'); pendCell = null;
  renderGrid(); renderNodes(); persistDraftNow();
});
$('npCancel').addEventListener('click', () => { nodePopup.classList.remove('active'); pendCell = null; });

// ─── CONTEXT MENU ─────────────────────────────────────────────────────────────
function showCtx(e, nodeId, rType) {
  ctxId = nodeId; ctxRowType = rType;
  ctxMenu.style.cssText = `left:${e.clientX}px;top:${e.clientY}px`;
  ctxMenu.classList.add('active');
  $('ctxBranch').style.display = rType === 'plan' ? 'block' : 'none';
  $('ctxMerge').style.display = rType === 'branch' ? 'block' : 'none';
}
$('ctxBranch').addEventListener('click', () => {
  ctxMenu.classList.remove('active');
  const parent = S.planNodes.find(n => n.id === ctxId); if (!parent) return;
  openModal('New Branch', `<div class="form-group"><label>Branch Label</label><input id="f_bl" type="text" placeholder="e.g. Gas variant"/></div>`, () => {
    const label = $('f_bl').value.trim() || 'Branch';
    const branch = { id: uid(), variantId: parent.variantId, parentNodeId: ctxId, label };
    const insertAt = S.branches.reduce((idx, b, i) => b.variantId === parent.variantId ? i + 1 : idx, S.branches.length);
    S.branches.splice(insertAt, 0, branch);
    renderAll(); persistDraftNow();
  });
});
$('ctxMerge').addEventListener('click', e => {
  e.stopPropagation();
  ctxMenu.classList.remove('active');
  const fromNode = S.branchNodes.find(n => n.id === ctxId);
  if (!fromNode) return;
  setMergePick({ fromNodeId: fromNode.id, fromBranchId: fromNode.branchId });
});
$('ctxDelete').addEventListener('click', () => {
  ctxMenu.classList.remove('active');
  if (!ctxId) return;
  if (ctxRowType === 'plan') S.planNodes = S.planNodes.filter(n => n.id !== ctxId);
  else if (ctxRowType === 'branch') S.branchNodes = S.branchNodes.filter(n => n.id !== ctxId);
  else if (ctxRowType === 'actualBranch') S.actualBranchNodes = S.actualBranchNodes.filter(n => n.id !== ctxId);
  else S.actualNodes = S.actualNodes.filter(n => n.id !== ctxId);
  removeMergeLinksForNode(ctxId);
  renderGrid(); renderNodes(); persistDraftNow(); ctxId = null;
});
document.addEventListener('click', e => {
  if (!ctxMenu.contains(e.target)) ctxMenu.classList.remove('active');
  if (mergePick && !e.target.closest('.node') && !e.target.closest('#ctxMenu')) clearMergePick();
});

function setMergePick(nextPick) {
  mergePick = nextPick;
  document.body.classList.add('merge-select-mode');
  updateMergeTargetClasses();
  renderMergeHint();
}

function clearMergePick() {
  mergePick = null;
  document.body.classList.remove('merge-select-mode');
  updateMergeTargetClasses();
  renderMergeHint();
}

function handleMergeTargetClick(e, node, rType) {
  if (!mergePick) return false;
  e.preventDefault();
  e.stopPropagation();
  if (rType !== 'plan') return true;

  const branch = S.branches.find(b => b.id === mergePick.fromBranchId);
  if (!branch || branch.variantId !== node.variantId) return true;

  S.mergeLinks = S.mergeLinks.filter(link => link.fromNodeId !== mergePick.fromNodeId);
  S.mergeLinks.push({
    id: uid(),
    fromNodeId: mergePick.fromNodeId,
    fromBranchId: mergePick.fromBranchId,
    toNodeId: node.id
  });
  clearMergePick();
  renderAll(); persistDraftNow();
  return true;
}

function renderMergeHint() {
  tlGrid.querySelectorAll('.merge-target-hint').forEach(e => e.remove());
  if (!mergePick) return;
  const grp = tlGrid.querySelector('.grid-vr-grp');
  if (!grp) return;
  const branch = S.branches.find(b => b.id === mergePick.fromBranchId);
  if (!branch) return;
  const laneIdx = findPlanLaneIndex('plan', branch.variantId);
  if (laneIdx < 0) return;
  const hint = document.createElement('div');
  hint.className = 'merge-target-hint';
  hint.style.top = (getTopOffset() + laneIdx * ROH + 8) + 'px';
  hint.textContent = 'Select parent stage to merge';
  grp.appendChild(hint);
}

function updateMergeTargetClasses() {
  document.querySelectorAll('.node.merge-valid-target,.node.merge-invalid-target').forEach(el => {
    el.classList.remove('merge-valid-target', 'merge-invalid-target');
  });
  if (!mergePick) return;
  const branch = S.branches.find(b => b.id === mergePick.fromBranchId);
  if (!branch) return;
  document.querySelectorAll('.plan-node').forEach(el => {
    el.classList.add(el.dataset.variantId === branch.variantId ? 'merge-valid-target' : 'merge-invalid-target');
  });
}

function removeMergeLinksForNode(nodeId) {
  S.mergeLinks = S.mergeLinks.filter(link => link.fromNodeId !== nodeId && link.toNodeId !== nodeId);
  if (mergePick && mergePick.fromNodeId === nodeId) clearMergePick();
}

function removeMergeLinksForBranch(branchId) {
  S.mergeLinks = S.mergeLinks.filter(link => link.fromBranchId !== branchId);
  if (mergePick && mergePick.fromBranchId === branchId) clearMergePick();
}

// ─── VARIANTS ────────────────────────────────────────────────────────────────
$('addVariantBtn').addEventListener('click', () => {
  const name = $('variantInput').value.trim();
  if (!name) return;
  const idx = S.variants.length;
  S.variants.push({ id: uid(), name, x: 20, y: idx * ROH * 2 + 10 });
  $('variantInput').value = '';
  renderAll(); persistDraftNow();
});
$('variantInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('addVariantBtn').click(); });
window.deleteVariant = id => {
  if (!confirm('Delete this variant and all its stages?')) return;
  S.variants = S.variants.filter(v => v.id !== id);
  S.planNodes = S.planNodes.filter(n => n.variantId !== id);
  S.actualNodes = S.actualNodes.filter(n => n.variantId !== id);
  const bids = S.branches.filter(b => b.variantId === id).map(b => b.id);
  S.branches = S.branches.filter(b => b.variantId !== id);
  S.branchNodes = S.branchNodes.filter(n => !bids.includes(n.branchId));
  S.actualBranchNodes = S.actualBranchNodes.filter(n => !bids.includes(n.branchId));
  S.mergeLinks = S.mergeLinks.filter(link => !bids.includes(link.fromBranchId) && S.planNodes.some(n => n.id === link.toNodeId));
  if (mergePick && bids.includes(mergePick.fromBranchId)) clearMergePick();
  renderAll(); persistDraftNow();
};

// ─── BOTTOM TABLES ───────────────────────────────────────────────────────────
function renderBottomTables() {
  renderDynTable('msTableWrap', S.leftTable);
  renderDynTable('eopTableWrap', S.rightTable);
}

function renderDynTable(wrapId, tbl) {
  const wrap = $(wrapId); wrap.innerHTML = '';
  const table = document.createElement('table');
  table.className = 'dyn-table';
  // THEAD
  const thead = document.createElement('thead');
  const htr = document.createElement('tr');
  tbl.cols.forEach((col, ci) => {
    const th = document.createElement('th'); th.className = 'dyn-th';
    const sp = document.createElement('span');
    sp.contentEditable = 'true'; sp.className = 'th-name'; sp.textContent = col;
    sp.addEventListener('blur', () => { tbl.cols[ci] = sp.textContent.trim(); persistDraftNow(); });
    th.appendChild(sp);
    if (ci > 0) {
      const dx = document.createElement('button'); dx.className = 'col-del'; dx.textContent = '×';
      dx.addEventListener('click', () => { tbl.cols.splice(ci, 1); tbl.rows.forEach(r => r.splice(ci, 1)); renderBottomTables(); persistDraftNow(); });
      th.appendChild(dx);
    }
    htr.appendChild(th);
  });
  thead.appendChild(htr); table.appendChild(thead);
  // TBODY
  const tbody = document.createElement('tbody');
  tbl.rows.forEach((row, ri) => {
    const tr = document.createElement('tr');
    row.forEach((cell, ci) => {
      const td = document.createElement('td');
      td.className = 'dyn-td' + (cell ? ' filled' : '');
      td.contentEditable = 'true'; td.textContent = cell;
      td.addEventListener('input', () => { tbl.rows[ri][ci] = td.textContent.trim(); td.classList.toggle('filled', !!td.textContent.trim()); scheduleDraftSave(); });
      tr.appendChild(td);
    });
    const tdx = document.createElement('td'); tdx.className = 'dyn-td row-del-cell';
    const rdx = document.createElement('button'); rdx.className = 'row-del'; rdx.textContent = '×';
    rdx.addEventListener('click', () => { tbl.rows.splice(ri, 1); renderBottomTables(); persistDraftNow(); });
    tdx.appendChild(rdx); tr.appendChild(tdx);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody); wrap.appendChild(table);
}

$('addMsRowBtn').addEventListener('click', () => { S.leftTable.rows.push(Array(S.leftTable.cols.length).fill('')); renderBottomTables(); persistDraftNow(); });
$('addMsColBtn').addEventListener('click', () => { S.leftTable.cols.push('New Col'); S.leftTable.rows.forEach(r => r.push('')); renderBottomTables(); persistDraftNow(); });
$('addEopRowBtn').addEventListener('click', () => { S.rightTable.rows.push(Array(S.rightTable.cols.length).fill('')); renderBottomTables(); persistDraftNow(); });
$('addEopColBtn').addEventListener('click', () => { S.rightTable.cols.push('New Col'); S.rightTable.rows.forEach(r => r.push('')); renderBottomTables(); persistDraftNow(); });
$('remarksBox').addEventListener('input', () => {
  S.remarks = $('remarksBox').textContent.trim();
  renderCanvasRemarks();
  scheduleDraftSave();
});

// ─── VARIANT FLOATING LABELS ────────────────────────────────────────────────
function renderVariantLabels() {
  tlGrid.querySelectorAll('.vr-float-label').forEach(e => e.remove());
  getPlanLanes().forEach((lane, laneIdx) => {
    if (lane.type !== 'plan') return;
    addVariantLabel(`plan:${lane.variantId}`, lane.variantId, lane.label, 50, getTopOffset() + laneIdx * ROH + ROH / 2 - 7, 'plan');
  });
  getActualLanes().forEach((lane, laneIdx) => {
    if (lane.type !== 'actual') return;
    addVariantLabel(`actual:${lane.variantId}`, lane.variantId, lane.label, 50, getTopOffset() + getPlannedH() + 4 + laneIdx * ROH + ROH / 2 - 7, 'actual');
  });
}

function addVariantLabel(key, variantId, text, defaultX, defaultY, mode) {
  const el = document.createElement('div');
  el.className = 'vr-float-label ' + (mode === 'actual' ? 'actual-vr-label' : 'plan-vr-label');
  el.dataset.labelKey = key;
  el.dataset.vrId = variantId;
  const pos = S.labelPositions[key] || { x: defaultX, y: defaultY };
  el.style.cssText = `left:${pos.x}px;top:${pos.y}px`;
  el.innerHTML = `${text}<button class="vfl-del" onclick="event.stopPropagation();deleteVariant('${variantId}')">×</button>`;
  el.addEventListener('mousedown', startVLabelDrag);
  tlGrid.appendChild(el);
}

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
    S.labelPositions[key] = {
      x: e.clientX - gr.left - dvox,
      y: e.clientY - gr.top - dvoy
    };
  }
  dragVL.style.zIndex = '6'; dragVL = null;
  document.removeEventListener('mousemove', onVLMove);
  document.removeEventListener('mouseup', onVLUp);
  persistDraftNow();
}

// ─── CANVAS REMARKS ─────────────────────────────────────────────────────────
function renderCanvasRemarks() {
  tlGrid.querySelectorAll('.canvas-remark').forEach(e => e.remove());
  if (!S.remarks) return;
  const el = document.createElement('div');
  el.className = 'canvas-remark';
  const defaultY = getTopOffset() + getPlannedH() + 4 + ROH / 2 + 18;
  const pos = S.remarkPosition || { x: 120, y: defaultY };
  el.style.cssText = `left:${pos.x}px;top:${pos.y}px`;
  el.textContent = S.remarks;
  el.addEventListener('mousedown', startRemarkDrag);
  tlGrid.appendChild(el);
}

function startRemarkDrag(e) {
  e.preventDefault();
  dragRemark = e.currentTarget;
  const r = dragRemark.getBoundingClientRect();
  drox = e.clientX - r.left;
  droy = e.clientY - r.top;
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
  S.remarkPosition = {
    x: e.clientX - gr.left - drox,
    y: e.clientY - gr.top - droy
  };
  dragRemark.style.zIndex = '7';
  dragRemark = null;
  document.removeEventListener('mousemove', onRemarkMove);
  document.removeEventListener('mouseup', onRemarkUp);
  persistDraftNow();
}

// ─── HEADER FORM ─────────────────────────────────────────────────────────────
function bindHeader() {
  $('fProject').value = S.info.project;
  $('fLocation').value = S.info.location;
  $('fPlant').value = S.info.plant;
  $('fProjType').value = S.info.type;
  $('fStatus').value = S.info.status;
  $('remarksBox').textContent = S.remarks || '';
  syncPubBtn();
  const map = { fProject: 'project', fLocation: 'location', fPlant: 'plant', fProjType: 'type', fStatus: 'status' };
  Object.entries(map).forEach(([id, key]) => {
    $(id).addEventListener('input', () => {
      S.info[key] = $(id).value;
      if (key === 'project' || key === 'location' || key === 'plant') renderSidebar();
      scheduleDraftSave();
    });
  });
  $('publishToggle').addEventListener('click', () => { S.info.published = !S.info.published; syncPubBtn(); persistDraftNow(); });
  $('revertDraftBtn').addEventListener('click', revertDraftToBaseline);
}
function syncPubBtn() {
  const btn = $('publishToggle');
  btn.textContent = S.info.published ? '✓ Published' : 'Not Publish';
  btn.classList.toggle('published', S.info.published);
}

// ─── DRAG NODES ──────────────────────────────────────────────────────────────
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
  dragNode.style.left = (Math.max(0, e.clientX - gr.left - dox)) + 'px';
  dragNode.style.top = (Math.max(0, e.clientY - gr.top - doy)) + 'px';
}
function onNodeUp(e) {
  if (!dragNode) return;
  const grp = dragNode.closest('.grid-vr-grp');
  const gr = grp.getBoundingClientRect();
  const nid = dragNode.dataset.nodeId, rType = dragNode.dataset.rType;
  const arr = rType === 'plan'
    ? S.planNodes
    : rType === 'branch'
      ? S.branchNodes
      : rType === 'actualBranch'
        ? S.actualBranchNodes
        : S.actualNodes;
  const node = arr.find(n => n.id === nid);
  if (node) node.col = Math.max(0, Math.min(Math.floor((e.clientX - gr.left - dox + 14) / COL), totalCols() - 1));
  dragNode.style.opacity = '1'; dragNode.style.zIndex = '5';
  dragNode = null;
  document.removeEventListener('mousemove', onNodeMove);
  document.removeEventListener('mouseup', onNodeUp);
  renderGrid(); renderNodes(); persistDraftNow();
}

// ─── SCROLL SYNC ─────────────────────────────────────────────────────────────
function syncScroll() {
  tlScroll.addEventListener('scroll', () => { sbRows.scrollTop = tlScroll.scrollTop; });
  sbRows.addEventListener('scroll', () => { tlScroll.scrollTop = sbRows.scrollTop; });
}

// ─── SIDEBAR RESIZE ──────────────────────────────────────────────────────────
function setupResize() {
  const handle = $('sidebarResizeHandle'), sb = $('sidebar');
  let resizing = false;
  handle.addEventListener('mousedown', () => { resizing = true; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; });
  document.addEventListener('mousemove', e => { if (resizing) sb.style.width = Math.max(240, Math.min(560, e.clientX)) + 'px'; });
  document.addEventListener('mouseup', () => { if (resizing) { resizing = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; } });
}

// ─── CLOSE POPUPS ────────────────────────────────────────────────────────────
document.addEventListener('click', e => {
  if (!nodePopup.contains(e.target) && !e.target.closest('.g-cell')) { nodePopup.classList.remove('active'); pendCell = null; }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    nodePopup.classList.remove('active');
    ctxMenu.classList.remove('active');
    if (mergePick) clearMergePick();
  }
});

// ─── THEME ───────────────────────────────────────────────────────────────────
$('themeToggleBtn').addEventListener('click', () => {
  const isDark = document.body.dataset.theme === 'dark';
  document.body.dataset.theme = isDark ? 'light' : 'dark';
  $('themeToggleBtn').textContent = isDark ? '🌙' : '☀️';
});

// ─── ADD YEAR ────────────────────────────────────────────────────────────────
$('addYearBtn').addEventListener('click', () => {
  S.years.push(S.years[S.years.length - 1] + 1);
  renderAll(); persistDraftNow();
});

// ─── SUBMIT / BACK ───────────────────────────────────────────────────────────
function parseEopDate() {
  const row = S.rightTable.rows[0] || [];
  const raw = (row[1] || '').trim();
  if (/^\d{4}-\d{2}$/.test(raw)) return raw;

  const monthYear = raw.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})$/i);
  if (monthYear) {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const month = months.indexOf(monthYear[1].slice(0, 3).toLowerCase()) + 1;
    return `${monthYear[2]}-${String(month).padStart(2, '0')}`;
  }

  const slash = raw.match(/^(\d{1,2})\/(\d{4})$/);
  if (slash) return `${slash[2]}-${String(Number(slash[1])).padStart(2, '0')}`;

  return '';
}

$('submitBtn').addEventListener('click', async () => {
  const eopDate = parseEopDate();
  if (!eopDate) {
    alert('Enter EOP date in Date- month/year as YYYY-MM, Mon YYYY, or MM/YYYY.');
    return;
  }
  ensureYearVisible(eopDate);
  S.eopDate = eopDate;
  renderAll();
  persistDraftNow();

  const draft = captureState();
  const baseline = getBaselineState();
  if (!P.isDirty(draft, baseline)) {
    updateDraftStatus('Already saved');
    setTimeout(() => updateDraftStatus(), 1400);
    return;
  }

  const submitBtn = $('submitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';
  try {
    const result = await saveDraftToDataverse(draft, baseline);
    const submitted = adoptProjectId(result && result.projectId, draft);
    const keys = getCurrentStorageKeys();
    writeLocalJson(keys.baseline, submitted);
    writeLocalJson(keys.draft, submitted);
    replaceState(submitted);
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
$('backBtn').addEventListener('click', () => { if (confirm('Go back? Unsaved changes will be lost.')) history.back(); });

// ─── PDF EXPORT ──────────────────────────────────────────────────────────────
$('exportBtn').addEventListener('click', exportPDF);
$('pdfA4Btn').addEventListener('click', exportPDF);
async function exportPDF() {
  const overlay = $('pdfOverlay'), st = $('pdfStatus');
  overlay.classList.add('active'); st.textContent = 'Capturing…';
  const app = document.querySelector('.app');
  const prev = { h: app.style.height, of: app.style.overflow };
  app.style.height = 'auto'; app.style.overflow = 'visible';
  document.querySelectorAll('.node-del,.vr-del-btn,.col-del,.row-del').forEach(el => el.style.display = 'none');
  await new Promise(r => setTimeout(r, 160));
  try {
    st.textContent = 'Rendering…';
    const canvas = await html2canvas(app, {
      scale: 2, useCORS: true,
      backgroundColor: document.body.dataset.theme === 'dark' ? '#0d1117' : '#dbe8f5',
      scrollX: 0, scrollY: 0, width: app.scrollWidth, height: app.scrollHeight,
      windowWidth: app.scrollWidth, windowHeight: app.scrollHeight
    });
    st.textContent = 'Building PDF…';
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pW = pdf.internal.pageSize.getWidth(), pH = pdf.internal.pageSize.getHeight(), mg = 8;
    const maxW = pW - mg * 2, maxH = pH - mg * 2;
    const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
    const iW = canvas.width * ratio, iH = canvas.height * ratio;
    pdf.addImage(canvas.toDataURL('image/jpeg', .95), 'JPEG', mg + (maxW - iW) / 2, mg + (maxH - iH) / 2, iW, iH);
    pdf.save(`${S.info.project || 'timeline'}_A4.pdf`);
    st.textContent = 'Done!'; setTimeout(() => overlay.classList.remove('active'), 700);
  } catch (err) { st.textContent = 'Error: ' + err.message; setTimeout(() => overlay.classList.remove('active'), 2500); }
  finally {
    app.style.height = prev.h; app.style.overflow = prev.of;
    document.querySelectorAll('.node-del,.vr-del-btn,.col-del,.row-del').forEach(el => el.style.display = '');
  }
}

// ─── MODAL ───────────────────────────────────────────────────────────────────
function openModal(title, bodyHTML, onOk) {
  modalTitle.textContent = title; modalBody.innerHTML = bodyHTML; modalCb = onOk;
  modalOverlay.classList.add('active');
  setTimeout(() => { const f = modalBody.querySelector('input'); if (f) f.focus(); }, 80);
}
$('modalOk').addEventListener('click', () => { if (modalCb) modalCb(); closeModal(); });
$('modalCancel').addEventListener('click', closeModal);
$('modalClose').addEventListener('click', closeModal);
$('modalOverlay').addEventListener('click', e => { if (e.target === $('modalOverlay')) closeModal(); });
function closeModal() { modalOverlay.classList.remove('active'); modalCb = null; }

// ─── INIT ────────────────────────────────────────────────────────────────────
function fillShapeSelect(selectEl) {
  selectEl.innerHTML = NODE_SHAPES.map(shape => `<option value="${shape.value}">${shape.label}</option>`).join('');
}

initPersistenceState();
bindHeader();
fillShapeSelect($('nodeTypeSelect'));
fillShapeSelect($('npShape'));
renderAll();
updateDraftStatus();
syncScroll();
setupResize();
