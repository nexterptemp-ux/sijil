# SIJIL (سجل) — ERPNext v15 app

Real-estate operations, case follow-up, task and document management for land/project portfolios,
built as a Frappe/ERPNext **v15** app. English UI, complete Arabic translation (RTL).

## Install
```bash
bench get-app /path/to/sijil          # or a git URL
bench --site <site> install-app sijil
bench --site <site> migrate
bench build --app sijil
bench --site <site> execute sijil.install.make_demo_data   # optional acceptance scenario
```
Set the site/user language to Arabic to get the translated UI (`sijil/translations/ar.csv`).
Open **Sijil** from the app screen, or `/app/sijil-app`.

Optional: drop `Cairo-*.woff2` into `sijil/public/fonts/` for best Arabic typography (a system font stack is used otherwise).

## What is inside
- 17 DocTypes: Land, Case, immutable **Case Event**, Follow Up, independent Task, nested Document library
  (Document / immutable Version / pinned Link), settings, templates.
- A task-oriented SPA (Frappe Page `sijil-app`): dashboard, lands, case workspace with development log, follow-ups, tasks,
  document library, reports, integrations screen. Server-side pagination everywhere.
- 6 Script Reports + history reports (HTML and PDF) for a case and for a land.
- ERPNext integration (each toggled in *Sijil Settings*, status shown in the in-app **Integrations** screen):
  Project (create/auto-create per land), two-way Task sync, ToDo, Calendar Event, Notification Log + email reminders,
  Supplier/Customer/Contact links, File, Company, Employee/User, dashboard connections on Project/Task/Supplier/Customer.
- Roles: *Sijil Manager*, *Sijil User*; optional "restrict to assigned lands"; confidential documents.

## Verification status (please read)
The build environment had no network access to PyPI/npm, so **Frappe itself could not be installed or run**. Verified:
Python compile + undefined-name AST check, DocType JSON structural validation against Frappe/ERPNext sources,
JS syntax + module-link checks, translation coverage (`scripts/check_translations.py`),
and a **real-browser smoke test** (Chromium, mocked backend) of every SPA screen in EN and AR, modals, and a 420px viewport.
**Not verified:** actual DB behaviour, migrations, permission hooks under a live site, PDF rendering with Arabic fonts,
ERPNext sync. Run the checklist in `docs/ARCHITECTURE.md` on a staging bench before production.

See `docs/ARCHITECTURE.md` and `docs/PROTOTYPE_REVIEW.md`. The original prototype is preserved unchanged in `design/reference/`.
