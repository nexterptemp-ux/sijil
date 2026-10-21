# Authentication, permissions and security

## Authentication
Frappe session authentication only. Users are ERPNext/Frappe users; login is Frappe's (`/login` or
`POST /api/method/login`). The React app is served from the same site, so the `sid` cookie is sent
automatically; no tokens or API keys exist in the frontend. CORS stays closed. Every mutating request carries
`X-Frappe-CSRF-Token`. Cookies follow Frappe's defaults (HttpOnly `sid`, `Secure` when served over HTTPS).

App access: `permissions.has_app_permission` — the user needs *Sijil User*, *Sijil Manager* or *System
Manager* (also gates the apps-screen tile and the report/integration endpoints).

## Three layers of authorization
1. **Role permissions** on each DocType (JSON) — *what* a role may do. Summary in
   [product/user-roles.md](../product/user-roles.md).
2. **Record-level rules** in `sijil/permissions.py`, wired in `hooks.py` for 9 DocTypes:
   - `permission_query_conditions` → SQL `WHERE` added to every `frappe.get_list` (lists, counts, search,
     dashboard, reports).
   - `has_permission` → per-document check on `get_doc().check_permission`, `frappe.has_permission` and file
     downloads. Returns `False` to deny, `None` to defer to role permissions.
3. **Workflow checks** in services/controllers (e.g. only managers unlink documents from events; closed
   follow-ups are frozen).

### Record-level rules
- **Managers** (`Sijil Manager`, `System Manager`, Administrator) are never restricted.
- **Restricted mode** (`Sijil Settings.restrict_to_assigned_lands`, off by default): a non-manager sees
  - lands where they are a responsible or which they created (`permissions.user_lands`);
  - cases on those lands, or where they are `owner_user` or creator;
  - events on those lands or that they recorded;
  - follow-ups/tasks on those lands, or assigned to / created by them;
  - folders and documents on those lands.
- **Confidential documents** (always, not only in restricted mode): visible to managers, the uploader, and
  the land's responsibles. Versions and links inherit their document's rule.

`user_lands` is cached per request.

## Files
Every document file is a Frappe `File` with `is_private = 1`, attached to its *Sijil Document Version*.
Private URLs (`/private/files/...`) are served only after Frappe checks read permission on the attached
document, which runs `document_version_has_permission`. Hiding a link in the UI is never the protection.

## Rules for new code
See `.claude/rules/api-security.md`. In short: check permission before every read/write, allow-list saved
fields, no `allow_guest`, `ignore_permissions` only for side effects, translated user-facing errors,
`frappe.db.escape` in any SQL.

## Known gaps (to verify on staging — see STATUS)
- Behaviour of the hooks on a live v15 site has not been exercised.
- `frappe.db.get_all` is used for *labels* of already-authorized rows (e.g. land names). That is intended;
  any other use is a bug.
- XSS: event `description` is rich text (Text Editor). Frappe sanitizes it on save; the frontend must still
  render it through a sanitizer.
- Audit: `track_changes` is on for Land, Case, Event, Follow Up, Task, Document (Frappe Version log).
