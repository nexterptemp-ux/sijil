# Sijil (سجل) — agent guide

Sijil is a Frappe **v15** custom app for a real-estate developer. It tracks lands and projects, the long-running
cases on each land (approvals, permits, consultants), every development recorded on a case, the follow-ups
and tasks they create, and a document library. It runs on the company's ERPNext site. Arabic (RTL) is a
primary language. It is an operations/case-follow-up tool, **not** an ERP, CRM, ticketing or Gantt tool.

## Read first, by task
Start at [docs/README.md](docs/README.md) (the index) and read only the documents for your task:

| Task | Read |
|---|---|
| Any change | [docs/STATUS.md](docs/STATUS.md) (what is real and verified), the relevant roadmap slice in [docs/ROADMAP.md](docs/ROADMAP.md) |
| Backend / DocTypes | [architecture/domain-model.md](docs/architecture/domain-model.md), [architecture/backend.md](docs/architecture/backend.md) |
| API or frontend data | [architecture/api.md](docs/architecture/api.md) (the API contract) |
| Permissions, files, security | [architecture/security.md](docs/architecture/security.md), [architecture/documents.md](docs/architecture/documents.md) |
| React frontend | [architecture/frontend.md](docs/architecture/frontend.md), [product/ux-principles.md](docs/product/ux-principles.md) |
| ERPNext sync | [architecture/erpnext-integration.md](docs/architecture/erpnext-integration.md) |
| Behaviour questions | [product/requirements.md](docs/product/requirements.md), [product/acceptance.md](docs/product/acceptance.md) |

Path-scoped rules in `.claude/rules/` load automatically for backend, frontend, API and test files.

## Sources of truth
- **Code** is the authority for what exists. **STATUS** for what is verified. **ROADMAP** for planned scope.
  **ADRs** (`docs/decisions/`) for accepted decisions. **Product docs** for intended behaviour.
- Auto memory is supplementary. If sources disagree, say so — never silently pick one.

## Invariants (never break)
1. **History is append-only.** Case Events are never edited or deleted; fixes are correction events
   (`corrects` / `superseded_by`). Document Versions are immutable. Completed follow-ups are not reopened.
2. **Business rules live in the backend** (`sijil/services/`, DocType controllers). The frontend never decides
   permissions, lifecycle or validity.
3. **Permissions are enforced server-side** by `sijil/permissions.py`. Hiding a button is not security.
   Documents are always **private** Files.
4. **Event ≠ follow-up ≠ task.** Event = what happened; follow-up = what must be checked next; task = ordinary work.
5. **Status ≠ current situation.** Both are separate fields on a case.
6. Multi-record user actions are **one transaction** (see `services/followups.complete_followup`).
7. Every user-facing string is translatable (`_()` / `__()` / frontend i18n) and has an Arabic entry.
8. Don't modify Frappe or ERPNext core. Use hooks and official APIs only.

## Workflow
1. Identify the task's domain, read only the docs above, then the relevant code. Use targeted search; don't
   crawl the repo.
2. Implement **only authorized scope**. A ROADMAP entry is not authorization; the owner's request is.
3. Verify with the commands in [docs/testing/strategy.md](docs/testing/strategy.md). Report exactly what ran,
   what passed, what failed and what could not run.
4. Update docs in the same change when behaviour changes: STATUS always, plus the one canonical doc for the
   topic (don't duplicate explanations across files). New architectural choice → new ADR.
5. Don't commit, push or open PRs unless asked. Never overwrite user work.

## Current state (keep short — details in STATUS)
- Backend: complete first implementation, **never run on a live Frappe site**.
- Frontend: **React + TypeScript** app in `frontend/`, served at `/sijil` (ADR-003). All screens built (F1–F8)
  but tested **only against the in-memory mock backend** (`npm run dev:mock`). The legacy Desk-page SPA
  (`/app/sijil-app`) stays until E1 passes — bug fixes only.
- Local environment (E1) and backend tests (E2): not done yet; the owner runs E1.
