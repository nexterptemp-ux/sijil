# Architecture notes

## Layout
`sijil/sijil/doctype` (DocTypes) · `services/` (business rules, shared by API, reports, controllers) · `api/` (whitelisted, thin) ·
`permissions.py` · `integrations/erpnext.py` · `public/js/sijil/` (SPA ES modules, bundled as `sijil.bundle.js`).

## Event model
Case Events are append-only. Editing/deleting is blocked. A correction creates a new event linked by `corrects`; the original
gets `entry_status = Superseded` and `superseded_by`. "Current situation" is a separate case field, updated through
`update_case_situation`/`add_event(situation_update)`, and is independent from `status`.

## Follow-ups
`complete_followup` runs in one transaction: lock row (`for_update`), verify open, create event, optionally create next
follow-up, then close. Double-submit is therefore safe.

## Documents
Sijil Document (logical) → Sijil Document Version (immutable; private File attached to the *version*, so File permission
delegates to our `has_permission`) → Sijil Document Link (pinned `document_version`, or `follow_latest`). A link may only
connect documents and records of the same land. Unlinking from an event is manager-only. Folders use a materialized `folder_path`.

## Permissions
Roles Sijil Manager / User. `permission_query_conditions` + `has_permission` for 9 DocTypes. With *restrict to assigned
lands* users only see lands where they are a responsible. Confidential documents need explicit access.

## ERPNext integration
Guarded by `frappe.flags.sijil_syncing` to avoid sync loops. All toggles in Sijil Settings.

## Limitations
No live-Frappe test was possible while building (see README). Cairo font not bundled.

## Staging checklist
1. Install, migrate, `bench build`, run `make_demo_data`.
2. Switch user language to Arabic; walk every screen (RTL, no clipped text).
3. Download case/land history **PDF** in Arabic: letters joined, right-to-left, numerals correct, page breaks sane.
4. Upload a private file; confirm a non-permitted user gets 403 on its URL.
5. Create land with auto project; edit ERPNext Task and confirm Sijil Task syncs back (and no loop).
6. Restricted-mode user: create event/follow-up/task on an assigned land; confirm other lands are invisible.
