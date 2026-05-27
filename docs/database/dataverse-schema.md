# Project Tracker Dataverse Schema

This schema is designed for Microsoft Dataverse / Power Apps, not raw SQL DDL. Use your own Dataverse publisher prefix if it is not `pt_`.

## Global Choices

Create these global choice columns first.

### `pt_projectstatus`

- On Track
- Delayed
- Completed
- At Risk

### `pt_stagecontext`

- Plan
- Actual
- Branch Plan
- Branch Actual

### `pt_stageshape`

- Square
- Circle

### `pt_branchcontext`

- Plan
- Actual

### `pt_mergecontext`

- Plan
- Actual

## Table: Project

Display name: `Project`

Schema/logical name: `pt_project`

Primary name column: `pt_name`

| Column display name | Logical name | Dataverse type | Required | Notes |
|---|---|---:|---:|---|
| Project Name | `pt_name` | Text | Yes | Main project/model name |
| External Project Id | `pt_externalid` | Text | Yes | Browser/local project id; make alternate key |
| Location | `pt_location` | Text | No | Example: SMG |
| Plant | `pt_plant` | Text | No | Example: Plant-C |
| Project Type | `pt_projecttype` | Text | No | Example: MC |
| Status | `pt_status` | Choice `pt_projectstatus` | No | Current status |
| Published | `pt_published` | Yes/No | No | Publish flag |
| Discussion Period Date | `pt_discussionperioddate` | Text | No | Discussion month in `YYYY-MM`; currently browser default, future backend input |
| EOP Date | `pt_eopdate` | Date only | No | Primary/first parsed EOP month/date |
| EOP Dates JSON | `pt_eopdatesjson` | Multiple lines of text | No | All parsed EOP markers from the EOP table |
| Stage Shifts JSON | `pt_stageshiftsjson` | Multiple lines of text | No | Preponed/postponed visual markers for stages, including shift-specific `drsDetail` for new markers |
| Years JSON | `pt_yearsjson` | Multiple lines of text | No | Example: `[2024,2025]` |
| Remarks | `pt_remarks` | Multiple lines of text | No | User remarks |
| Milestone Table JSON | `pt_milestonetablejson` | Multiple lines of text | No | Dynamic table data |
| EOP Table JSON | `pt_eoptablejson` | Multiple lines of text | No | Dynamic table data |
| Layout JSON | `pt_layoutjson` | Multiple lines of text | No | Label positions, remark position, nid |
| Last Submitted On | `pt_lastsubmittedon` | Date and time | No | Set on submit |

Alternate key:

- `pt_externalid`

Example `Project` rows:

| pt_name | pt_externalid | pt_location | pt_plant | pt_projecttype | pt_status | pt_published | pt_discussionperioddate | pt_eopdate | pt_yearsjson | pt_remarks | pt_milestonetablejson | pt_eoptablejson | pt_layoutjson | pt_lastsubmittedon |
|---|---|---|---|---|---|---:|---|---|---|---|---|---|---|---|
| Swift Facelift 2024 | local-1716100000000 | SMG | Plant-C | MC | Delayed | No | 2024-09 | 2025-03-01 | `[2024,2025]` | Review EOP risk monthly | `{"cols":["Milestone","DOM Gas","DOM CNG"],"rows":[["DA","2024-06","2024-07"],["SOS","2024-10","2024-11"]]}` | `{"cols":["Model Detail","Date- month/year"],"rows":[["EOP","Mar 2025"]]}` | `{"labelPositions":{"plan:v1":{"x":50,"y":38}},"remarkPosition":{"x":120,"y":292},"nid":50}` | 2026-05-19 10:30 |
| Compact SUV Refresh | local-1716200000000 | Pune | Plant-A | FMC | On Track | Yes | 2025-11 | 2026-08-01 | `[2025,2026]` | Published baseline | `{"cols":["Milestone","EV"],"rows":[["Kickoff","2025-04"]]}` | `{"cols":["Model Detail","Date- month/year"],"rows":[["EOP","Aug 2026"]]}` | `{"labelPositions":{},"remarkPosition":null,"nid":12}` | 2026-05-19 11:00 |

## Table: Project Variant

Display name: `Project Variant`

Schema/logical name: `pt_projectvariant`

Primary name column: `pt_name`

