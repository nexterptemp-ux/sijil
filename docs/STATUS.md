# Status

Facts only: what exists, what was verified and how, what is known to be wrong. Update in the same change as
the code. Plans live in [ROADMAP.md](ROADMAP.md).

_Last updated: 2026-10-21 (F8 reports and settings — F1–F8 complete against the mock backend)._

## Summary
| Area | Implemented | Verified on a live Frappe site |
|---|---|---|
| Backend: 17 DocTypes, services, API, permissions, ERPNext integration, reminders, reports | Yes (initial build) | **No — never installed or run** |
| React frontend (`frontend/`) | F1–F8: every screen, served at `/sijil` (the only UI; the old Desk page was removed) | **No** — runs only against the in-memory mock backend |
| Tests | Frontend Vitest only; **no Frappe tests** | — |
| Local dev environment | **Not set up** (WSL Ubuntu 24.04 exists, stopped; no Docker) | — |
| Docs and agent config (P0) | Yes | Reviewed against the code |

## Implemented (unverified at runtime)
Everything in [product/requirements.md](product/requirements.md) R1–R9 has backend code (initial build)
and a React screen. None of it has run on Frappe, so treat each as *written, not working* until
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
| F8 reports + settings | Done: reports home (operational reports, case/land history pickers), report view (server columns, land/assignee/days filters in URL, links to records, cards on phones, CSV export with BOM), history report (backend HTML in a sandboxed frame, print, PDF download link), settings (integration switches for managers, read-only for users, sync open tasks, general settings, link to the classic Desk screen). Apps-screen tile now opens `/sijil`. Screens are lazy-loaded (initial JS 155 kB gzip). **Legacy SPA kept until E1** (owner decision) | Vitest (run report, history report + PDF link, manager toggle, read-only for users), browser (mock) 375 px ar |

### Visual polish (after F8)
Self-hosted Cairo font (bundled, no internet needed), refreshed design tokens, navy sidebar, header cards for
land and case pages, icon stat tiles, state-coloured follow-up/task rows, file-type chips, branded boot splash,
recursive folder counts, and a library root that lists all of the land's documents. The mock data is now Arabic
(with a few English records to keep mixed text tested). All 14 main pages verified at 375 px with no horizontal
scroll; 36 tests pass.

### Key documents
Every land's three key documents — Title Deed (صك الملكية), Organizational Sketch (الكروكي التنظيمي, new
document type), Approved Master Plan (المخطط المعتمد, new document type) — defined once in
`sijil/utils.py:KEY_DOCUMENT_TYPES`. `lands.list_lands` returns which exist per land; `lands.get_land` returns
the latest non-archived document of each (permission-aware). Land cards show have/missing chips and n/3; the land
page shows a "Key documents" card first in the side column, linked to each document or offering an upload with
the type pre-selected. Sidebar "Workspace" label removed. Verified: typecheck, lint, 36 tests, browser (mock).
**Backend not run on Frappe** (new Select options need `bench migrate`).

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
| 2026-10-21 | After F8: `npm run typecheck`, `npm run lint`, `npm test`, `vite build` | Pass — 36 tests in 11 files; initial JS 478 kB (155 kB gzip), one chunk per screen |
| 2026-10-21 | After F8: `python scripts/check_translations.py --unused` | Pass — 876 strings, 876 `ar.csv` entries, none unused |
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
8. **The React app has only met the mock backend.** The mock (`frontend/src/mocks`) follows
   `docs/architecture/api.md`, but the real endpoints may differ in details (field names, error messages,
   rows not returned because of permissions). Expect fixes when E1 connects it to a bench.
9. In `npm run dev` against a bench, CSRF needs `ignore_csrf` on the local site (see
   `docs/architecture/frontend.md`). Production gets the token from `sijil/www/sijil.html`.
10. `bench build --app sijil` running the root `package.json` build script, and the `/sijil` page itself
    (`sijil/www/sijil.py`, `website_route_rules`), are unverified on a bench.
11. ~~Legacy Desk-page SPA~~ removed 2026-10-22; Desk form buttons and the workspace shortcut open `/sijil/...`.
12. **Fixed 2026-10-22:** on the first server install the app crashed with React error #321 because the page
    loaded `index.js?v=…` while lazy chunks imported `index.js`, so React loaded twice. The build now uses hashed
    names + `.vite/manifest.json`, read by `sijil/www/sijil.py`. Verified with a production-style build served
    from `/assets/sijil/frontend/` (all screens, no failed requests).

## Current work
Working branch: `improvements/sijil-v1` (one commit per slice, not pushed). F1–F8 done.

## Next proposed
E1/E3 — verify on the server (install, migrate, build, demo data), then E2 backend tests.
