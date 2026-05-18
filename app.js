// ─── STATE ───────────────────────────────────────────────────────────────────
const S = {
  info: { project: 'Swift Facelift 2024', location: 'SMG', plant: 'Plant-C', type: 'MC', status: 'Delayed', published: false },
  variants: [],      // [{id,name}]
  planNodes: [],     // [{id,variantId,col,type,topLabel,bottomLabel,date}]
  actualNodes: [],   // same shape
  branches: [],      // [{id,variantId,parentNodeId,label}]
  branchNodes: [],   // [{id,branchId,col,type,topLabel,bottomLabel,date}]
  actualBranchNodes: [],
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
const getSidebarH = () => getTopOffset() + getPlannedH() + getActualH();
const getGridGroupH = () => getTopOffset() + getPlannedH() + 4 + getActualH();
const getPB = vid => S.branches.filter(b => b.variantId === vid);

// DOM refs
const yearHeader = $('yearHeader'), monthHeader = $('monthHeader'), tlGrid = $('tlGrid');
const sbRows = $('sbRows'), tlScroll = $('tlScroll');
const nodePopup = $('nodePopup'), ctxMenu = $('ctxMenu');
const modalOverlay = $('modalOverlay'), modalBody = $('modalBody'), modalTitle = $('modalTitle');
let pendCell = null, dragNode = null, dox = 0, doy = 0, ctxId = null, ctxRowType = null, modalCb = null, dragVL = null, dvox = 0, dvoy = 0;

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

// ─── RENDER ALL ──────────────────────────────────────────────────────────────
function renderAll() { renderHeaders(); renderSidebar(); renderGrid(); renderNodes(); renderBottomTables(); }

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

  // PLANNED SECTION: one sub-row per variant
  S.variants.forEach((vr, vi) => {
    const sr = makeSubRow(tc, vr.id, 'plan');
    if (vi === 0) {
      const pill = document.createElement('div');
      pill.className = 'plan-pill';
      pill.textContent = 'Planned';
      pill.style.top = (ROH / 2 - 7) + 'px';
      sr.appendChild(pill);
    }
    grp.appendChild(sr);
  });

  // BRANCH ROWS: one sub-row per branch, tagged
  S.branches.forEach(br => {
    const bsr = makeBranchSubRow(tc, br.id);
    const pill = document.createElement('div');
    pill.className = 'branch-div-pill';
    pill.textContent = '↳ ' + br.label;
    bsr.appendChild(pill);
    grp.appendChild(bsr);
  });

  // DIVIDER
  const dv = document.createElement('div');
  dv.className = 'pa-grid-div';
  dv.style.height = '4px';
  dv.style.background = 'var(--border2)';
  grp.appendChild(dv);

  // ACTUAL SECTION: one sub-row per variant
  S.variants.forEach((vr, vi) => {
    const sr = makeSubRow(tc, vr.id, 'actual');
    if (vi === 0) sr.classList.add('actual-first');
    if (vi === 0) {
      const pill = document.createElement('div');
      pill.className = 'actual-pill';
      pill.textContent = 'Actual';
      pill.style.top = (ROH / 2 - 7) + 'px';
      sr.appendChild(pill);
    }
    grp.appendChild(sr);
  });

  tlGrid.appendChild(grp);
  drawLines();
  renderVariantLabels();
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

function makeBranchSubRow(tc, branchId) {
  const sr = document.createElement('div');
  sr.className = 'grid-sub-row branch-sub';
  sr.style.height = ROH + 'px'; sr.style.position = 'relative';
  for (let col = 0; col < tc; col++) {
    const c = document.createElement('div');
    c.className = 'g-cell';
    c.dataset.col = col; c.dataset.branchId = branchId; c.dataset.rType = 'branch';
    c.addEventListener('click', onCellClick);
    sr.appendChild(c);
  }
  return sr;
}

// ─── LINES ───────────────────────────────────────────────────────────────────
function drawLines() {
  document.querySelectorAll('.tl-line').forEach(e => e.remove());
  const grp = tlGrid.querySelector('.grid-vr-grp');
  if (!grp || !S.variants.length) return;

  // PLANNED LINES: one line per variant across its plan nodes
  S.variants.forEach((vr, vi) => {
    const pn = S.planNodes.filter(n => n.variantId === vr.id).sort((a, b) => a.col - b.col);
    const y = vi * ROH + ROH / 2;
    for (let i = 0; i < pn.length - 1; i++)
      mkLine(grp, pn[i].col * COL + COL / 2, y, pn[i + 1].col * COL + COL / 2, y, '#2563eb');
  });

  // BRANCH LINES + FORK LINES
  S.branches.forEach((br, bi) => {
    const bY = (S.variants.length + bi) * ROH + ROH / 2;
    const parent = S.planNodes.find(n => n.id === br.parentNodeId);
    if (parent) {
      const parentVrIdx = S.variants.findIndex(v => v.id === parent.variantId);
      const fromY = parentVrIdx * ROH + ROH / 2;
      mkLineV(grp, parent.col * COL + COL / 2, fromY, bY, '#00c9b1');
    }
    const bn = S.branchNodes.filter(n => n.branchId === br.id).sort((a, b) => a.col - b.col);
    for (let i = 0; i < bn.length - 1; i++)
      mkLine(grp, bn[i].col * COL + COL / 2, bY, bn[i + 1].col * COL + COL / 2, bY, '#00c9b1');
  });

  // ACTUAL LINES: one line per variant across its actual nodes
  S.variants.forEach((vr, vi) => {
    const an = S.actualNodes.filter(n => n.variantId === vr.id).sort((a, b) => a.col - b.col);
    const y = (S.variants.length + S.branches.length + vi) * ROH + ROH / 2;
    for (let i = 0; i < an.length - 1; i++)
      mkLine(grp, an[i].col * COL + COL / 2, y, an[i + 1].col * COL + COL / 2, y, '#f97316');
  });
}

function mkLine(parent, x1, y1, x2, y2, color) {
  const d = document.createElement('div');
  d.className = 'tl-line';
  d.style.cssText = `position:absolute;background:${color};opacity:.8;z-index:3;pointer-events:none;left:${Math.min(x1, x2)}px;top:${y1 - 1}px;width:${Math.abs(x2 - x1)}px;height:2px`;
  parent.appendChild(d);
}
function mkLineV(parent, x, y1, y2, color) {
  const d = document.createElement('div');
  d.className = 'tl-line';
  d.style.cssText = `position:absolute;background:${color};opacity:.8;z-index:3;pointer-events:none;left:${x - 1}px;top:${Math.min(y1, y2)}px;width:2px;height:${Math.abs(y2 - y1)}px`;
  parent.appendChild(d);
}

// ─── NODES ───────────────────────────────────────────────────────────────────
function renderNodes() {
  document.querySelectorAll('.node').forEach(e => e.remove());
  const grp = tlGrid.querySelector('.grid-vr-grp');
  if (!grp) return;

  // PLAN NODES: variant i → row i in Planned section
  S.planNodes.forEach(n => {
    const vrIdx = S.variants.findIndex(v => v.id === n.variantId);
    const y = vrIdx * ROH + ROH / 2;
    const el = mkNode(n, 'plan');
    el.style.cssText = `left:${n.col * COL + COL / 2 - 14}px;top:${y - 14}px`;
    grp.appendChild(el);
  });

  // BRANCH NODES: branch bi → row (variants.length + bi) in Planned section
  S.branchNodes.forEach(n => {
    const brIdx = S.branches.findIndex(b => b.id === n.branchId);
    const y = (S.variants.length + brIdx) * ROH + ROH / 2;
    const el = mkNode(n, 'branch');
    el.style.cssText = `left:${n.col * COL + COL / 2 - 14}px;top:${y - 14}px`;
    grp.appendChild(el);
  });

  // ACTUAL NODES: variant i → row (variants.length + branches.length + i) in Actual section
  S.actualNodes.forEach(n => {
    const vrIdx = S.variants.findIndex(v => v.id === n.variantId);
    const y = (S.variants.length + S.branches.length + vrIdx) * ROH + ROH / 2;
    const el = mkNode(n, 'actual');
    el.style.cssText = `left:${n.col * COL + COL / 2 - 14}px;top:${y - 14}px`;
    grp.appendChild(el);
  });
}

function mkNode(n, rType) {
  const el = document.createElement('div');
  const cls = rType === 'plan' ? 'plan-node' : rType === 'branch' ? 'branch-node' : 'actual-node';
  el.className = 'node ' + cls;
  el.dataset.nodeId = n.id; el.dataset.rType = rType;
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
    else S.actualNodes = S.actualNodes.filter(x => x.id !== n.id);
    renderGrid(); renderNodes();
  });
  el.addEventListener('mousedown', startNodeDrag);
  el.addEventListener('contextmenu', e => { e.preventDefault(); showCtx(e, n.id, rType); });
  return el;
}

