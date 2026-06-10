@/Users/kushagramehta/.codex/RTK.md

# Project Tracker Agent Notes

Use this file as the first local orientation point before editing. Always read `README.md` alongside it before code or behavior changes, because `AGENTS.md` captures agent workflow notes while `README.md` captures the product and architecture reference. When a change affects both agent guidance and user/project documentation, update both files in the same pass.

## Project Shape

- This is a no-build single-page app for automotive project timeline planning.
- Runtime files are only `index.html`, `style.css`, and `app.js`.
- The app targets Microsoft Power Pages / Power Apps style deployment, so keep the app vanilla HTML/CSS/JS and avoid introducing bundlers, packages, module imports, or npm-only workflows.
- PDF export depends on CDN scripts in `index.html`: `html2canvas` and `jsPDF`.
- Tests live in `tests/persistence.test.js` and are Node built-in tests.

## Current Important Branch Context

- The active feature branch used for the SVG stage-logo work is `codex-svg-stage-logos`.
- There may be existing uncommitted changes in `README.md`, `app.js`, `docs/database/dataverse-schema.md`, `index.html`, `style.css`, and `tests/persistence.test.js`.
- Do not revert user or previous-agent changes. Work with the dirty tree unless the user explicitly asks for cleanup or reset.

## Command Rules

- Prefix shell commands with `rtk`, per the included RTK instructions.
- Common verification commands:
  - `rtk node --test tests/mainpage.test.js`
  - `rtk node --test tests/persistence.test.js`
  - `rtk node --check mainpage.js`
  - `rtk node --check demo-data/multi-project-cutoff-demo.js`
  - `rtk node --check app.js`
  - `rtk git diff --check`
- To run locally for browser checks:
  - `rtk python3 -m http.server 8000`
  - open `http://127.0.0.1:8000/index.html`
- Stop any local HTTP server you start before finishing unless the user asks to keep it running.

## File Map

- `app.js`: complete browser application logic.
- `style.css`: all layout, theme, timeline, node, modal, table, and export styles.
- `index.html`: static shell and fixed DOM anchors used by `app.js`.
- `mainpage.html`, `mainpage.css`, `mainpage.js`: read-only portfolio timeline grid with its own separate runtime files; do not make it depend on `index.html`, `style.css`, or `app.js`.
- `demo-data/multi-project-cutoff-demo.js`: local development seeder for multiple portfolio projects that share the same cutoff dates and have different timeline months/content.
- `tests/persistence.test.js`: extracts a slice of `app.js` into a VM and tests pure/domain/persistence behavior plus source-level UI expectations.
- `tests/mainpage.test.js`: evaluates `mainpage.js` in a VM and tests project normalization, localStorage discovery, portfolio model building, and cutoff snapshot resolution.
- `README.md`: product and architecture reference.
- `docs/database/dataverse-schema.md`: Dataverse table/schema notes.

## Main Page Portfolio Timeline

- `mainpage.html` includes only a compact `Timeline Version` toolbar plus the read-only sidebar/timeline grid; the old marketing/header summary UI is intentionally absent.
- `mainpage.css` mirrors the planner grid tokens (`--row-h: 90px`, `--col-w: 52px`) and SVG stage-logo rendering styles but stays separate from `style.css`.
- `mainpage.js` reads all local projects by scanning `project-tracker:draft:*`, `baseline:*`, `submit-versions:*`, and `discussion-cutoffs:*` keys.
- The top cutoff dropdown shows `Current` plus the shared cutoff dates from localStorage. Selecting a cutoff resolves every project independently to the latest submit version with `submittedAt` on or before cutoff end-of-day; projects without a matching submit version are hidden for that view.
- `Current` renders each project's draft. Historical cutoff views render submit-version `state` objects and do not mutate drafts.
- When no local projects exist and `window.ProjectTrackerMultiDemo` is available, `mainpage.js` auto-seeds the multi-project demo with `{ reload: false }` so the page shows data immediately.
- Demo projects are removable with `ProjectTrackerMultiDemo.remove()` and seedable manually with `seedProjectTrackerMultiDemo()` from the browser console.
- Keep the existing `loadProjectsFromLocalStorage()` and `buildPortfolioModel()` behavior compatible with tests; use richer record helpers (`loadProjectRecordsFromLocalStorage`, `resolveProjectsForCutoff`) for cutoff-aware mainpage behavior.

