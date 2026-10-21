---
paths:
  - "sijil/**/*.py"
  - "sijil/**/*.json"
  - "sijil/hooks.py"
  - "sijil/templates/**"
---

# Backend rules (Frappe v15 app)

- **Layering:** `sijil/api/*` = thin whitelisted endpoints (parse args, check permission, call a service, shape
  the response). `sijil/services/*` = business workflows. DocType controllers = per-record invariants
  (validation, derived fields, immutability, delete guards). Don't put workflow logic in `api/`.
- Use the Frappe ORM (`frappe.get_list`, `get_doc`, `db.get_value`). `frappe.get_list` applies permissions;
  `frappe.db.get_all` / `get_value` do **not** — use them only for lookups after an explicit permission check,
  or for labels of records already authorized.
- `ignore_permissions=True` / `flags.ignore_permissions` only for system side-effects of an action the user
  was already authorized for (e.g. an event updating its case). Never for the user's primary action.
- Raw SQL only where the ORM can't express it (the permission-query hooks). Always `frappe.db.escape`.
- Immutability: Case Event and Document Version throw on edit/delete; corrections go through
  `services/cases.correct_event`. Preserve this when adding fields.
- Lock rows (`for_update=True`) and re-check state in workflows that can be double-submitted.
- Dates: `event_date` is the business date the user entered; `recorded_on` / `creation` are system time
  (site time zone, naive datetimes as Frappe stores them). Don't conflate them.
- DocType JSON changes need `bench migrate`. Keep `name`, `module: "Sijil"`, field order and permissions
  valid; run `python scripts/validate_doctypes.py`.
- New DocType with land-scoped data → add `permission_query_conditions` + `has_permission` in `hooks.py`
  and `permissions.py`.
- ERPNext calls go through `sijil/integrations/erpnext.py`, gated by a `Sijil Settings` flag, guarded by
  `frappe.flags.sijil_syncing` against loops.
- Strings: `_("...")` with a literal; add the Arabic to `sijil/translations/ar.csv`;
  run `python scripts/check_translations.py`.
- Style: tabs, Frappe's ruff/black-style conventions, short functions, docstrings for workflows.