// ─── CELL CLICK ──────────────────────────────────────────────────────────────
function onCellClick(e) {
  if (e.target.closest('.node')) return;
  const col = +this.dataset.col, vId = this.dataset.vId, rType = this.dataset.rType, branchId = this.dataset.branchId || null;
  pendCell = { col, vId, rType, branchId };
  const r = this.getBoundingClientRect();
  nodePopup.style.cssText = `left:${r.left}px;top:${r.bottom + 4}px`;
  nodePopup.classList.add('active');
  $('npTop').value = ''; $('npBottom').value = ''; $('npDate').value = '';
  $('npTop').focus();
}
$('npConfirm').addEventListener('click', () => {
  if (!pendCell) return;
  const { col, vId, rType, branchId } = pendCell;
  const nd = {
    id: uid(), col, type: $('nodeTypeSelect').value,
    topLabel: $('npTop').value.trim(), bottomLabel: $('npBottom').value.trim(), date: $('npDate').value
  };
  if (rType === 'plan') { nd.variantId = vId; S.planNodes.push(nd); }
  else if (rType === 'branch') { nd.branchId = branchId; S.branchNodes.push(nd); }
  else { nd.variantId = vId; S.actualNodes.push(nd); }
  nodePopup.classList.remove('active'); pendCell = null;
  renderGrid(); renderNodes();
});
$('npCancel').addEventListener('click', () => { nodePopup.classList.remove('active'); pendCell = null; });

