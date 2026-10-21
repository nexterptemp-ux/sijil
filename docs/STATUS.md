# Status

Facts only: what exists, what was verified and how, what is known to be wrong. Update in the same change as
the code. Plans live in [ROADMAP.md](ROADMAP.md).

_Last updated: 2026-10-21 (P0 foundation docs)._

## Summary
| Area | Implemented | Verified on a live Frappe site |
|---|---|---|
| Backend: 17 DocTypes, services, API, permissions, ERPNext integration, reminders, reports | Yes (initial build) | **No — never installed or run** |
| Legacy Desk-page SPA (`/app/sijil-app`) | Yes | Only against a mocked backend by the initial build (not reproducible here) |
| React frontend (`frontend/`) | **No** (F1 not started) | — |
| Tests | **None** (no Frappe tests, no frontend tests) | — |
| Local dev environment | **Not set up** (WSL Ubuntu 24.04 exists, stopped; no Docker) | — |
| Docs and agent config (P0) | Yes | Reviewed against the code |

## Implemented (unverified at runtime)
Everything in [product/requirements.md](product/requirements.md) R1–R9 has backend code and a legacy UI
screen, per the initial build. None of it has run on Frappe, so treat each as *written, not working* until
E1/E2/E3 prove otherwise.

## Verification log
| Date | Command / check | Result |
|---|---|---|
| 2026-10-21 | `python scripts/validate_doctypes.py` (Python 3.13.7, Windows) | Pass — 17 DocTypes checked |
| 2026-10-21 | `python scripts/check_translations.py` | Pass — 599 strings, 599 `ar.csv` entries |
| 2026-10-21 | `python -m compileall -q sijil` | Pass |
| 2026-10-21 | `node --check --input-type=module` on every legacy SPA module (Node 24.19.0) | Pass (syntax only) |
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
Working branch: `improvements/sijil-v1` (all roadmap slices land here). P0 done, not committed yet.

## Next proposed
F1 — React scaffold and app shell (needs owner authorization).
