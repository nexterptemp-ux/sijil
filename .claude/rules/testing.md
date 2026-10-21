---
paths:
  - "**/test_*.py"
  - "**/tests/**"
  - "frontend/**/*.test.ts"
  - "frontend/**/*.test.tsx"
  - "frontend/e2e/**"
  - "scripts/**"
---

# Testing rules

See [docs/testing/strategy.md](../../docs/testing/strategy.md) for layers and commands.

- Test business invariants, not getters: event immutability and corrections, follow-up completion
  (one event, one next follow-up, double-submit safe), document version pinning, same-land link rule,
  restricted-mode visibility, confidential documents, private file access, delete guards.
- Backend tests are Frappe tests (`FrappeTestCase`, `bench --site <test-site> run-tests --app sijil`), next
  to the DocType (`test_<doctype>.py`) or in `sijil/tests/` for cross-cutting workflows.
- Permission tests run as a real non-admin user (`frappe.set_user`), never as Administrator.
- Frontend: Vitest + Testing Library for components/hooks; mock the API at the client boundary using
  fixtures that match `docs/architecture/api.md`. Playwright for end-to-end flows, run in `ar` and `en`.
- Never report a test as passing unless it ran. Record runs and results in `docs/STATUS.md`.
