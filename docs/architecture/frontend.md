# Frontend architecture

Decision: [ADR-003](../decisions/ADR-003-react-frontend.md). Status: **planned** — `frontend/` does not exist
yet; the legacy SPA below is what runs today.

## Target stack
React 18 + TypeScript (strict) + Vite, Tailwind CSS (logical properties, RTL), shadcn/ui (Radix) components,
TanStack Query for server state, React Router for routing, react-hook-form + zod for forms, an i18n layer
fed by Frappe translations, Vitest + Testing Library, Playwright for end-to-end.
Exact versions are pinned when the scaffold is created (roadmap F1).

## Layout (to be created in F1 — folders appear only when they have code)
```
frontend/
  index.html  vite.config.ts  tsconfig.json  package.json
  src/
    main.tsx                 bootstrap: QueryClient, Router, i18n, direction
    app/                     shell (sidebar, top bar, global search), routes, providers, error boundary
    features/
      dashboard/ lands/ cases/ case-events/ followups/ tasks/ documents/ reports/ administration/
                             each: pages, components, hooks (useX queries/mutations), api.ts, types.ts
    components/ui/           shadcn components (generated, owned by us)
    components/              genuinely shared app components (StatusPill, PersonChip, DueState, Empty…)
    lib/api/                 typed client: call(), upload(), error mapping, Page<T>
    lib/                     dates (Intl), formatting, utils
    i18n/                    translator, language/direction switch
    styles/                  Tailwind entry, design tokens (CSS variables)
```

## Serving and build
`vite build` outputs into the app's `sijil/public/frontend/` (git-ignored), served by Frappe as
`/assets/sijil/frontend/…`. A `sijil/www/sijil.html` page (generated from Vite's `index.html` at build time)
serves the SPA at **`/sijil`** with Frappe's boot data (CSRF token, user, language). A `website_route_rules`
entry in `hooks.py` sends `/sijil/<path>` to the same page so client-side routes deep-link. This is the
pattern Frappe's own SPAs (CRM, Helpdesk) use.

Development: `vite dev` on port 8080 proxies `/api`, `/assets`, `/files`, `/private` to the bench
(`http://<site>:8000`), so the session cookie works on one origin.

## Auth and CSRF
Unauthenticated → redirect to `/login?redirect-to=/sijil/...`. The CSRF token comes from the served page
(`window.csrf_token`); in Vite dev mode it is read from a lightweight endpoint or the boot data. Every POST
sends `X-Frappe-CSRF-Token`. No tokens are stored in `localStorage`.

## Data
- One API client (`lib/api`) maps to [api.md](api.md); types live next to each feature's `api.ts`.
- Queries keyed by `[area, id, params]`; mutations invalidate the affected keys (e.g. completing a follow-up
  invalidates the case, its events, follow-up lists and dashboard counts).
- Lists use `start`/`page_length` (infinite queries for histories, pages for tables).
- Error mapping: 403 → "no access" state, 417 → show the server message, network/500 → retry state.

## i18n
English source strings are the keys (same as Frappe `__()`), so `sijil/translations/ar.csv` stays the single
translation file. The app loads the translation dictionary for the user's language at boot, sets
`<html lang dir>`, and uses `Intl.DateTimeFormat`/`NumberFormat`. `scripts/check_translations.py` must be
extended to scan `frontend/src`.

## Legacy SPA
`sijil/public/js/sijil/` (core, ui, components, forms, app, `views/*`) bundled as `sijil.bundle.js` and
mounted in the Desk page `sijil-app` (`/app/sijil-app`). Plain ES modules rendering HTML strings, using
`frappe.xcall`. It stays working until each screen is ported (roadmap F2–F7), then it is deleted with its
Page and CSS (F8). Bug fixes only.
