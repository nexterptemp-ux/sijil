# API contract

The only interface the frontend uses. Code: `sijil/api/*.py`. When an endpoint's arguments or response change,
update this file and the frontend types in the same change.

## Conventions
- **URL:** `POST /api/method/sijil.api.<module>.<function>` (GET works for reads; the SPA uses POST for
  everything except file downloads).
- **Auth:** Frappe session cookie (`sid`) from `/api/method/login` or the Desk login page. Same origin only.
- **CSRF:** every POST sends header `X-Frappe-CSRF-Token`. The React app reads it from the page it is served
  in (see [frontend.md](frontend.md#auth-and-csrf)).
- **Arguments:** form or JSON body. Object/array arguments (`data`, `filters`, `event`, `documents`, …) are
  JSON strings or JSON values; the backend `parse()`s both.
- **Success:** `{"message": <result>}` — the result shapes below are the value of `message`.
- **Errors:** HTTP status from the exception — 403 `PermissionError`, 404 `DoesNotExistError`,
  417 `ValidationError` (default for `frappe.throw`), 500 unexpected. Body contains `exc_type` and
  `_server_messages` (JSON array of JSON strings, each `{message, title, indicator}`) — already translated.
  The frontend shows the first message and never parses `exc`.
- **Paged lists** return `Page<T> = {total, rows: T[], start, page_length, has_more}`. `page_length` ≤ 100.
- Dates are `YYYY-MM-DD`; datetimes `YYYY-MM-DD HH:MM:SS[.ffffff]` in the site time zone.
- Records include `can_write` where the UI needs it; global create rights are in `bootstrap.can_create`.
- `<X>_name` / `<X>_title` fields are display labels added by the API (e.g. `land_name`, `owner_name`).

## meta
| Function | Args | Returns |
|---|---|---|
| `bootstrap` | — | `{today, user: {name, full_name, is_manager, image}, lang, settings: {stale_case_days, default_reminder_days, restrict_to_assigned_lands}, options: {case_status, priority, land_status, event_type, communication_method, task_status, document_type, organization_type}, case_types: string[], can_create: {"Sijil Land"…"Sijil Document": bool}}` |
| `users` | `search?` | `[{name, full_name, user_image}]` (enabled system users, ≤200) |
| `search` | `query` (≥2 chars) | `{lands[], cases[], tasks[], followups[], documents[]}` (≤6 each) |
| `lookup` | `doctype` ∈ Land, Case, Case Event, External Organization, Case Type, Contact, Project, Company; `txt?`; `filters?` (`land` for Case, `case` for Case Event) | `[{value, label}]` (≤12) |
| `label_for` | `doctype`, `name` | `string \| null` |

## dashboard
| Function | Args | Returns |
|---|---|---|
| `get_dashboard` | — | `{today, stale_days, counts: {active_lands, open_cases, awaiting_action, overdue_followups, due_today_followups, upcoming_followups, open_tasks, overdue_tasks, stale_cases}, attention_followups: FollowUp[] (≤8, due ≤ today), upcoming_followups: FollowUp[] (≤6), recent_events[] (≤8), recent_documents[] (≤6), stale_cases[] (≤6)}` |

## lands
| Function | Args | Returns |
|---|---|---|
| `list_lands` | `search?`, `status?`, `start`, `page_length`=24 | `Page<{name, land_name, land_code, status, city, company, project, modified, open_cases, total_cases, open_followups, overdue_followups, documents}>` |
| `get_land` | `name` | Land fields + `responsibles: [{user, full_name, responsibility}]`, `organizations: [{organization, role, organization_type}]`, `stats: {cases_total, cases_open, cases_stale, followups_open, followups_overdue, tasks_open, documents, events}`, `can_write` |
| `land_activity` | `land`, `start`, `page_length`=15 | `Page<{name, title, case, case_title, event_date, event_type, recorded_by, recorded_by_name, is_milestone}>` |
| `save_land` | `data: {name?, land_name, land_code, status, city, company, location, description, notes, project, responsibles: [{user, responsibility}], organizations: [{organization, role}], create_project?}` | `{name}` |
| `create_project` | `land` | `{project}` |

## cases
| Function | Args | Returns |
|---|---|---|
| `list_cases` | `search?`, `land?`, `status?` (a status, or `open`/`closed`), `priority?`, `owner?`, `mine`=0, `stale`=0, `scope?` (`open`/`closed`), `order` ∈ `updated`/`stale`/`followup`/`title`, `start`, `page_length`=20 | `Page<Case>` with `land_name`, `owner_name` |
| `get_case` | `name` | Case fields + `land_name`, `owner_name`, `external_contact_name?`, `relations: [{related_case, relation_type, title, status}]`, `open_followups: FollowUp[]`, `tasks: [{name, title, status, priority, due_date, assigned_to, assigned_to_name}]`, `documents: LinkedDocument[]`, `stats: {events, followups_total, followups_done, tasks_open, documents}`, `last_event: {name, title, event_date, recorded_by} \| null`, `can_write` |
| `list_events` | `case`, `start`, `page_length`=15, `include_superseded`=1 | `Page<Event>`; each event has all event fields + `recorded_by_name`, `documents: LinkedDocument[]`. Order: `event_date desc, creation desc` |
| `save_case` | `data: {name?, title, reference_no, land, case_type, status, priority, owner_user, external_organization, external_contact, start_date, target_date, description, current_situation, relations?: [{related_case, relation_type}]}` | `{name}` |
| `record_event` | `data: {case, event_date, event_time?, title, description?, event_type, communication_method?, external_organization?, outcome?, situation_update?, status_after?, is_milestone?, documents?: (name \| {document, version?, follow_latest?})[]}` | `{name}` |
| `correct_event` | `name`, `data` (event fields to change), `reason` (required) | `{name}` of the correcting event |
| `update_situation` | `case`, `situation`, `status?`, `title?` | `{name}` of the Update event |

## followups
`FollowUp = {name, title, case, case_title, land, land_name, assigned_to, assigned_to_name, due_date, priority, status, completion_date, state}`
where `state` ∈ `Upcoming | Due Today | Overdue | Completed | Cancelled` (derived).

| Function | Args | Returns |
|---|---|---|
| `list_followups` | `scope` ∈ `open`/`overdue`/`today`/`upcoming`/`week`/`completed`/`cancelled`/`all`, `case?`, `land?`, `assigned_to?`, `mine`=0, `search?`, `start`, `page_length`=20 | `Page<FollowUp + {description, outcome, result_event, next_followup}>` |
| `followup_counts` | `mine`=0 | `{open, overdue, today, upcoming, completed}` |
| `save_followup` | `data: {name?, title, description, case?, land?, assigned_to?, due_date, priority?, originating_event?, reminder_days_before?}` (edit allows title, description, due_date, assigned_to, priority) | `{name}` |
| `complete` | `name`, `outcome` (required), `event?` (event fields to override), `next_followup?: {due_date, title?, description?, assigned_to?, priority?}`, `documents?` | `{followup, event \| null, next_followup \| null}` — one transaction; second call fails "already Completed" |
| `cancel` | `name`, `reason?` | `{name}` |
| `reschedule` | `name`, `due_date`, `assigned_to?` | `{name}` |

## tasks
| Function | Args | Returns |
|---|---|---|
| `list_tasks` | `scope` ∈ `open`/`overdue`/`completed`/`cancelled`/`all`, `land?`, `case?`, `assigned_to?`, `mine`=0, `search?`, `start`, `page_length`=20 | `Page<{name, title, status, priority, assigned_to, assigned_to_name, land, land_name, case, case_title, due_date, start_date, completed_on, erpnext_task, project, overdue}>` |
| `task_counts` | `mine`=0 | `{open, overdue, completed}` |
| `get_task` | `name` | Task fields + `land_name`, `case_title`, `assigned_to_name`, `updates: [{update_on, user, user_name, note}]`, `documents: LinkedDocument[]`, `can_write` |
| `save_task` | `data: {name?, title, description, land, case, case_event, status, priority, assigned_to, start_date, due_date, completion_notes}` | `{name}` |
| `set_status` | `name`, `status`, `completion_notes?` | `{name, status}` |
| `add_update` | `name`, `note` | `{name}` |

## documents
`LinkedDocument = {link, document, title, document_type, land, is_confidential, follow_latest, note, linked_by, linked_on, version: {name, version_no, file, file_name, file_size, creation, uploaded_by}, has_newer_version, current_version_no}`

| Function | Args | Returns |
|---|---|---|
| `library` | `land`, `folder?` (default root), `search?`, `document_type?`, `recursive`=0, `start`, `page_length`=24 | `{root, folder, breadcrumbs, tree: Folder[] (all folders of the land, with document_count, child_count), children: Folder[], documents: Page<Document + {folder_name, version, owner_name, links}>, searching}` |
| `get_document` | `name` | Document fields + `land_name`, `breadcrumbs`, `versions: [{name, version_no, file, file_name, file_size, notes, uploaded_by, uploaded_by_name, creation, is_current}]`, `links: [{name, linked_doctype, linked_name, title, document_version, version_no, follow_latest, linked_by, creation}]`, `can_write` |
| `update_document` | `name`, `data: {title, document_type, reference_no, document_date, description, is_confidential, archived, folder}` | `{name}` |
| `upload_document` | **multipart** POST: `file`, `land`, `folder?`, `title?`, `document_type?`, `reference_no?`, `document_date?`, `description?`, `is_confidential?`, `notes?`, `link_doctype?`, `link_name?` | `{document, version}` |
| `upload_version` | **multipart** POST: `file`, `document`, `notes?` | `{version}` |
| `link_document` | `document`, `linked_doctype`, `linked_name`, `document_version?`, `follow_latest`=0, `note?` | `{name}` |
| `unlink_document` | `link` | `{name}` |
| `linked_documents` | `linked_doctype`, `linked_name` | `LinkedDocument[]` |
| `search_documents` | `land`, `query?`, `limit`=20 (≤50) | `[{name, title, document_type, version_count, current_version}]` |
| `create_folder` | `land`, `folder_name`, `parent?` | `{name}` |
| `rename_folder` / `move_folder` / `delete_folder` / `move_document` | `name` + `folder_name` / `parent` / — / `folder` | `{name}` |

File download: `version.file` is a private URL (`/private/files/…`); the browser fetches it with the session
cookie and Frappe checks permission through the version's `has_permission`.

## reports
| Function | Args | Returns |
|---|---|---|
| `available` | — | `[{key, name}]` |
| `run` | `report` ∈ `overdue_followups`, `upcoming_followups`, `open_cases_by_employee`, `case_status_by_project`, `outstanding_tasks`, `stale_cases`; `filters?` | `{key, name, columns: [{fieldname, label, fieldtype, options, width}], rows: object[]}` |
| `case_history` / `land_history` | `case` / `land` | `{title, html}` (rendered, direction from user language) |
| `case_history_pdf` / `land_history_pdf` | `case` / `land` | PDF file download (GET link) |

## integrations
| Function | Args | Returns |
|---|---|---|
| `get_integrations` | — | Status of each ERPNext integration (`integrations.erpnext.integration_status`) |
| `set_integration` | `flag` ∈ Settings integration flags, `value` (manager only) | same as `get_integrations` |
| `link_pending_tasks` | — (manager only) | `{synced}` |
