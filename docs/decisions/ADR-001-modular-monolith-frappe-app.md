# ADR-001 — Modular monolith as one Frappe custom app

**Status:** Accepted · 2026-10-21

## Context
Sijil needs persistence, users, roles, record permissions, files, scheduling, reporting and PDF output, for
one company, maintained by a small team with coding agents. The company already runs Frappe/ERPNext.

## Decision
Build Sijil as **one Frappe v15 custom app** (`sijil`): DocTypes for the domain, services for workflows, thin
whitelisted API endpoints, and Frappe's auth, permissions, scheduler, files and printing. Business rules live
only in the backend. No microservices, no second backend framework, no changes to Frappe core.

## Alternatives
- Separate backend (Django/FastAPI/Node) + ERPNext API integration — duplicates auth, permissions and files;
  more to run.
- Microservices — no scale or team reason for them.

## Consequences
- \+ One deploy unit on an existing platform; Frappe provides most infrastructure.
- \+ Internal boundaries (`api` → `services` → controllers) keep it modular.
- − Tied to Frappe's upgrade cycle and conventions (v15 → v16 migration later).
- − Frappe's ORM and permission model shape the design (e.g. permission hooks).
