---
paths:
  - "sijil/api/**"
  - "sijil/permissions.py"
  - "sijil/hooks.py"
  - "sijil/services/documents.py"
  - "frontend/src/lib/api/**"
---

# API and security rules

- Every `@frappe.whitelist()` function either uses `frappe.get_list`/`get_doc` + `check_permission`, or calls
  `frappe.has_permission(..., throw=True)` before touching data. Manager-only actions check `is_manager()`.
- Never `allow_guest=True`. File uploads use `methods=["POST"]`.
- Only accept fields from an explicit allow-list when saving (`for field in (...)`), never `doc.update(data)`.
- Errors: raise with `frappe.throw(_("..."), <ExceptionType>)` — `frappe.PermissionError` (403),
  `frappe.ValidationError` (417, default), `frappe.DoesNotExistError` (404). Messages are user-facing and
  translated; never leak SQL, tracebacks or other users' data.
- The response shape of an endpoint is a contract: change [docs/architecture/api.md](../../docs/architecture/api.md)
  and the frontend types in the same change. Lists return `{total, rows, start, page_length, has_more}`.
- Auth is the Frappe session cookie, same origin. Mutating calls send `X-Frappe-CSRF-Token`. No API keys or
  secrets in the frontend. No CORS opening.
- Documents: files are always private; access goes through `has_permission` of Sijil Document Version.
  Confidential documents follow `permissions._document_allowed`.
- Record-level rules (restricted mode, land responsibles) live only in `sijil/permissions.py` — don't
  re-implement them in endpoints.
