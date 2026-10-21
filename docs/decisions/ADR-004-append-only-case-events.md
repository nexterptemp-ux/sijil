# ADR-004 — Case Events are a first-class, append-only history

**Status:** Accepted (inherited) · 2026-10-21

## Context
The core value is a trustworthy history of what happened on each case. Frappe comments/timeline are
unstructured, editable and mixed with system noise.

## Decision
A dedicated **Sijil Case Event** DocType. Events are insert-only: the controller throws on edit and delete.
A mistake is fixed with a **correction event** (`corrects` → old, mandatory `correction_reason`); the old one
becomes `Superseded` with `superseded_by`, stays visible, and its document links are copied. Current situation
and status change only through the latest event or explicit case edits; a back-dated event never overwrites
newer state. `event_date` (business) is distinct from `recorded_on` (system).

## Alternatives
- Frappe Comments / Version log — no structure, editable, not reportable.
- Editable events with a change log — history becomes "what it says now", which is harder to trust.

## Consequences
- \+ Reports and reviews reflect exactly what was recorded and when.
- − Users need a correction UI; data fixes require a correction, not an edit.
- − Admin data repair must use `frappe.db` deliberately.
