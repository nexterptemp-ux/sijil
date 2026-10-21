# ADR-003 — Separate React + TypeScript frontend

**Status:** Accepted by the owner · 2026-10-21

## Context
The initial implementation's UI is plain-JS ES modules rendering HTML strings inside a Frappe Desk page
(`/app/sijil-app`). The owner wants a polished, non-ERP experience that grows over many slices and is
maintained with coding agents. The backend already exposes purpose-specific endpoints (`sijil/api`).

## Decision
Build a separate SPA in `frontend/` with React, strict TypeScript, Vite, Tailwind, shadcn/ui, TanStack Query
and React Router. It is served by the same Frappe site at `/sijil` (same origin, session cookie, CSRF) and
talks only to `sijil.api.*`. Screens are ported one by one; the legacy Desk-page SPA is removed once all are
ported. Details: [architecture/frontend.md](../architecture/frontend.md).

## Alternatives
- Keep the Desk-page SPA — no build step, but inherits Desk chrome/CSS, has no types, renders HTML strings
  (XSS-prone) and is coupled to Desk internals.
- Vue 3 + frappe-ui (Frappe's choice for CRM/Helpdesk) — more Frappe-native, but the owner's spec names React
  and shadcn/ui, and React has the larger ecosystem.

## Consequences
- \+ Typed contracts, component tests, full control of layout and RTL, decoupled from Desk upgrades.
- − A Node build pipeline and a second set of conventions; translations must be bridged from Frappe.
- − Until porting finishes, two UIs exist (the legacy one gets bug fixes only).
