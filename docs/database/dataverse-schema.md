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
| EOP Date | `pt_eopdate` | Date only | No | Parsed EOP month/date |
| Years JSON | `pt_yearsjson` | Multiple lines of text | No | Example: `[2024,2025]` |
| Remarks | `pt_remarks` | Multiple lines of text | No | User remarks |
| Milestone Table JSON | `pt_milestonetablejson` | Multiple lines of text | No | Dynamic table data |
| EOP Table JSON | `pt_eoptablejson` | Multiple lines of text | No | Dynamic table data |
| Layout JSON | `pt_layoutjson` | Multiple lines of text | No | Label positions, remark position, nid |
| Last Submitted On | `pt_lastsubmittedon` | Date and time | No | Set on submit |

Alternate key:

- `pt_externalid`

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

## Table: Timeline Branch

Display name: `Timeline Branch`

Schema/logical name: `pt_timelinebranch`

Primary name column: `pt_name`

| Column display name | Logical name | Dataverse type | Required | Notes |
|---|---|---:|---:|---|
| Branch Label | `pt_name` | Text | Yes | Branch name |
| External Branch Id | `pt_externalid` | Text | Yes | From browser state branch id |
| Project | `pt_projectid` | Lookup to `Project` | Yes | Useful for querying |
| Variant | `pt_variantid` | Lookup to `Project Variant` | Yes | Parent variant |
| Parent Stage External Id | `pt_parentstageexternalid` | Text | Yes | Browser id of parent planned stage |
| Parent Planned Stage | `pt_parentstageid` | Lookup to `Timeline Stage` | No | Can be linked after stages are created |
| Display Order | `pt_displayorder` | Whole number | No | Branch ordering |

Alternate key:

- Composite if available: `pt_projectid + pt_externalid`
- If not, use text key `pt_branchkey`.

Relationships:

- `Project Variant` 1:N `Timeline Branch`
- `Project` 1:N `Timeline Branch`
- `Timeline Stage` 1:N `Timeline Branch` through `pt_parentstageid`

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
| Month | `pt_month` | Date only | No | Store as first day of month if needed |
| Month Text | `pt_monthtext` | Text | No | Example: `2024-06`; useful if only month precision |
| Column Index | `pt_columnindex` | Whole number | Yes | Timeline grid column |
| Shape | `pt_shape` | Choice `pt_stageshape` | No | Square/Circle |
| Top Label | `pt_toplabel` | Text | No | Example: DA |
| Bottom Label | `pt_bottomlabel` | Text | No | Optional |
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

## Table: Branch Merge Link

Display name: `Branch Merge Link`

Schema/logical name: `pt_branchmergelink`

Primary name column: `pt_name`

| Column display name | Logical name | Dataverse type | Required | Notes |
|---|---|---:|---:|---|
| Merge Link Name | `pt_name` | Text | No | Generated label |
| External Merge Link Id | `pt_externalid` | Text | Yes | From browser state |
| Project | `pt_projectid` | Lookup to `Project` | Yes | Parent project |
| Branch | `pt_branchid` | Lookup to `Timeline Branch` | Yes | Source branch |
| Source Branch Stage | `pt_sourcestageid` | Lookup to `Timeline Stage` | Yes | Branch node |
| Target Planned Stage | `pt_targetstageid` | Lookup to `Timeline Stage` | Yes | Plan node |
| Source Stage External Id | `pt_sourcestageexternalid` | Text | Yes | Useful during sync |
| Target Stage External Id | `pt_targetstageexternalid` | Text | Yes | Useful during sync |

Alternate key:

- Composite if available: `pt_projectid + pt_externalid`
- If not, use text key `pt_mergelinkkey`.

Relationships:

- `Project` 1:N `Branch Merge Link`
- `Timeline Branch` 1:N `Branch Merge Link`
- `Timeline Stage` 1:N `Branch Merge Link` for source stage
- `Timeline Stage` 1:N `Branch Merge Link` for target stage

## Submit Sync Order

On Submit, save rows in this order:

1. Upsert `Project`.
2. Delete missing child rows for that project, or replace children simply.
3. Upsert `Project Variant`.
4. Upsert `Timeline Stage` records for plan/actual stages.
5. Upsert `Timeline Branch`.
6. Resolve branch parent planned stage lookups.
7. Upsert branch stages.
8. Upsert `Branch Merge Link`.

For the simplest implementation, delete all child records for the project and recreate them on every Submit. That avoids complicated per-row diff logic.

## Implementation Notes

- Use lookup columns for relationships.
- Use multiple lines of text for JSON fields.
- Use alternate keys for browser external ids so Submit can upsert instead of duplicate.
- Use cascade delete from `Project` to child tables.
- Dataverse stores the submitted server state. Browser `localStorage` stores the unsaved draft and last submitted baseline.
