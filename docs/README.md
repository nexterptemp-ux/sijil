# Documentation index

Each topic has one canonical document. Read only what your task needs.

## Status and planning
- [STATUS.md](STATUS.md) — what exists, what is verified, known issues. **Read first.**
- [ROADMAP.md](ROADMAP.md) — planned slices, dependencies, acceptance, authorization.

## Product (intended behaviour)
- [product/vision.md](product/vision.md) — problem, what Sijil is and is not.
- [product/requirements.md](product/requirements.md) — functional requirements R1–R11, MVP vs future.
- [product/user-roles.md](product/user-roles.md) — roles and responsibility.
- [product/workflows.md](product/workflows.md) — core workflows W1–W9 and the endpoint that owns each.
- [product/acceptance.md](product/acceptance.md) — acceptance criteria, incl. the Konooz Jeddah scenario (AC-01).
- [product/ux-principles.md](product/ux-principles.md) — UX, visual and RTL principles.
- [product/prototype-review.md](product/prototype-review.md) — analysis of the HTML prototype.
- [product/open-decisions.md](product/open-decisions.md) — questions waiting for the owner.

## Architecture (how it is built)
- [architecture/overview.md](architecture/overview.md) — system diagram, repository map, dependency rules.
- [architecture/backend.md](architecture/backend.md) — layers, services, controller invariants, install.
- [architecture/domain-model.md](architecture/domain-model.md) — entities, relations, derived fields, deletion.
- [architecture/api.md](architecture/api.md) — **API contract** used by the frontend.
- [architecture/security.md](architecture/security.md) — auth, CSRF, record permissions, private files.
- [architecture/documents.md](architecture/documents.md) — document identity, versions, links, folders.
- [architecture/erpnext-integration.md](architecture/erpnext-integration.md) — ERPNext touch points and flags.
- [architecture/jobs-and-reports.md](architecture/jobs-and-reports.md) — scheduler, reports, PDF.
- [architecture/frontend.md](architecture/frontend.md) — React target architecture; legacy SPA.
- [architecture/deployment.md](architecture/deployment.md) — staging/production.

## Decisions
- [decisions/](decisions/README.md) — ADR-001…ADR-008.

## Working on the code
- [development/setup.md](development/setup.md) — local environment (WSL2), edit loop.
- [testing/strategy.md](testing/strategy.md) — test layers and commands.
- Agent guide: [../CLAUDE.md](../CLAUDE.md); scoped rules: `../.claude/rules/`; skills: `../.claude/skills/`.
