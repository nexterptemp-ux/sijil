# Roadmap

Planned work, in order. **Being on this list is not authorization** — a slice is built only when the owner
asks for it. What is actually done and verified lives in [STATUS.md](STATUS.md).

Order chosen by the owner (2026-10-21): foundation docs → React scaffold → port screens → run locally.
**Risk of this order:** the backend has never run, so F1–F8 are built against a mocked API that follows
[architecture/api.md](architecture/api.md). Expect fixes in both the backend and frontend during E1.

Authorization column: **Done**, **Authorized** (owner asked, in progress), **Not authorized**.

| ID | Slice | Depends on | Authorization |
|---|---|---|---|
| P0 | Foundation: docs, agent config, repo config | — | Done |
| F1 | React scaffold and app shell | P0 | Done |
| F2 | Dashboard and global search | F1 | Done |
| F3 | Lands list and land page | F1 | Authorized (2026-10-21) |
| F4 | Cases list and case workspace (history, record, correct, situation) | F3 | Done |
| F5 | Follow-ups centre and completion flow | F4 | Authorized (2026-10-21) |
| F6 | Tasks | F3 | Authorized (2026-10-21) |
| F7 | Document library, upload, versions, linking | F3, F4 | Authorized (2026-10-21) |
| F8 | Reports, integrations and settings screens (legacy SPA removal after E1) | F2–F7 | Authorized (2026-10-21) |
| E1 | Local environment (WSL bench) and first live run | P0 (can move earlier) | Not authorized |
| E2 | Backend tests for invariants and permissions | E1 | Not authorized |
| E3 | Staging acceptance (AC-01…AC-07), Arabic PDF | E1, E2, F8 | Not authorized |
| P9 | Production readiness | E3 | Not authorized |

---

## P0 — Foundation (Done)
- **Objective:** make the repo navigable and governable for humans and agents.
- **Scope:** `CLAUDE.md`, `.claude/rules`, `.claude/skills`, `docs/` (index, product, architecture, ADRs,
  development, testing, roadmap, status), `.gitignore`, `.editorconfig`, `.gitattributes`.
- **Acceptance:** every doc reflects the actual code; no invented features; open decisions listed.
- **Verification:** doc review; existing scripts still pass.

## F1 — React scaffold and app shell
- **Objective:** a working React app served by Frappe at `/sijil`, with nothing ported yet.
- **Scope:** `frontend/` with Vite, strict TS, Tailwind (RTL/logical), shadcn/ui base, React Router,
  TanStack Query, typed API client (`call`, `upload`, error mapping, `Page<T>`), i18n bridge to `ar.csv`,
  `<html dir>` switching, app shell (sidebar, top bar, routes, error boundary, 404), ESLint + Prettier,
  Vitest. Build output into `sijil/public/frontend`, `www/sijil.html`, `website_route_rules`, Vite dev proxy.
  An in-memory mock backend (`src/mocks`) implementing `api.md` for development and tests without a bench.
- **Acceptance:** `npm run build`, `npm run typecheck`, `npm run lint`, `npm test` pass; the shell renders in
  `ar` (RTL) and `en` with mock data; no hard-coded strings.
- **Verification:** commands above + browser check of the shell at 1280 px and 420 px.

## F2 — Dashboard and global search
- **Scope:** `meta.bootstrap`, `dashboard.get_dashboard`, `meta.search`, `followups.followup_counts` (nav
  badge). Needs-attention list, counts, recent developments/documents, stale cases, navigation to records.
- **Acceptance:** R7 in requirements; all items link to their record; loading/empty/error states.

## F3 — Lands
- **Scope:** `lands.list_lands` (search, status, paging), `get_land`, `land_activity`, `save_land` (create/edit
  dialog incl. responsibles, organizations, create project), land page with cases/follow-ups/tasks/documents
  summaries.
- **Acceptance:** R1; managers can create/edit, users see read-only; paging works with 100+ lands (mock).

## F4 — Cases and case workspace
- **Scope:** `cases.list_cases` (filters, orders, stale), `get_case`, `list_events` (paged history),
  `save_case`, `record_event`, `correct_event`, `update_situation`. Case page per UX principles: situation on
  top, next action, history stream with milestones/corrections/documents, side column.
- **Acceptance:** R2, R3; AC-01 steps 1–2 and AC-02 against mocks; correction UI requires a reason and shows
  Superseded entries.

## F5 — Follow-ups
- **Scope:** `list_followups` (scopes), `save_followup`, `complete` (outcome → event → next follow-up dialog),
  `reschedule`, `cancel`; from case page and follow-ups centre.
- **Acceptance:** R4; AC-01 steps 3–4 against mocks; double click sends one request (button disabled while
  pending) — server-side safety is verified in E2.

## F6 — Tasks
- **Scope:** `list_tasks`, `task_counts`, `get_task`, `save_task`, `set_status`, `add_update`.
- **Acceptance:** R5; tasks without a case are first-class.

## F7 — Document library
- **Scope:** `library` (tree, breadcrumbs, paging, search, recursive), `get_document`, `update_document`,
  folder create/rename/move/delete, `upload_document`, `upload_version`, `link_document`, `unlink_document`,
  `search_documents` picker, attach-existing in event and follow-up dialogs.
- **Acceptance:** R6; AC-03 against mocks (pinned version, newer-version hint).

## F8 — Reports, integrations, settings
- **Scope:** `reports.available/run`, history HTML preview and PDF download, integrations screen,
  `set_integration`, `link_pending_tasks`; point the apps-screen tile to `/sijil`. **Deleting the legacy SPA
  (`sijil/public/js/sijil/`, the `sijil-app` Page and its CSS) is deferred until E1 passes** (owner, 2026-10-21).
- **Acceptance:** R8, R9; no references to the legacy SPA remain; translation check covers `frontend/src`.

## E1 — Local environment and first live run
- **Objective:** run Sijil on a real Frappe/ERPNext v15 bench (WSL2 Ubuntu 24.04 on the owner's PC).
- **Scope:** follow [development/setup.md](development/setup.md); install, migrate, build, demo data; fix every
  install/migrate/runtime error; connect the React dev server to the bench; walk every screen.
- **Acceptance:** `install-app`, `migrate`, `build` succeed; demo data loads; each screen works against the
  real API in `ar` and `en`.
- **Verification:** record every command and result in STATUS.

## E2 — Backend tests
- **Scope:** Frappe tests for: event immutability and correction, back-dated events, follow-up completion
  transaction and double-submit, version pinning, same-land links, delete guards, restricted mode and
  confidential documents as real users, private file 403, reminder job, ERPNext task sync loop guard.
- **Acceptance:** `bench --site test_site run-tests --app sijil` passes; each invariant in CLAUDE.md has a test.

## E3 — Staging acceptance
- **Scope:** install on a staging copy of the company ERPNext site; run AC-01…AC-07 by hand; Arabic PDF check;
  Playwright end-to-end for AC-01.
- **Acceptance:** all AC pass and are recorded in STATUS with date and tester.

## P9 — Production readiness
- **Scope:** security review, backup/restore drill including private files, monitoring, deployment runbook,
  data migration (OD-10), user acceptance, training material.
- **Acceptance:** owner sign-off.

## Later (not planned in detail)
Workflow templates per case type, Sijil Viewer role (OD-4), per-document access lists (OD-5), full-text
document search/previews/OCR, WhatsApp/SMS reminders (OD-8), richer admin UX, Frappe v16 upgrade.