| Column display name | Logical name | Dataverse type | Required | Notes |
|---|---|---:|---:|---|
| Variant Name | `pt_name` | Text | Yes | Example: DOM Gas |
| External Variant Id | `pt_externalid` | Text | Yes | From browser state variant id |
| Project | `pt_projectid` | Lookup to `Project` | Yes | Parent project |
| Display Order | `pt_displayorder` | Whole number | No | Variant ordering |

Alternate key:

- Composite if available: `pt_projectid + pt_externalid`
- If not, use text key `pt_projectvariantkey` with value format `<projectExternalId>:<variantExternalId>`

Relationship:

- `Project` 1:N `Project Variant`
- Delete behavior: cascade/delete child variants when project is deleted.

Example `Project Variant` rows:

| pt_name | pt_externalid | pt_projectid | pt_displayorder | pt_projectvariantkey |
|---|---|---|---:|---|
| DOM Gas | v1 | Project: Swift Facelift 2024 | 0 | local-1716100000000:v1 |
| DOM CNG | v2 | Project: Swift Facelift 2024 | 1 | local-1716100000000:v2 |
| EV | v3 | Project: Compact SUV Refresh | 0 | local-1716200000000:v3 |

## Table: Timeline Branch

Display name: `Timeline Branch`

Schema/logical name: `pt_timelinebranch`

Primary name column: `pt_name`

| Column display name | Logical name | Dataverse type | Required | Notes |
|---|---|---:|---:|---|
| Branch Label | `pt_name` | Text | Yes | Branch name |
| External Branch Id | `pt_externalid` | Text | Yes | From browser state branch id |
| Branch Context | `pt_branchcontext` | Choice `pt_branchcontext` | Yes | Plan or Actual branch |
| Project | `pt_projectid` | Lookup to `Project` | Yes | Useful for querying |
| Variant | `pt_variantid` | Lookup to `Project Variant` | Yes | Parent variant |
| Parent Stage External Id | `pt_parentstageexternalid` | Text | No | Browser id of parent Plan/Actual stage when branch starts from a stage |
| Parent Stage | `pt_parentstageid` | Lookup to `Timeline Stage` | No | Can be linked after stages are created |
| Source Stage External Id | `pt_sourcestageexternalid` | Text | No | Same as parent stage for stage-created branches |
| Source Month Text | `pt_sourcemonthtext` | Text | No | Branch source month, example: `2024-06` |
| Source Column Index | `pt_sourcecolumnindex` | Whole number | No | Branch source grid column for month-created branches |
| Source Plan Branch External Id | `pt_sourceplanbranchexternalid` | Text | No | Populated when an Actual branch was copied from a Plan branch |
| Display Order | `pt_displayorder` | Whole number | No | Branch ordering |

Alternate key:

- Composite if available: `pt_projectid + pt_externalid`
- If not, use text key `pt_branchkey`.

Relationships:

- `Project Variant` 1:N `Timeline Branch`
- `Project` 1:N `Timeline Branch`
- `Timeline Stage` 1:N `Timeline Branch` through `pt_parentstageid`

Example `Timeline Branch` rows:

| pt_name | pt_externalid | pt_branchcontext | pt_projectid | pt_variantid | pt_parentstageexternalid | pt_parentstageid | pt_sourceplanbranchexternalid | pt_displayorder | pt_branchkey |
|---|---|---|---|---|---|---|---|---:|---|
| Gas variant branch | b1 | Plan | Project: Swift Facelift 2024 | Variant: DOM Gas | p1 | Stage: DA Plan |  | 0 | local-1716100000000:b1 |
| Actual recovery branch | ab1 | Actual | Project: Swift Facelift 2024 | Variant: DOM Gas | a1 | Stage: DA Actual | b1 | 0 | local-1716100000000:ab1 |

## Table: Timeline Stage

Display name: `Timeline Stage`

Schema/logical name: `pt_timelinestage`

Primary name column: `pt_name`

