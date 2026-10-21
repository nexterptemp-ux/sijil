---
name: review-slice
description: Critically review implemented Sijil work against its roadmap slice, the architecture invariants and the real code, then correct docs/STATUS.md. Use when the owner asks to review, audit or check a slice, a feature, or whether STATUS is accurate.
---

# Review a slice and update STATUS

1. Identify what is being reviewed (slice ID, feature, or branch diff via `git diff main...HEAD`).
2. Check the code against:
   - the slice's acceptance criteria in `docs/ROADMAP.md`;
   - the invariants in `CLAUDE.md` (append-only history, backend authority, server-side permissions,
     private files, transactions, translations);
   - the API contract in `docs/architecture/api.md` (do frontend types and backend responses match?).
3. Look specifically for: endpoints without a permission check, `ignore_permissions` on a user's primary
   action, `frappe.db.get_all` returning data the user may not see, missing `ar.csv` entries, physical CSS
   (`left`/`right`), unhandled loading/error states, missing tests for an invariant.
4. Run the verification commands that are available. Record exact results.
5. Update `docs/STATUS.md`: move items between "verified" and "implemented, not verified", add found issues
   with file:line. Don't mark anything verified that wasn't actually exercised.
6. Report findings ranked by severity. Fix only if the owner asks.