## app.js Sections

`app.js` is organized by section banners:

- `§1 CONSTANTS + CORE UTILITIES`
  - Grid constants: `COL = 52`, `ROH = 90`, `YH = 34`, `MH = 30`.
  - Stage logo registry and helpers are here: `STAGE_ICONS`, `normalizeStageIconId`, `getStageVisualMarkup`, `makeStageIconSvg`.
  - Important: `tests/persistence.test.js` slices `app.js` starting at `function cloneState`; any helper that tests need must remain after `function cloneState` or the test harness must be updated.
- `§2 STORE`
  - Minimal Zustand-style store.
  - State mutations should go through store actions.
- `§3 DOMAIN`
  - Pure functions: date/column math, lanes, stage positioning, branch/merge validation, copy-to-actual, EOP parsing.
  - `getStageVisualX()` controls final x positions for stages and keeps connectors/labels aligned.
- `§4 PERSISTENCE`
  - localStorage draft/baseline handling and Dataverse payload/delta creation.
  - `mapStages()` serializes the selected stage visual in `shape`.
- `§5 RENDERERS`
  - DOM creation for headers, grid, lines, nodes, labels, tables, remarks, PDF export root.
  - `drawLines()` creates normal horizontal timeline segments with `.tl-line`.
  - `mkNode()` and `mkShiftedNode()` render stage logos using `getStageVisualMarkup()`.
- `§6 EVENTS`
  - Header bindings, cell click popup, context menus, drag/drop, merge flow, copy-to-actual, submit/export.
- `§7 BOOTSTRAP`
  - Initializes persistence, binds events, sets up stage logo pickers, renders, and syncs scroll/resize.

## Stage Logos

- Stage visuals are configured in `STAGE_ICONS` in `app.js`.
- Add a new stage logo by appending:

```js
{
  id: 'stage-logo-12',
  label: 'Stage Logo 12',
  svg: `<svg ...>...</svg>`,
}
```

- Keep ids stable; saved stages store the selected id in the existing `type` field.
- Existing saved `type: "square"` and `type: "circle"` are legacy fallbacks and must keep rendering.
- Unknown logo ids intentionally fall back to the first configured SVG logo.
- `makeStageIconSvg()` rewrites SVG ids/paint URLs per instance to avoid duplicate gradient/mask ids in the DOM. Preserve this if changing icon rendering.
- Header default logo picker:
  - hidden select: `#nodeTypeSelect`
  - visual picker: `#nodeTypeSelectPicker`
- Add-stage popup logo picker:
  - hidden select: `#npShape`
  - visual picker: `#npShapePicker`
- The picker setup is in `setupStageIconPicker()`.

## Timeline Lines and SVG Node Mask

- Normal timeline lines are absolutely positioned `.tl-line` divs made by `mkLine()`.
- Lines are behind nodes (`.tl-line` z-index 3, `.node` z-index 5).
- SVG icons are transparent by nature, so lines can show through the icon interior unless CSS masks them.
- Current simple CSS approach:
  - `.stage-icon-node` stays transparent and visible.
  - `.stage-icon-node::before` adds an inner `var(--bg)` mask behind the SVG.
  - `.stage-icon-node svg` has `position: relative; z-index: 1`.
- Prefer CSS masking for minor line/SVG overlap fixes.
- Use JS endpoint math only if the user explicitly wants exact line endpoints per icon shape; that is more invasive and must account for different SVG silhouettes.

## Stage Placement and Labels

- Plan contexts are `plan` and `branch`; actual contexts are `actual` and `actualBranch`.
- Plan bottom labels are constrained to `Beg`, `Mid`, `End` by `PLAN_BOTTOM_LABELS` and `normalizePlanBottomLabel()`.
- `getStageSlotRatio()` maps plan bottom labels to month-cell positions:
  - `Beg` -> 0.25
  - `Mid` or empty/legacy -> 0.5
  - `End` -> 0.75
- Duplicate stages in the same row/month/slot are nudged by `getStageVisualX()`; connectors use this same visual x.
- Dragging a stage updates both its `col` and stored `date`, so edit dialogs show the moved month/year.
- Remarks render as one draggable numbered summary box using `remarkPosition`.
- DRS details from stages and preponed/postponed shifts render as one draggable numbered summary box using `labelPositions['drs:summary']`.
- Actual stages require a full `YYYY-MM-DD` date and cannot be in the future.
- Plan stages use optional `YYYY-MM`; if cleared, they stay in the clicked month.

