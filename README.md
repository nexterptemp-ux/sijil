# Sijil (سجل)

Real-estate operations, case follow-up, task and document management — a Frappe **v15** app that runs on the
company's ERPNext site. Arabic-first (RTL) with English.

For every land and project, Sijil answers: which cases exist, what is the current situation, what happened
and when, what is next and who follows up, which documents prove it, and what is overdue — with a full
history report on demand.

## Architecture in one paragraph
One Frappe custom app (`sijil/`): DocTypes for lands, cases, an **append-only case history**, follow-ups,
tasks and a versioned document library; business workflows in `sijil/services`; a purpose-specific API in
`sijil/api`; record-level permissions in `sijil/permissions.py`; ERPNext integration (Projects, Tasks, ToDo,
Calendar, notifications, parties) in `sijil/integrations`. The UI is a **React + TypeScript** app in `frontend/`, served by Frappe at `/sijil`
(the older Desk-page screen at `/app/sijil-app` stays until the new app is verified on a real site). Details: [docs/architecture/overview.md](docs/architecture/overview.md).

## Repository
| Path | What |
|---|---|
| `sijil/` | The Frappe app (backend, legacy UI, translations, templates) |
| `frontend/` | React + TypeScript app (all screens), see [frontend/README.md](frontend/README.md) |
| `docs/` | Product, architecture, decisions, roadmap, status — start at [docs/README.md](docs/README.md) |
| `design/reference/` | Original HTML prototype (unchanged) |
| `scripts/` | Dev checks (DocType validation, translation coverage) |
| `CLAUDE.md`, `.claude/` | Coding-agent guide, scoped rules, skills |

## Current status
The backend was written in full but has **never run on a live Frappe site**, and has no tests yet. The React
app covers every screen and has 36 passing tests, but only against an in-memory mock backend. See [docs/STATUS.md](docs/STATUS.md) for exactly what is verified, and
[docs/ROADMAP.md](docs/ROADMAP.md) for what comes next.

## Development
Prerequisites: WSL2 (Ubuntu 24.04) or Linux, MariaDB 10.6+, Redis, Python 3.10–3.12, Node 18, bench,
ERPNext v15. Full steps: [docs/development/setup.md](docs/development/setup.md). Short version:
```bash
bench get-app /path/to/sijil
bench --site <site> install-app sijil
bench --site <site> migrate
bench build --app sijil
bench --site <site> execute sijil.install.make_demo_data   # optional: Konooz Jeddah scenario
```
Open `/sijil`. Set the user language to Arabic (or use the language button) for the RTL interface.

Try the React app without Frappe, using sample data:
```bash
cd frontend && npm install && npm run dev:mock     # http://localhost:8080/sijil/
```

Checks that run without a bench:
```bash
python scripts/validate_doctypes.py
python scripts/check_translations.py
```

## License
Not decided yet ([open decision OD-1](docs/product/open-decisions.md)). `license.txt` currently says MIT, from
the initial build.