| Column display name | Logical name | Dataverse type | Required | Notes |
|---|---|---:|---:|---|
| Stage Name | `pt_name` | Text | No | Can be top label or generated name |
| External Stage Id | `pt_externalid` | Text | Yes | Node id from browser |
| Project | `pt_projectid` | Lookup to `Project` | Yes | Parent project |
| Variant | `pt_variantid` | Lookup to `Project Variant` | No | Required for Plan/Actual stages |
| Branch | `pt_branchid` | Lookup to `Timeline Branch` | No | Required for Branch Plan/Branch Actual |
| Stage Context | `pt_stagecontext` | Choice `pt_stagecontext` | Yes | Plan, Actual, Branch Plan, Branch Actual |
| Month | `pt_month` | Date only | No | Store Plan months as first day of month if needed; Actual stages may use the exact actual date |
| Month Text | `pt_monthtext` | Text | No | Plan example: `2024-06`; Actual stage payloads may contain `YYYY-MM-DD` |
| Column Index | `pt_columnindex` | Whole number | Yes | Timeline grid column |
| Shape | `pt_shape` | Choice `pt_stageshape` | No | Square/Circle |
| Top Label | `pt_toplabel` | Text | No | Example: DA |
| Bottom Label | `pt_bottomlabel` | Text | No | Plan stages use `Beg`, `Mid`, or `End`; Actual stages leave this blank |
| DRS Available | `pt_isdrs` | Yes/No | No | Whether DRS is available for this stage |
| DRS Detail | `pt_drsdetail` | Multiple lines of text | No | Optional DRS notes/details |
| Source Plan Stage External Id | `pt_sourceplanstageexternalid` | Text | No | Populated for Actual rows copied from Plan |
| Display Order | `pt_displayorder` | Whole number | No | Stable ordering |

Alternate key:

- Composite if available: `pt_projectid + pt_externalid`
- If not, use text key `pt_stagekey`.

Relationships:

- `Project` 1:N `Timeline Stage`
- `Project Variant` 1:N `Timeline Stage`
- `Timeline Branch` 1:N `Timeline Stage`

Validation handled by app logic:

- If `Stage Context` is Plan or Actual, `Variant` should be populated.
- If `Stage Context` is Branch Plan or Branch Actual, `Branch` should be populated.
- Stage payload fields `is_drs` and `drs_detail` should map to `pt_isdrs` and `pt_drsdetail`.

Example `Timeline Stage` rows:

| pt_name | pt_externalid | pt_projectid | pt_variantid | pt_branchid | pt_stagecontext | pt_month | pt_monthtext | pt_columnindex | pt_shape | pt_toplabel | pt_bottomlabel | pt_displayorder | pt_stagekey |
|---|---|---|---|---|---|---|---|---:|---|---|---|---:|---|
| DA Plan | p1 | Project: Swift Facelift 2024 | Variant: DOM Gas |  | Plan | 2024-06-01 | 2024-06 | 5 | Square | DA |  | 0 | local-1716100000000:p1 |
| SOS Plan | p2 | Project: Swift Facelift 2024 | Variant: DOM Gas |  | Plan | 2024-10-01 | 2024-10 | 9 | Square | SOS |  | 1 | local-1716100000000:p2 |
| DA Plan CNG | p3 | Project: Swift Facelift 2024 | Variant: DOM CNG |  | Plan | 2024-07-01 | 2024-07 | 6 | Square | DA |  | 2 | local-1716100000000:p3 |
| DA Actual | a1 | Project: Swift Facelift 2024 | Variant: DOM Gas |  | Actual | 2024-07-01 | 2024-07 | 6 | Square | DA | Actual | 0 | local-1716100000000:a1 |
| Trial Branch Stage | bp1 | Project: Swift Facelift 2024 |  | Branch: Gas variant branch | Branch Plan | 2024-08-01 | 2024-08 | 7 | Circle | Trial |  | 0 | local-1716100000000:bp1 |
| Trial Actual Branch Stage | abp1 | Project: Swift Facelift 2024 |  | Branch: Gas variant branch | Branch Actual | 2024-09-01 | 2024-09 | 8 | Circle | Trial | Actual | 0 | local-1716100000000:abp1 |

## Table: Branch Merge Link

Display name: `Branch Merge Link`

Schema/logical name: `pt_branchmergelink`

Primary name column: `pt_name`

