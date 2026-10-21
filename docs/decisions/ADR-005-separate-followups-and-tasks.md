# ADR-005 — Follow-ups, tasks and events are separate concepts

**Status:** Accepted (inherited) · 2026-10-21

## Context
"Something happened", "something must be checked on a date" and "a piece of work to do" behave differently:
different lifecycles, screens and reports.

## Decision
- **Case Event** = something that happened (append-only, ADR-004).
- **Follow Up** = an obligation to check, with due date and assignee; Open → Completed/Cancelled, never
  reopened. Completing it creates the result event and optionally the next follow-up in **one transaction**
  with a row lock. Upcoming / Due Today / Overdue are **derived** from the due date, not stored.
- **Task** = ordinary work, optionally on a land/case/event, with progress updates and optional ERPNext Task
  sync. Tasks never require a case.

## Alternatives
- One generic "activity" entity — blurs the questions the product must answer.
- A stored overdue status — needs a job to keep it right and can be wrong.

## Consequences
- \+ Clear UX and reports; no stale status.
- − Three similar-looking lists in the UI need consistent patterns.
