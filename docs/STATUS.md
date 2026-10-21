# Status

Facts only: what exists, what was verified and how, what is known to be wrong. Update in the same change as
the code. Plans live in [ROADMAP.md](ROADMAP.md).

_Last updated: 2026-10-21 (F7 documents)._

## Summary
| Area | Implemented | Verified on a live Frappe site |
|---|---|---|
| Backend: 17 DocTypes, services, API, permissions, ERPNext integration, reminders, reports | Yes (initial build) | **No — never installed or run** |
| Legacy Desk-page SPA (`/app/sijil-app`) | Yes | Only against a mocked backend by the initial build (not reproducible here) |
| React frontend (`frontend/`) | F1 shell (see below) | **No** — runs only against the in-memory mock backend |
| Tests | Frontend Vitest only; **no Frappe tests** | — |
| Local dev environment | **Not set up** (WSL Ubuntu 24.04 exists, stopped; no Docker) | — |
| Docs and agent config (P0) | Yes | Reviewed against the code |

## Implemented (unverified at runtime)
Everything in [product/requirements.md](product/requirements.md) R1–R9 has backend code and a legacy UI
screen, per the initial build. None of it has run on Frappe, so treat each as *written, not working* until
E1/E2/E3 prove otherwise.

## React frontend slices
| Slice | State | Verified how |
|---|---|---|
| F1 scaffold + shell | Done: Vite/TS/Tailwind, API client, i18n (ar.csv), mock backend, shell (sidebar drawer on mobile, language toggle, user menu), 404, `/sijil` serving via `sijil/www/sijil.py` + `website_route_rules`, root `package.json` build hook | typecheck, lint, Vitest, build, browser (mock) at 1280 px and 375 px in en/ar. **Frappe serving (`/sijil`, `bench build` hook) not verified** |
| F2 dashboard + search | Done: counts (each links to a filtered list), needs-attention and upcoming follow-ups, recent developments/documents, stale cases; global search dialog (Ctrl K, keyboard nav); follow-ups badge in the menu | Vitest (counts, search → navigation), browser (mock) desktop ar + 375 px en |
| F3 lands | Done: list (search, status filter, paging in URL), land page (counts, open cases, open follow-ups, open tasks, paged developments, details, responsibles, organizations, create ERPNext project), create/edit dialog (manager only) | Vitest (filter, detail, create with validation, non-manager), browser (mock) 375 px ar |
| F4 cases | Done: list (search, open/closed, status, priority, land, mine, stale, sort, paging in URL), case workspace (current situation first, next required action, tabs: paged history / follow-ups / tasks / documents, responsibility and details panel, relations), record development (actual date ≤ today, milestone, optional situation/status change, attachments), correction with mandatory reason (original kept, marked superseded, jump links), quick situation update, create/edit case | Vitest (status filter, workspace, AC-01 record + situation/status, future-date refusal, AC-02 correction), browser (mock) desktop ar + 375 px |
| F5 follow-ups | Done: follow-ups centre (scope chips with counts, search, land, mine, case filter, paging), plan/edit, complete (mandatory outcome → development, type/method/milestone/situation, attach documents, schedule next — one call), reschedule, cancel with reason; actions on dashboard, land and case pages | Vitest (scope filter, AC-01 step 4 incl. double click → one event + one next follow-up, plan from case), browser (mock) 375 px ar |
| F6 tasks | Done: tasks list (scope chips with counts, search, land, mine, paging), task page (start, complete with notes, cancel with reason, reopen, edit, progress notes, linked documents), create/edit (land and case optional), open tasks on case and land pages. Translated placeholders are bidi-isolated so mixed Arabic/English sentences keep their order | Vitest (task without case, complete overdue with notes, progress note), browser (mock) 375 px ar |
| F7 documents | Done: library home (choose land), per-land library (folder tree on desktop / toggle on phone, breadcrumbs, subfolder grid, search, type filter, include subfolders, paging), upload (folder, type, reference, date, confidential), document detail (open version, upload new version, immutable versions, where linked + pinned version, edit metadata, move, archive/restore), folder create/rename/move/delete, link/unlink on cases and tasks, attach existing/upload in record and complete dialogs, newer-version hint on events | Vitest (browse, upload = 1 document + 1 version, new version keeps event pinned to v1 (AC-03), newer-version hint), browser (mock) 375 px ar |

## Verification log
| Date | Command / check | Result |
|---|---|---|
| 2026-10-21 | `python scripts/validate_doctypes.py` (Python 3.13.7, Windows) | Pass — 17 DocTypes checked |
| 2026-10-21 | `python scripts/check_translations.py` | Pass — 599 strings, 599 `ar.csv` entries |
| 2026-10-21 | `python -m compileall -q sijil` | Pass |
| 2026-10-21 | `node --check --input-type=module` on every legacy SPA module (Node 24.19.0) | Pass (syntax only) |
| 2026-10-21 | `frontend`: `npm run typecheck`, `npm run lint` (Node 24.19.0, npm 12.0.2) | Pass |
| 2026-10-21 | `frontend`: `npm test` (Vitest 2.1.9) | Pass — 11 tests (client errors, CSV/i18n, shell boot, RTL switch, 404) |
| 2026-10-21 | `frontend`: `vite build` | Pass — index.js 443 kB (145 kB gzip) |
| 2026-10-21 | Browser (built-in, mock mode): shell en/ar, 375 px drawer | Pass — no horizontal scroll |
| 2026-10-21 | `python scripts/check_translations.py` (now also scans `frontend/src`) | Pass — 621/621 |
| — | `bench install-app` / `migrate` / `build` / `run-tests` | **Not run** — no bench available |

The README of the initial build also claims a Chromium smoke test against a mocked backend; that was not
repeated here.

## Known issues and risks (from code reading, unverified)
1. **Never run on Frappe.** Install, migrations, permission hooks, `count(name) as c` aggregate fields in
   `frappe.get_list`, PDF rendering and ERPNext sync are all untested. Expect fixes in E1.
2. `lands.save_land(create_project=1)` and `lands.create_project` call `create_project_for_land` without
   checking `enable_project_integration` (`sijil/api/lands.py`), unlike the auto-create path.
3. `cases.get_case` → `stats.documents` counts only documents linked to the case's **events**, not those
   linked to the case itself (`sijil/api/cases.py`).
4. Recording an event needs only **read** access to the case (`services/cases.add_event`) — deliberate per the
   code comment, awaiting owner confirmation (OD-7).
5. License: `license.txt`/`hooks.py` say MIT, not chosen by the owner (OD-1).
6. Arabic PDF needs a server font and patched wkhtmltopdf; unverified.
7. Cairo font is not bundled (system font fallback).

## Current work
Working branch: `improvements/sijil-v1` (all roadmap slices land here, one commit per slice). F1 done; F2–F8 authorized and in progress.

## Next proposed
F2 — dashboard and global search.
