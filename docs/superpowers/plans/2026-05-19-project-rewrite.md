# Project-Tracker Full Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite the monolithic `app.js` into a single-file, section-based architecture using a Zustand-style reactive store — no build step, no extra files, Power Pages compatible.

**Architecture:** Seven clearly delimited sections in one `app.js`: Constants → Store → Domain → Persistence → Renderers → Events → Bootstrap. State mutations happen only through store actions; renderers receive state as a parameter; events call actions.

**Tech Stack:** Vanilla ES5/ES6 browser JS, no dependencies, localStorage persistence, optional Dataverse bridge.

---

## File changes

| File | Action | Purpose |
|---|---|---|
| `app.js` | Full rewrite | Single file with §1-§7 sections |
| `index.html` | Modify | Remove `persistence-core.js` script; add DRS checkbox + textarea to node popup |
| `persistence-core.js` | Delete | Merged into `app.js` §4 |
| `README.md` | Create | Project doc with Mermaid data-flow diagram |

## Section map (new app.js)

```
§1 CONSTANTS + CORE UTILS  — COL, ROH, $, fmtDate, cloneState, stableStringify
§2 STORE                   — createStore factory + appStore (state + all actions)
§3 DOMAIN                  — pure functions: lanes, grid math, parseEopDate
§4 PERSISTENCE             — localStorage draft/baseline, Dataverse payload/delta
§5 RENDERERS               — renderAll → renderHeaders/Sidebar/Grid/Nodes/Tables/Labels/Arrows/Export
§6 EVENTS                  — bindHeader, bindNodeEvents, bindTableEvents, etc.
§7 BOOTSTRAP               — store.subscribe(render+save), initPersistence, bindAll, renderAll
```

## Key rules enforced by the architecture

1. **Actions only mutate state** — `set(partial)` in store actions, nowhere else
2. **Renderers are pure DOM writers** — receive `state`, write DOM, do not call `set()`
3. **Events are the only callers of store actions**
4. **Transient UI state stays as module variables** — `mergePick`, `dragNode`, `pendCell`, drag offsets

## New features

- **EOP date input**: In `renderDynTable`, detect columns whose header matches `/date|month/i` → render `<input type="month">` instead of contenteditable `<td>`. Value stored in `rightTable.rows[ri][ci]` as YYYY-MM.
- **DRS in Add Stage popup**: Node schema gains `isDRS: false, drsDetail: ''`. Popup gains checkbox `#npIsDRS` + textarea `#npDrsDetail` (shown/hidden on checkbox toggle). Confirm handler includes both fields.

---

## Task 1: Rewrite app.js

**Files:** Rewrite `app.js`

- [ ] Write §1 CONSTANTS + CORE UTILS: COL, ROH, YH, MH, $, fmtDate, NODE_SHAPES, STORAGE_PREFIX, ACTIVE_PROJECT_KEY, cloneState(), stableStringify()
- [ ] Write §2 STORE: createStore factory (set merges partial, notifies listeners); INITIAL_DATA object; appStore with all state fields + all actions (addVariant, deleteVariant, addPlanNode, removePlanNode, movePlanNode, addActualNode, removeActualNode, moveActualNode, addBranchNode, removeBranchNode, moveBranchNode, addActualBranchNode, removeActualBranchNode, moveActualBranchNode, addBranch, removeBranch, addMergeLink, removeMergeLinksForNode, removeMergeLinksForBranch, addYear, ensureYearVisible, setEopDate, setRemarks, setRemarkPosition, setLabelPosition, setInfo, setProjectId, setPublished, updateLeftTableCell, updateRightTableCell, updateLeftTableColName, updateRightTableColName, addLeftTableRow, addRightTableRow, addLeftTableCol, addRightTableCol, deleteLeftTableRow, deleteRightTableRow, deleteLeftTableCol, deleteRightTableCol, replaceState)
- [ ] Write §3 DOMAIN: getPlanLanes(state), getActualLanes(state), getBranchesForVariant(state, vId), findPlanLaneIndex(state, type, id), findActualLaneIndex(state, type, id), totalCols(state), hasEopLane(state), getTopOffset(state), getPlannedH(state), getActualH(state), getDividerH(state), getGridGroupH(state), getSidebarH(state), dateToCol(date, state), parseEopDate(state)
- [ ] Write §4 PERSISTENCE: getStorageKeys(projectId), readLocalJson(key), writeLocalJson(key, val), removeLocalItem(key), getOrCreateActiveProjectId(), normalizeStateForPersistence(state), isDirty(draft, baseline), createDataversePayload(state), createDataverseDelta(draft, baseline), mapStages(nodes, context, extra), initPersistenceState(), captureState(), getBaselineState(), persistDraftNow(), scheduleDraftSave(), updateDraftStatus(msg), syncHeaderInputsFromState(), revertDraftToBaseline(), adoptProjectId(nextId, snapshot), saveDraftToDataverse(draft, baseline)
- [ ] Write §5 RENDERERS: renderAll(state), renderHeaders(state), renderSidebar(state), renderGrid(state), renderEopLane(grp, state), makeSubRow(tc, vId, rType), makeBranchSubRow(tc, branchId, rType, label), drawLines(grp, state), mkLine(parent, x1,y1,x2,y2,color), drawRelationshipArrows(grp, state), makeRelationshipSvg(state), addArrowPath(svg, from, to, cls, markerId), getFirstBranchNode(branchId, state), getPlanNodeCenter(node, state), getBranchNodeCenter(node, state), renderNodes(grp, state), mkNode(n, rType), renderBottomTables(state), renderDynTable(wrapId, tbl, updateCell, updateColName, deleteCol, deleteRow), renderVariantLabels(state), addVariantLabel(key, vId, text, defaultX, defaultY, mode, state), renderCanvasRemarks(state), renderMergeHint(state), updateMergeTargetClasses(), exportPDF()
- [ ] Write §6 EVENTS: onCellClick(e), bindNodePopup(), bindContextMenu(), bindVariants(), bindHeader(), bindTableButtons(), bindScrollSync(), setupResize(), bindTheme(), bindClosePopups(), bindModal(), openModal(title, bodyHTML, onOk), closeModal()
- [ ] Write §7 BOOTSTRAP: wire store.subscribe → renderAll + scheduleDraftSave; initPersistenceState(); bindAll(); fillShapeSelect; syncScroll; setupResize; initial renderAll

## Task 2: Update index.html

**Files:** Modify `index.html`

- [ ] Remove `<script src="persistence-core.js"></script>`
- [ ] Add to `#nodePopup` after the `#npShape` select: `<label class="popup-label drs-label"><input type="checkbox" id="npIsDRS" /> Is DRS Available?</label><textarea id="npDrsDetail" class="drs-detail" placeholder="DRS Details…" rows="3" style="display:none"></textarea>`

## Task 3: Create README.md

**Files:** Create `README.md`

- [ ] Write README with: project description, architecture overview, Mermaid data-flow diagram (store → renderers → DOM → events → store), new features (DRS, EOP date input), Power Pages deployment note
