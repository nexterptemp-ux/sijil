# Frontend architecture

Decision: [ADR-003](../decisions/ADR-003-react-frontend.md). Code: `frontend/`. Commands: [frontend/README.md](../../frontend/README.md).

## Stack
React 18, TypeScript (strict, `noUncheckedIndexedAccess`), Vite 5, Tailwind CSS 3 (logical properties, RTL),
shadcn-style components on Radix primitives (written in `src/components/ui`, no CLI), TanStack Query 5 for
server state, React Router 6, react-hook-form + zod for forms, sonner for toasts, DOMPurify for rich text,
lucide icons, Vitest + Testing Library. Exact versions: `frontend/package-lock.json`.

## Layout
```
frontend/
  index.html  vite.config.ts  tailwind.config.ts  eslint.config.js  package.json
  src/
    main.tsx            QueryClient, router, mock backend in --mode mock
    app/                boot (meta.bootstrap + language), AppShell (sidebar, top bar), nav, routes
    features/<area>/    api.ts (calls + query keys + types), pages and feature components
    components/ui/      primitives: button, input/select/textarea, dialog, menu/popover, card/badge/tabs
    components/         shared app components: states, status badges, fields (lookup/user pickers),
                        common (page header, pager, search, avatar, rich text), ConfirmDialog
    lib/api/            client (call, upload, ApiError, transport), shared types, meta API, mutation hook
    lib/                format (Intl dates/numbers), hooks (debounce, URL state), utils
    i18n/               t()/tv(), CSV parser, language + direction
    mocks/              in-memory backend implementing sijil.api.* (dev and tests only)
    test/               test setup and renderApp() helper
```

## Serving and build
- `npm run build` → `sijil/public/frontend/` (git-ignored), served by Frappe as `/assets/sijil/frontend/`.
  Entry files have stable names (`assets/index.js`, `assets/index.css`); chunks are hashed.
- `sijil/www/sijil.html` + `sijil.py` (tracked) serve the SPA at **`/sijil`**: redirect guests to login, check
  app access, render the CSRF token, set `<html lang dir>` from the user's language, add a cache-busting
  version (file mtime). `website_route_rules` in `hooks.py` maps `/sijil/<path>` to the same page so deep
  links work. This is the pattern Frappe's own SPAs (CRM, Helpdesk) use.
- `bench build --app sijil` runs the root `package.json` `build` script (`cd frontend && npm ci && npm run
  build`). **Unverified on a bench** (E1).
- React Router basename is `/sijil`. In dev, Vite serves under `/sijil/` too.

## Development modes
- **Mock** (`npm run dev:mock`, http://localhost:8080/sijil/): no Frappe needed. `src/mocks` replaces the
  transport with an in-memory backend seeded with the Konooz Jeddah scenario and more. Never in the
  production bundle (dynamic import behind `MODE === "mock"`).
- **Against a bench** (`npm run dev`): Vite proxies `/api`, `/assets`, `/files`, `/private`, `/login`, `/app`
  to `SIJIL_BENCH_URL` (default `http://sijil.localhost:8000`). Log in through the proxied `/login`. The page
  is not rendered by Frappe in this mode, so there is no CSRF token: set
  `bench --site sijil.localhost set-config ignore_csrf 1` on the **local** site only.

## Auth and CSRF
Session cookie, same origin. `window.csrf_token` comes from the served page; every POST sends
`X-Frappe-CSRF-Token`. A 403 on boot (expired session / no access) sends the user to `/login`. Nothing is
stored in `localStorage` except the optional language override (`sijil.lang`).

## Data
- All calls go through `lib/api/client.ts` (`call`, `upload`); responses follow [api.md](api.md).
- Each feature's `api.ts` holds its calls, query keys and response types.
- Mutations use `useApiMutation` (error toast, success toast, invalidate keys).
- Lists are server-paginated (`start`/`page_length`); filters live in the URL (`useUrlState`).
- Errors: `ApiError` with status and translated server message; 403 → "no access" state, 404 → "not found",
  others → message + retry.

## i18n and RTL
English source strings are the keys, exactly like Frappe's `__()`, so `sijil/translations/ar.csv` is the
single translation file for the backend and the React app. `t("...", ...args)` translates and fills `{0}`
placeholders; `tv(value)` translates data values (statuses, types). The Arabic CSV is bundled as a lazy chunk.
Language = user's Frappe language, overridable with the top-bar toggle. `<html dir>` switches; layout uses
logical utilities (`ms-/me-/ps-/pe-/start-/end-`), directional icons flip. `scripts/check_translations.py`
scans `frontend/src` for `t("...")`.

## Themes and logos
Two colour themes, **Evergreen** (default) and **Navy**, defined as CSS variables in `src/styles/index.css`
(`:root[data-theme=...]`). `src/app/theme.ts` keeps the choice in `localStorage` (`sijil.theme`) and sets
`<html data-theme>` before the first paint; users switch it from the user menu. Logos live in
`src/assets/brand/<theme>/` with the same names in each folder: `logo.svg` (dark text, light backgrounds),
`logo-light.svg` (light text, sidebar), `mark.svg` (icon only). `components/Logo.tsx` picks the file for the
active theme. `sijil/public/images/sijil-logo.svg` (Evergreen mark) is the fixed browser/apps-screen icon.
Status colours (overdue, warning, done) are shared by both themes.

## Mobile
Every screen must work at 375 px: the sidebar becomes a slide-in drawer under `lg`, lists render as cards
on small screens, dialogs are full-width with scrollable bodies, no horizontal page scroll.

## Legacy SPA
`sijil/public/js/sijil/` bundled as `sijil.bundle.js`, mounted in the Desk page `sijil-app`
(`/app/sijil-app`). It stays until the React app is verified against a real bench (owner decision: delete
after E1). Bug fixes only.