// ─── CONTEXT MENU ─────────────────────────────────────────────────────────────
function showCtx(e, nodeId, rType) {
  ctxId = nodeId; ctxRowType = rType;
  ctxMenu.style.cssText = `left:${e.clientX}px;top:${e.clientY}px`;
  ctxMenu.classList.add('active');
  $('ctxBranch').style.display = rType === 'plan' ? 'block' : 'none';
}
$('ctxBranch').addEventListener('click', () => {
  ctxMenu.classList.remove('active');
  const parent = S.planNodes.find(n => n.id === ctxId); if (!parent) return;
  openModal('New Branch', `<div class="form-group"><label>Branch Label</label><input id="f_bl" type="text" placeholder="e.g. Gas variant"/></div>`, () => {
    const label = $('f_bl').value.trim() || 'Branch';
    S.branches.push({ id: uid(), variantId: parent.variantId, parentNodeId: ctxId, label });
    renderAll();
  });
});
$('ctxDelete').addEventListener('click', () => {
  ctxMenu.classList.remove('active');
  if (!ctxId) return;
  if (ctxRowType === 'plan') S.planNodes = S.planNodes.filter(n => n.id !== ctxId);
  else if (ctxRowType === 'branch') S.branchNodes = S.branchNodes.filter(n => n.id !== ctxId);
  else S.actualNodes = S.actualNodes.filter(n => n.id !== ctxId);
  renderGrid(); renderNodes(); ctxId = null;
});
document.addEventListener('click', e => { if (!ctxMenu.contains(e.target)) ctxMenu.classList.remove('active'); });

