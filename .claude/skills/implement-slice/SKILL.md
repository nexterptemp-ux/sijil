---
name: implement-slice
description: Implement one approved ROADMAP slice of Sijil end to end (backend, API contract, frontend, translations, tests, docs). Use when the owner asks to build or continue a roadmap slice such as "do slice F2" or "implement the cases list in React".
---

# Implement a roadmap slice

1. **Confirm scope.** Find the slice in `docs/ROADMAP.md`. If the owner has not authorized it in this
   conversation, stop and ask. Read its objective, scope, dependencies and acceptance criteria. Check
   `docs/STATUS.md` for what already exists and known issues in the area.
2. **Load only relevant context.** Use the task table in `CLAUDE.md`. Read the code you will change before
   changing it. Don't read the whole roadmap or every doc.
3. **Plan briefly**: files to touch, API contract changes, migrations, translation keys, tests. If a
   decision is consequential and not covered by product docs or ADRs, ask the owner.
4. **Implement in this order:** DocType/controller → service → API endpoint → `docs/architecture/api.md` +
   frontend types → UI → `ar.csv` / i18n strings → tests.
5. **Verify** with the commands in `docs/testing/strategy.md` that the environment supports. Never claim
   something ran if it didn't.
6. **Update docs in the same change:** `docs/STATUS.md` (what was done, what was verified and how, what
   wasn't), the slice's status in `docs/ROADMAP.md`, and the canonical doc for any behaviour change. Add an
   ADR for a new architectural decision.
7. **Report:** changes, verification results (ran / passed / failed / not run), open issues. Don't commit
   unless asked.
