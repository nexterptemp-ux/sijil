# Architecture overview

## System
A **modular monolith** ([ADR-001](../decisions/ADR-001-modular-monolith-frappe-app.md)): one Frappe custom app
(`sijil`) installed on the company's ERPNext v15 site ([ADR-002](../decisions/ADR-002-erpnext-dependency.md)),
plus a React single-page app served by the same site ([ADR-003](../decisions/ADR-003-react-frontend.md)).

```
Browser ── React SPA (/sijil)  ──┐   same origin, Frappe session cookie + CSRF token
        └─ Frappe Desk (/app)   ─┤
                                 ▼
               Frappe web workers (gunicorn)
               ├── sijil.api.*          whitelisted, purpose-specific endpoints
               ├── sijil.services.*     business workflows (transactions)
               ├── DocType controllers  per-record invariants
               ├── sijil.permissions    record-level access (query + document hooks)
               └── sijil.integrations   ERPNext Project / Task / ToDo / Event / notifications
                                 │
        MariaDB ◄────────────────┤──────► private file storage (sites/<site>/private/files)
        Redis (cache, queue) ◄───┘
        Scheduler + background workers: sijil.tasks.send_daily_reminders (daily)
```

No microservices, no second backend. The SPA talks only to `sijil.api.*` (and Frappe's login/logout).

## Repository map
| Path | Owns | Canonical doc |
|---|---|---|
| `sijil/sijil/doctype/` | DocType schemas (JSON) + controllers | [domain-model.md](domain-model.md) |
| `sijil/services/` | Workflows: cases/events, follow-ups, documents, folders, report data | [backend.md](backend.md) |
| `sijil/api/` | Whitelisted endpoints, response shaping, paging | [api.md](api.md) |
| `sijil/permissions.py` | Record-level permissions | [security.md](security.md) |
| `sijil/integrations/erpnext.py`, `sijil/overrides/` | ERPNext sync and dashboard connections | [erpnext-integration.md](erpnext-integration.md) |
| `sijil/tasks.py` | Scheduled reminders | [jobs-and-reports.md](jobs-and-reports.md) |
| `sijil/services/reports.py`, `sijil/sijil/report/`, `sijil/templates/reports/` | Operational and history reports | [jobs-and-reports.md](jobs-and-reports.md) |
| `sijil/install.py` | Roles, defaults, demo data | [backend.md](backend.md) |
| `sijil/translations/ar.csv` | Arabic translations | [frontend.md](frontend.md#i18n) |
| `sijil/public/js/sijil/`, `sijil/sijil/page/sijil_app/` | **Legacy** Desk-page SPA (to be removed) | [frontend.md](frontend.md#legacy-spa) |
| `frontend/` | React app (**planned**, not created yet) | [frontend.md](frontend.md) |
| `scripts/` | Dev checks (DocType JSON validation, translation coverage) | [testing/strategy.md](../testing/strategy.md) |
| `design/reference/` | Original prototype, unchanged | [product/prototype-review.md](../product/prototype-review.md) |

## Dependency direction
`api → services → controllers/ORM`, `services → integrations`, `controllers → integrations`.
`permissions` is called by Frappe itself, never by the SPA. Integrations never call `api`.
The SPA depends only on the API contract.

## Cross-cutting decisions
- Business rules in the backend ([ADR-001](../decisions/ADR-001-modular-monolith-frappe-app.md)).
- Append-only case history ([ADR-004](../decisions/ADR-004-append-only-case-events.md)).
- Follow-ups ≠ tasks ≠ events ([ADR-005](../decisions/ADR-005-separate-followups-and-tasks.md)).
- Document identity vs storage vs link ([ADR-006](../decisions/ADR-006-document-identity-versions-links.md)).
- Land-scoped record permissions ([ADR-007](../decisions/ADR-007-land-scoped-permissions.md)).
- Time: dates are business dates; datetimes are naive in the site's System Settings time zone (Frappe
  default). `event_date` (when it happened) is separate from `recorded_on` (when it was entered).