// ─── VARIANTS ────────────────────────────────────────────────────────────────
$('addVariantBtn').addEventListener('click', () => {
  const name = $('variantInput').value.trim();
  if (!name) return;
  const idx = S.variants.length;
  S.variants.push({ id: uid(), name, x: 20, y: idx * ROH * 2 + 10 });
  $('variantInput').value = '';
  renderAll();
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
  renderAll();
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
    sp.addEventListener('blur', () => { tbl.cols[ci] = sp.textContent.trim(); });
    th.appendChild(sp);
    if (ci > 0) {
      const dx = document.createElement('button'); dx.className = 'col-del'; dx.textContent = '×';
      dx.addEventListener('click', () => { tbl.cols.splice(ci, 1); tbl.rows.forEach(r => r.splice(ci, 1)); renderBottomTables(); });
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
      td.addEventListener('input', () => { tbl.rows[ri][ci] = td.textContent.trim(); td.classList.toggle('filled', !!td.textContent.trim()); });
      tr.appendChild(td);
    });
    const tdx = document.createElement('td'); tdx.className = 'dyn-td row-del-cell';
    const rdx = document.createElement('button'); rdx.className = 'row-del'; rdx.textContent = '×';
    rdx.addEventListener('click', () => { tbl.rows.splice(ri, 1); renderBottomTables(); });
    tdx.appendChild(rdx); tr.appendChild(tdx);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody); wrap.appendChild(table);
}

$('addMsRowBtn').addEventListener('click', () => { S.leftTable.rows.push(Array(S.leftTable.cols.length).fill('')); renderBottomTables(); });
$('addMsColBtn').addEventListener('click', () => { S.leftTable.cols.push('New Col'); S.leftTable.rows.forEach(r => r.push('')); renderBottomTables(); });
$('addEopRowBtn').addEventListener('click', () => { S.rightTable.rows.push(Array(S.rightTable.cols.length).fill('')); renderBottomTables(); });
$('addEopColBtn').addEventListener('click', () => { S.rightTable.cols.push('New Col'); S.rightTable.rows.forEach(r => r.push('')); renderBottomTables(); });
$('remarksBox').addEventListener('input', () => { S.remarks = $('remarksBox').textContent.trim(); });

// ─── VARIANT FLOATING LABELS ────────────────────────────────────────────────
function renderVariantLabels() {
  tlGrid.querySelectorAll('.vr-float-label').forEach(e => e.remove());
  S.variants.forEach((vr, vi) => {
    const el = document.createElement('div');
    el.className = 'vr-float-label';
    el.dataset.vrId = vr.id;
    const defaultY = vi * ROH + ROH / 2 - 7;
    const lx = vr._lx !== undefined ? vr._lx : 50;
    const ly = vr._ly !== undefined ? vr._ly : defaultY;
    el.style.cssText = `left:${lx}px;top:${ly}px`;
    el.innerHTML = `${vr.name}<button class="vfl-del" onclick="event.stopPropagation();deleteVariant('${vr.id}')">×</button>`;
    el.addEventListener('mousedown', startVLabelDrag);
    tlGrid.appendChild(el);
  });
}
function startVLabelDrag(e) {
  if (e.target.classList.contains('vfl-del')) return;
  e.preventDefault();
  dragVL = e.currentTarget;
  const r = dragVL.getBoundingClientRect(), gr = tlGrid.getBoundingClientRect();
  dvox = e.clientX - r.left; dvoy = e.clientY - r.top;
  const vr = S.variants.find(v => v.id === dragVL.dataset.vrId);
  if (vr && vr._lx !== undefined) {
    dragVL.style.left = vr._lx + 'px';
    dragVL.style.top = vr._ly + 'px';
  }
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
  const vr = S.variants.find(v => v.id === dragVL.dataset.vrId);
  if (vr) {
    if (vr._lx === undefined) vr._lx = 50;
    if (vr._ly === undefined) vr._ly = 0;
    vr._lx = e.clientX - gr.left - dvox;
    vr._ly = e.clientY - gr.top - dvoy;
  }
  dragVL.style.zIndex = '6'; dragVL = null;
  document.removeEventListener('mousemove', onVLMove);
  document.removeEventListener('mouseup', onVLUp);
}