| Column display name | Logical name | Dataverse type | Required | Notes |
|---|---|---:|---:|---|
| Merge Link Name | `pt_name` | Text | No | Generated label |
| External Merge Link Id | `pt_externalid` | Text | Yes | From browser state |
| Merge Context | `pt_mergecontext` | Choice `pt_mergecontext` | Yes | Plan or Actual merge |
| Project | `pt_projectid` | Lookup to `Project` | Yes | Parent project |
| Branch | `pt_branchid` | Lookup to `Timeline Branch` | Yes | Source branch |
| Source Branch Stage | `pt_sourcestageid` | Lookup to `Timeline Stage` | Yes | Branch node |
| Target Stage | `pt_targetstageid` | Lookup to `Timeline Stage` | No | Plan or Actual main-row node when a stage exists in the selected merge month |
| Source Stage External Id | `pt_sourcestageexternalid` | Text | Yes | Useful during sync |
| Target Stage External Id | `pt_targetstageexternalid` | Text | No | Useful during sync when target is a stage |
| Target Month Text | `pt_targetmonthtext` | Text | No | Selected merge month when target is a month anchor |
| Target Column Index | `pt_targetcolumnindex` | Whole number | No | Selected merge grid column |

Alternate key:

- Composite if available: `pt_projectid + pt_externalid`
- If not, use text key `pt_mergelinkkey`.

Relationships:

- `Project` 1:N `Branch Merge Link`
- `Timeline Branch` 1:N `Branch Merge Link`
- `Timeline Stage` 1:N `Branch Merge Link` for source stage
- `Timeline Stage` 1:N `Branch Merge Link` for target stage

App behavior:

- Only the last Branch Plan or Branch Actual stage can create a merge link.
- The selected merge month is unrestricted; it can be before, on, or after main variant stages.
- If a matching main-row stage exists in the selected merge month, `pt_targetstageid` / `pt_targetstageexternalid` may be populated. Otherwise the app stores the month anchor through `pt_targetmonthtext` and `pt_targetcolumnindex`.
- Runtime rendering draws the merge as a horizontal-then-vertical connector back to the matching main Plan or Actual timeline. When the merge month is beyond the last main stage in that section, the browser extends that section's timeline line visually to that month.

Example `Branch Merge Link` rows:

| pt_name | pt_externalid | pt_mergecontext | pt_projectid | pt_branchid | pt_sourcestageid | pt_targetstageid | pt_sourcestageexternalid | pt_targetstageexternalid | pt_mergelinkkey |
|---|---|---|---|---|---|---|---|---|---|
| Gas branch merges to SOS | m1 | Plan | Project: Swift Facelift 2024 | Branch: Gas variant branch | Stage: Trial Branch Stage | Stage: SOS Plan | bp1 | p2 | local-1716100000000:m1 |
| Actual branch merges to DA | am1 | Actual | Project: Swift Facelift 2024 | Branch: Actual recovery branch | Stage: Trial Actual Branch Stage | Stage: DA Actual | abp1 | a1 | local-1716100000000:am1 |

## Submit Sync Order

On Submit, save rows in this order:

1. Upsert `Project`.
2. Delete missing child rows for that project, or replace children simply.
3. Upsert `Project Variant`.
4. Upsert `Timeline Stage` records for plan/actual stages.
5. Upsert `Timeline Branch`.
6. Resolve branch parent Plan/Actual stage lookups.
7. Upsert branch stages.
8. Upsert `Branch Merge Link`.

For the simplest implementation, delete all child records for the project and recreate them on every Submit. That avoids complicated per-row diff logic.

## Implementation Notes

- Use lookup columns for relationships.
- Use multiple lines of text for JSON fields.
- Plan stage dates remain month-precision `YYYY-MM`; Actual and Branch Actual stage dates are full `YYYY-MM-DD` values and render on the grid as day plus month.
- `pt_stageshiftsjson` stores visual preponed/postponed markers as `{ id, sourceNodeId, sourceContext, mode, targetDate, targetCol }`. These markers render as shifted stage copies with SVG quadratic Bezier arch arrows and do not replace normal stage records or normal timeline lines.
- Deleting a Timeline Branch in the browser removes its Branch Plan stages, Branch Actual stages, merge links, and stage shifts whose source stage belonged to that branch.
- Use alternate keys for browser external ids so Submit can upsert instead of duplicate.
- Use cascade delete from `Project` to child tables.
- Dataverse stores the submitted server state. Browser `localStorage` stores the unsaved draft and last submitted baseline.
