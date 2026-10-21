# Product vision

**Sijil (سجل)** — real-estate operations, case follow-up, task and document management.

## Problem
A real-estate developer runs dozens of lands and projects. Each land carries long-running *transactions*
with external parties — master-plan approval, municipality approval, organizational sketch, building permit,
subdivision, utility connections, consultant coordination, government correspondence. They last weeks to
years. Today their history lives in people's heads, phone calls, WhatsApp and scattered PDFs. When a manager
asks "what happened with X?", someone has to reconstruct it by hand.

## What Sijil is
An **operations and case-follow-up system**. For any land, anyone authorized can answer immediately:

1. Which lands and projects are managed?
2. Which cases exist on each land?
3. What is the current situation of each case?
4. What happened historically?
5. What is still outstanding?
6. What is the next required action?
7. Who is responsible for following up?
8. When is the next follow-up?
9. Which documents support each development?
10. What is overdue?
11. What is happening across all lands?
12. Can management get a complete historical report?

These questions drive both architecture and UX.

## What Sijil is not
Not an ERP, accounting system, Primavera/Gantt scheduler, CRM, Kanban board, ticketing system, or a DMS
with tasks bolted on. It **sits next to ERPNext** on the same site and links to ERPNext data (projects,
suppliers, employees) instead of duplicating it — see [ADR-002](../decisions/ADR-002-erpnext-dependency.md).

## Users
Real-estate developers, project controls and development teams, land-development departments,
government-relations/administrative staff, project and department managers, executives, and the employees
who follow up with external organizations. See [user-roles.md](user-roles.md).

## Scope of deployment
One company, one ERPNext site. No multi-tenant SaaS. Nothing in the design should block a second company
later (ERPNext `Company` is already linkable on a land).

## Canonical scenario
Konooz Jeddah → Master Plan Approval, followed weekly with an engineering consultancy until formal approval.
See [acceptance.md](acceptance.md#ac-01--konooz-jeddah-master-plan-approval-canonical).
