# ADR-002 — Require ERPNext and integrate with it

**Status:** Accepted by the owner · 2026-10-21

## Context
The original foundation prompt said "Frappe without ERPNext". The initial implementation instead declared
`required_apps = ["erpnext"]` and integrated with Project, Task, ToDo, Event, Notification Log, Supplier,
Customer, Contact and Company. The owner confirmed the company **runs ERPNext** and chose to keep the
integration. This ADR records that deliberate deviation from the prompt.

## Decision
Sijil requires ERPNext v15 on the same site. Integration points are individually switchable in Sijil
Settings ([architecture/erpnext-integration.md](../architecture/erpnext-integration.md)). Sijil never modifies
ERPNext DocTypes; it uses `doc_events` and dashboard overrides.

## Alternatives
- Standalone on plain Frappe (the prompt's original rule) — lighter install, but loses links to the company's
  real projects, suppliers, employees and tasks.
- Optional ERPNext (soft dependency) — most flexible, but every ERPNext link field and hook must become
  conditional; not worth it while the company has ERPNext. Can be revisited.

## Consequences
- \+ Cases and tasks connect to real ERPNext projects and parties; ERPNext users see Sijil records on Project,
  Task, Supplier and Customer.
- − Local and staging environments must install ERPNext (heavier).
- − Sijil must be installable on the production ERPNext site ([OD-2](../product/open-decisions.md)) and track
  ERPNext's version.
