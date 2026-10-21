# Architecture Decision Records

One file per decision: `ADR-NNN-short-title.md` with Status, Context, Decision, Alternatives, Consequences.
Statuses: **Proposed**, **Accepted**, **Superseded by ADR-NNN**. Never edit an accepted decision's meaning —
supersede it with a new ADR.

"Accepted (inherited)" = made by the initial implementation, consistent with the owner's requirements, kept
unless the owner objects.

| ADR | Decision | Status |
|---|---|---|
| [001](ADR-001-modular-monolith-frappe-app.md) | Modular monolith as one Frappe custom app; business rules in the backend | Accepted |
| [002](ADR-002-erpnext-dependency.md) | Require ERPNext and integrate with it | Accepted (owner, 2026-10-21) |
| [003](ADR-003-react-frontend.md) | Separate React + TypeScript frontend, replacing the Desk-page SPA | Accepted (owner, 2026-10-21) |
| [004](ADR-004-append-only-case-events.md) | Case Events are a first-class, append-only history | Accepted (inherited) |
| [005](ADR-005-separate-followups-and-tasks.md) | Follow-ups, tasks and events are separate; follow-up time states are derived | Accepted (inherited) |
| [006](ADR-006-document-identity-versions-links.md) | Document identity vs immutable versions vs pinned links | Accepted (inherited) |
| [007](ADR-007-land-scoped-permissions.md) | Land-scoped record permissions via Frappe hooks | Accepted (inherited) |
| [008](ADR-008-agent-context-architecture.md) | Claude Code context: CLAUDE.md + path rules + docs index + auto memory | Accepted |
