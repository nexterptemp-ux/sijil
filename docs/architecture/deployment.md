# Deployment

Development setup: [development/setup.md](../development/setup.md). This page is about staging and production.

## Shape
Sijil is a Frappe app installed **on the company's ERPNext v15 bench and site** (ADR-002). No separate
servers or containers of its own. Production follows Frappe's official guidance — either a bench managed
with `bench setup production` (nginx + supervisor) or the official `frappe_docker` images with Sijil added
as a custom app. Don't build a homemade container stack.

## Release steps (per environment)
First install:
```bash
bench get-app <git-url-of-sijil> --branch main
bench --site <site> install-app sijil
bench --site <site> migrate
bench build --app sijil
bench restart
bench --site <site> execute sijil.install.make_demo_data   # optional: Konooz Jeddah sample data
```
Update an existing install:
```bash
cd apps/sijil && git pull && cd ../..
bench --site <site> migrate
bench build --app sijil
bench restart
```
Then open `https://<site>/sijil` and **hard-refresh once** (Ctrl+Shift+R) so the browser drops the old page.

`bench build --app sijil` runs the app's root `package.json` `build` script, which runs `npm ci` and `npm run build`
in `frontend/` (needs Node 18+ and npm, plus network access to the npm registry on the build machine). The output
goes to `sijil/public/frontend/` (git-ignored) with hashed file names and `.vite/manifest.json`.

Staging first, always; run the acceptance checklist ([product/acceptance.md](../product/acceptance.md)).

## Troubleshooting
| Symptom | Cause / fix |
|---|---|
| Page says "The Sijil frontend has not been built" | `bench build --app sijil` did not run or failed; run it and read its output |
| React error #321 / `removeChild` errors in the console | Two copies of the app script loaded — an old cached page or an old build. Pull the latest code, rebuild, hard-refresh. (Fixed in code on 2026-10-22: never add `?v=` to the entry script.) |
| 403 / redirect to login on `/sijil` | User lacks the *Sijil User* / *Sijil Manager* role, or is not logged in |
| New document types missing (e.g. Organizational Sketch) | `bench --site <site> migrate` was not run |

## Server requirements beyond ERPNext
- wkhtmltopdf (patched Qt) and an **Arabic font** for history PDFs.
- Scheduler enabled for reminders; outgoing email account if email reminders are on.
- Node available at build time for the React frontend (already required by bench).

## Runtime data (never in git)
Database, `sites/<site>/site_config.json`, `sites/<site>/private/files` (all Sijil documents),
`sites/<site>/public/files`, logs, backups. Backups: `bench --site <site> backup --with-files` — the private
files are part of the business record and must be in every backup.

## Not decided yet
Monitoring, backup schedule/retention, data migration from existing records (OD-10) — roadmap phase P9.
