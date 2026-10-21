# Testing strategy

Principle: tests protect business invariants (see CLAUDE.md). No coverage-for-its-own-sake tests. A result is
recorded in [STATUS.md](../STATUS.md) only if the command actually ran.

## Layers
| Layer | Tool | Where | Covers |
|---|---|---|---|
| Static checks | `scripts/validate_doctypes.py`, `scripts/check_translations.py`, `python -m compileall` (a linter such as ruff is not configured yet) | repo | DocType JSON structure, translation coverage, syntax |
| Backend unit/integration | Frappe test runner (`FrappeTestCase`) | `sijil/sijil/doctype/*/test_*.py`, `sijil/tests/` | Controllers, services, transactions, permission hooks (as real non-admin users), reminder job, ERPNext sync |
| API contract | Frappe tests calling `sijil.api.*` | `sijil/tests/test_api_*.py` | Response shapes in [architecture/api.md](../architecture/api.md), error status codes |
| Frontend unit/component | Vitest + Testing Library | `frontend/src/**/*.test.ts(x)` | Hooks, components, form validation, i18n/RTL rendering; API mocked at the client boundary |
| Frontend workflows (mocked) | Vitest + MSW | `frontend/src/features/**` | Dialog flows (record event, complete follow-up, upload) against fixtures |
| End-to-end | Playwright | `frontend/e2e/` | AC-01 on a real bench, in `ar` and `en`, 1280 px and 420 px |
| Manual acceptance | Checklist | [product/acceptance.md](../product/acceptance.md) | Everything, on staging; Arabic PDF by eye |

## Commands
Available now (no bench needed):
```bash
python scripts/validate_doctypes.py
python scripts/check_translations.py
python -m compileall -q sijil
```

After F1 (in `frontend/`):
```bash
npm run typecheck
npm run lint
npm test
npm run build
```

After E1 (on the bench; tests need a dedicated test site with `allow_tests` enabled):
```bash
bench --site test_site set-config allow_tests true
bench --site test_site run-tests --app sijil
bench --site test_site run-tests --module sijil.tests.test_followups
```

## Must-have backend tests (E2)
Event edit/delete blocked · correction creates new event, supersedes old, copies links, refuses second
correction · back-dated event leaves newer situation alone · follow-up completion creates exactly one event and
one next follow-up, second completion fails · closed follow-up cannot reopen · version numbering and pinning,
`follow_latest` · same-land link rule · unlink from event is manager-only · delete guards (land, case, document,
folder) · restricted mode visibility per DocType · confidential documents · private file 403 · reminder job sends
once per day · ERPNext task sync both ways without loop · each integration flag off = no side effects.