// ─── HEADER FORM ─────────────────────────────────────────────────────────────
function bindHeader() {
  $('fProject').value = S.info.project;
  $('fLocation').value = S.info.location;
  $('fPlant').value = S.info.plant;
  $('fProjType').value = S.info.type;
  $('fStatus').value = S.info.status;
  syncPubBtn();
  const map = { fProject: 'project', fLocation: 'location', fPlant: 'plant', fProjType: 'type', fStatus: 'status' };
  Object.entries(map).forEach(([id, key]) => {
    $(id).addEventListener('input', () => {
      S.info[key] = $(id).value;
      if (key === 'location' || key === 'plant') renderSidebar();
    });
  });
  $('publishToggle').addEventListener('click', () => { S.info.published = !S.info.published; syncPubBtn(); });
}
function syncPubBtn() {
  const btn = $('publishToggle');
  btn.textContent = S.info.published ? '✓ Published' : 'Not Publish';
  btn.classList.toggle('published', S.info.published);
}

// ─── DRAG NODES ──────────────────────────────────────────────────────────────
function startNodeDrag(e) {
  if (e.target.classList.contains('node-del')) return;
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
  const arr = rType === 'plan' ? S.planNodes : rType === 'branch' ? S.branchNodes : S.actualNodes;
  const node = arr.find(n => n.id === nid);
  if (node) node.col = Math.max(0, Math.min(Math.round((e.clientX - gr.left - dox + 14) / COL), totalCols() - 1));
  dragNode.style.opacity = '1'; dragNode.style.zIndex = '5';
  dragNode = null;
  document.removeEventListener('mousemove', onNodeMove);
  document.removeEventListener('mouseup', onNodeUp);
  renderGrid(); renderNodes();
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
  if (e.key === 'Escape') { nodePopup.classList.remove('active'); ctxMenu.classList.remove('active'); }
});

// ─── THEME ───────────────────────────────────────────────────────────────────
$('themeToggleBtn').addEventListener('click', () => {
  const isDark = document.body.dataset.theme === 'dark';
  document.body.dataset.theme = isDark ? 'light' : 'dark';
  $('themeToggleBtn').textContent = isDark ? '🌙' : '☀️';
});

// ─── SUBMIT / BACK ───────────────────────────────────────────────────────────
$('submitBtn').addEventListener('click', () => {
  console.log('State:', JSON.stringify(S, null, 2));
  alert('Submitted! Check console for full state.');
});
$('backBtn').addEventListener('click', () => { if (confirm('Go back? Unsaved changes will be lost.')) history.back(); });

// ─── PDF EXPORT ──────────────────────────────────────────────────────────────
$('exportBtn').addEventListener('click', () => exportPDF('a3'));
$('pdfA3Btn').addEventListener('click', () => exportPDF('a3'));
$('pdfA1Btn').addEventListener('click', () => exportPDF('a1'));
async function exportPDF(fmt) {
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
    const dims = fmt === 'a1' ? [841, 594] : [420, 297];
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: dims });
    const pW = pdf.internal.pageSize.getWidth(), pH = pdf.internal.pageSize.getHeight(), mg = 8;
    const maxW = pW - mg * 2, maxH = pH - mg * 2;
    const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
    const iW = canvas.width * ratio, iH = canvas.height * ratio;
    pdf.addImage(canvas.toDataURL('image/jpeg', .95), 'JPEG', mg + (maxW - iW) / 2, mg + (maxH - iH) / 2, iW, iH);
    pdf.save(`${S.info.project || 'timeline'}_${fmt.toUpperCase()}.pdf`);
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
loadSample();
bindHeader();
renderAll();
syncScroll();
setupResize();
