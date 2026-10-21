# Deployment

Development setup: [development/setup.md](../development/setup.md). This page is about staging and production.

## Shape
Sijil is a Frappe app installed **on the company's ERPNext v15 bench and site** (ADR-002). No separate
servers or containers of its own. Production follows Frappe's official guidance — either a bench managed
with `bench setup production` (nginx + supervisor) or the official `frappe_docker` images with Sijil added
as a custom app. Don't build a homemade container stack.

## Release steps (per environment)
```bash
bench get-app <git-url-of-sijil> --branch <release-branch>   # first time; later: bench update --apps sijil / git pull
bench --site <site> install-app sijil                         # first time only
bench --site <site> migrate                                   # DocTypes, patches, after_migrate defaults
bench build --app sijil                                       # Desk assets + React build (once F1 adds it)
bench restart
```
Staging first, always; run the acceptance checklist ([product/acceptance.md](../product/acceptance.md)).

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