## Branches, Merges, and Shifts

- Plan branches and actual branches are separate.
- Branch stages cannot be placed before their branch source month.
- Only the last stage in a branch can merge.
- Merge links can target a stage or a month anchor.
- Preponed/postponed shifts:
  - Source stage stays in place with red cross.
  - Shifted copy renders at target month.
  - Shift arrows are SVG paths using `SHIFT_ARROW_ARCH`.
  - Shift markers require shift-specific DRS detail, which appears in the cumulative DRS Details box.

## Persistence and Dataverse

- `captureState()` normalizes store state for local persistence.
- Local draft/baseline keys are derived from `projectId`.
- Submit-version history is stored separately from the editable draft and baseline. Runtime globals:
  - `submitVersions`
  - `discussionCutoffDates`
  - `snapshotView`
- Draft saves are debounced by `scheduleDraftSave()` at 80ms.
- `createDataversePayload()` builds grouped entities for project, variants, branches, stages, merge links, and actual merge links.
- `createDataverseDelta()` compares grouped payloads via stable stringification.
- Successful Submit creates an immutable version record `{ id, submittedAt, discussionDate, state, payload }`.
- `Timeline Version` dropdown resolves backend cutoff dates by selecting the latest submit version with `submittedAt` on or before the cutoff end-of-day.
- Historical snapshot views render from `snapshotView.state` and must remain read-only; do not replace the editable store state when selecting a snapshot.
- Dataverse bridge hooks:
  - `loadProject({ projectId })`
  - `saveProject({ projectId, delta, payload, submitVersion })`
  - optional `getSubmitVersion({ projectId, versionId })`
- Without `window.ProjectTrackerDataverse.saveProject`, submit writes Dataverse-shaped data and submit-version history to localStorage for development.

## UI and CSS Guidance

- Keep UI controls compact and operational; this is a planner/tool, not a marketing page.
- Do not add cards inside cards or decorative gradients/orbs.
- The timeline relies on fixed dimensions:
  - `--row-h: 90px`
  - `--col-w: 52px`
  - node footprint: `28px`
- Avoid changing grid/node dimensions unless the user explicitly asks; many drag, connector, and PDF calculations assume the current scale.
- For SVG stage icons, keep visual fixes localized around `.stage-icon-node` when possible.
- Text in nodes is intentionally small and positioned absolutely above/below the 28px node footprint.

## Test Notes

- `tests/persistence.test.js` does not import `app.js` as a module.
- It reads `app.js`, slices from `function cloneState` to `async function saveDraftToDataverse`, and evaluates that slice in a VM.
- If a pure helper is needed in tests, ensure it exists inside that slice and is exported by the test harness.
- Many tests use source regex checks to protect UI behavior. When renaming functions/classes, update tests intentionally.
- Add focused tests when changing:
  - stage date validation
  - stage logo id normalization/serialization
  - branch placement/merge rules
  - copy-to-actual behavior
  - PDF export behavior
  - stage shift behavior

## Browser Verification

For visual changes, use the in-app browser or a local static server and check:

- Page loads without console errors.
- `mainpage.html` auto-seeds demo data when localStorage is empty, shows multiple projects, and the Timeline Version dropdown switches all projects between `Current` and shared cutoff dates.
- Timeline Version dropdown shows `Current` and available backend/local cutoff dates.
- Selecting a historical cutoff renders the saved snapshot without overwriting the current draft.
- Snapshot mode disables editing controls, stage drag/drop, add/delete, Copy to Actual, Publish Status, and Submit.
- Header stage logo picker shows all configured logos.
- Add-stage popup inherits the header-selected logo.
- Created stages render the selected SVG.
- Normal timeline lines do not visibly cut through SVG interiors.
- Dragging and clicking stages still work.
- Dragged stage edit dialogs show the moved month/date.
- Remarks and DRS Details render as single numbered summary boxes.
- Actual/plan labels and dates still align.

## Editing Discipline

- Keep changes narrowly scoped.
- Prefer existing helpers over new abstractions.
- Use `apply_patch` for manual edits.
- Do not use destructive Git commands unless explicitly requested.
- When changing runtime behavior, run tests before claiming completion.
