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
Calendar, notifications, parties) in `sijil/integrations`. The UI is moving from a legacy Desk-page SPA to a
**React + TypeScript** app in `frontend/` (planned). Details: [docs/architecture/overview.md](docs/architecture/overview.md).

## Repository
| Path | What |
|---|---|
| `sijil/` | The Frappe app (backend, legacy UI, translations, templates) |
| `frontend/` | React app — not created yet (roadmap F1) |
| `docs/` | Product, architecture, decisions, roadmap, status — start at [docs/README.md](docs/README.md) |
| `design/reference/` | Original HTML prototype (unchanged) |
| `scripts/` | Dev checks (DocType validation, translation coverage) |
| `CLAUDE.md`, `.claude/` | Coding-agent guide, scoped rules, skills |

## Current status
The backend and legacy UI were written in full but have **never run on a live Frappe site**; there are no
tests yet. See [docs/STATUS.md](docs/STATUS.md) for exactly what is verified, and
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
Open `/app/sijil-app` (legacy UI). Set the user language to Arabic for the RTL interface.

Checks that run without a bench:
```bash
python scripts/validate_doctypes.py
python scripts/check_translations.py
```

## License
Not decided yet ([open decision OD-1](docs/product/open-decisions.md)). `license.txt` currently says MIT, from
the initial build.
