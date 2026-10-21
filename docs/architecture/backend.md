# Backend architecture

Frappe **v15** app, module `Sijil`, packaged with `pyproject.toml` (flit). Requires ERPNext (`required_apps`).

## Layers
| Layer | Location | Rule |
|---|---|---|
| Endpoint | `sijil/api/<area>.py` | Parse JSON args (`common.parse`), clamp paging (`common.paging`, max 100), check permission, call a service or ORM, decorate rows with display labels. No workflow logic. |
| Service | `sijil/services/<area>.py` | Multi-record workflows, one transaction per request (Frappe commits at request end; an exception rolls back). Row locks where double-submit matters. |
| Controller | `sijil/sijil/doctype/<dt>/<dt>.py` | Per-record validation, derived fields, immutability, delete guards, ERPNext side effects via `integrations`. |
| Permissions | `sijil/permissions.py` | Query conditions + document checks, wired in `hooks.py`. |

## Services
- `cases.add_event`, `cases.correct_event`, `cases.update_case_situation`, `cases.events_page`.
- `followups.create_followup`, `complete_followup` (locks the row, re-checks Open, creates event and next
  follow-up, closes), `cancel_followup`, `reschedule_followup`.
- `documents.create_document`, `add_version`, `link_document`, `links_for`, `describe_link`.
- `folders.create_land_folders` (from the Settings template), `breadcrumbs`, `ensure_path`.
- `reports.REPORTS` (six operational reports), `case_history_context`, `land_history_context`.

## Controller invariants (where they live)
| DocType | Invariant |
|---|---|
| Sijil Land | Unique responsibles; creates root folder + template folders after insert; renames root folder with the land; delete blocked while it has cases/tasks/follow-ups/documents; auto-creates ERPNext Project if enabled. |
| Sijil Case | Target ≥ start; no new case on an archived land; cannot change land; not related to itself; delete blocked if it has events, follow-ups or tasks. |
| Sijil Case Event | Insert-only (edit/delete throw); event date ≤ today; sets land, recorded_by, recorded_on; after insert updates case last-update, and situation/status only if it is the latest event. |
| Sijil Follow Up | Needs case or land, case must be on that land; closed cannot reopen; completed is frozen; keeps `Case.next_followup_date` in sync; ToDo + calendar sync; completed-with-event cannot be deleted. |
| Sijil Task | Case on the same land, event on the same case, due ≥ start; sets completed_on; ToDo + ERPNext Task sync. |
| Sijil Folder | No slashes, same land as parent, no cycles, unique sibling names, materialized `folder_path` (descendants updated on move/rename); root and non-empty folders cannot be deleted. |
| Sijil Document | Cannot move to another land or to another land's folder; delete blocked while linked. |
| Sijil Document Version | Insert-only; numbered under a row lock; forces the File private and re-attaches it to the version; becomes current. |
| Sijil Document Link | Same land as the document; pinned version belongs to the document; no duplicate link; unlink from an event is manager-only. |

## Install and migrate
`before_install` / `after_install` / `after_migrate` in `install.py`: create roles *Sijil Manager* and
*Sijil User*, default case types, seed the folder template once, set default company. Idempotent.
`make_demo_data()` seeds the Konooz Jeddah scenario. `patches.txt` is empty (no data migrations yet).

## Conventions
See `.claude/rules/backend.md`. Naming series: `LAND-#####`, `CASE-#####`, `EVT-#######`, `FUP-#####`,
`STK-#####`, `DOC-#######`, `DVER-#######`, `FLD-#######`; links use hash names.
