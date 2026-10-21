---
paths:
  - "frontend/**"
  - "sijil/public/js/**"
  - "sijil/public/css/**"
---

# Frontend rules

**Target:** React + TypeScript (strict) + Vite + Tailwind + shadcn/ui + TanStack Query + React Router, in
`frontend/` (ADR-003, [docs/architecture/frontend.md](../../docs/architecture/frontend.md)).
`sijil/public/js/sijil/` is the **legacy** Desk-page SPA: fix bugs only, no new features; it is removed when
its screens are ported.

- Feature folders (`src/features/<area>/`) own their pages, components, hooks, API calls and types. Shared UI
  goes in `src/components/` only when two features really use it. Create folders when code needs them.
- **Server state lives in TanStack Query.** No global store mirroring server data. Local UI state (open
  modal, filters) stays in components or the URL.
- All backend calls go through the typed client in `src/lib/api/` against the contract in
  [docs/architecture/api.md](../../docs/architecture/api.md). No direct `fetch` in components; no Frappe
  Desk globals (`frappe.*`, `cur_frm`).
- The frontend never makes permission or lifecycle decisions. It shows `can_write` / `can_create` flags the
  API returns and handles 403s gracefully.
- **RTL first:** logical CSS only (`ms-`/`me-`/`ps-`/`pe-`, `start`/`end`, `inline-start`), no
  `left`/`right`. Mirror directional icons. Test every screen in `ar` and `en`.
- **i18n:** no hard-coded UI strings. Use the i18n helper; keys are the English source strings so Frappe's
  `ar.csv` can be reused. Format dates/numbers with `Intl`.
- Every data view has loading, empty and error states. Lists are server-paginated (`start`/`page_length`).
- Accessibility: real buttons/labels, focus management in dialogs, keyboard navigation.
- Never render API text as HTML (`dangerouslySetInnerHTML`) except sanitized rich-text fields.
- Visual direction: `design/reference/SIJIL_professional_demo.html` (do not edit it) and
  [docs/product/ux-principles.md](../../docs/product/ux-principles.md).
