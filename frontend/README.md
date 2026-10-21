# Sijil frontend

React + TypeScript app served by Frappe at `/sijil`. Architecture: [docs/architecture/frontend.md](../docs/architecture/frontend.md).
API contract: [docs/architecture/api.md](../docs/architecture/api.md).

```bash
npm install          # once
npm run dev:mock     # http://localhost:8080/sijil/ with the in-memory mock backend (no Frappe needed)
npm run dev          # http://localhost:8080/sijil/ proxied to the bench (SIJIL_BENCH_URL, see .env.example)
npm run typecheck
npm run lint
npm test
npm run build        # -> ../sijil/public/frontend (served as /assets/sijil/frontend/)
```

Translations: write UI text as `t("English text")`; add the Arabic to `../sijil/translations/ar.csv` and run
`python ../scripts/check_translations.py`.
