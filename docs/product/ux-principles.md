# UX principles

Visual and interaction reference: `design/reference/SIJIL_professional_demo.html` (kept unchanged; analysis
in [prototype-review.md](prototype-review.md)). It covers about 80% of the intended UX; it is not a business
specification.

## Not ERP-like
Avoid Frappe Desk/ERPNext forms, long two-column admin forms, tables everywhere, tab overload, chatter as
history, tiny attachment areas, deep navigation, and exposing database concepts (DocType names, IDs as
primary labels, "Link" fields).

## Task-oriented screens
The **case page** puts, in this order of prominence:
1. Current situation (large, at the top, with when/who last updated it).
2. Next required action (next follow-up, due state, assignee).
3. Responsible person and external organization.
4. Outstanding work (open follow-ups and tasks).
5. The development history — chronological, readable, with milestones, corrections and documents inline.
6. Documents. 7. Related tasks and follow-ups.

Metadata (reference no, dates, type, relations) is available but secondary — progressive disclosure.
Focused modals/drawers for record development, complete follow-up, upload, link; full pages only for
records you work *in* (dashboard, land, case, library).

## Visual design
Professional enterprise SaaS: clean layout, generous whitespace, clear hierarchy, refined typography,
consistent spacing scale, subtle borders/shadows, restrained colour used for meaning (status, overdue,
milestone), professional line icons. No gradients-everywhere, no wall of colourful cards, no oversized
controls. Dashboard = actionable lists with direct navigation, not chart walls.

## Arabic and RTL
- RTL is the default reading direction; English (LTR) must work equally.
- Logical layout only (start/end), mirrored directional icons, correct mixed Arabic/English text
  (`dir="auto"` on user content), Arabic-appropriate font (Cairo or system fallback), locale dates and numbers.
- Correct behaviour of modals, dropdowns, date pickers and toasts in RTL.
- Stable English technical identifiers; Arabic only in presentation (translations).

## Performance feel
Paged lists and histories ("load more" / pagination), cached server data, optimistic only where safe,
instant navigation between already-loaded screens. Never load a full history or library into the browser.

## Consistency
Every list/detail has loading, empty and error states. Same patterns for status pills, priority, due state
and people everywhere. Confirmations only for irreversible actions.
