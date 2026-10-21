# Prototype review — `design/reference/SIJIL_professional_demo.html` (unchanged)

## Strengths (kept)
- Case workspace: current situation card on top, development log as the main stream, follow-ups/tasks/files in a side column.
- Follow-up completion as one flow (record outcome → optionally schedule next).
- Clear dashboard "needs attention" ordering; RTL-first layout; document library tree + breadcrumbs.

## Deficiencies (addressed in the app)
- Data lives in browser `localStorage`: no sharing, permissions, audit or server pagination → real DocTypes, permissions, paged APIs.
- Brand name in the prototype ("مدار") differs from the spec (SIJIL) → the app uses SIJIL / سجل everywhere; prototype untouched.
- Events were editable/deletable → append-only events with correction events (`corrects` / `superseded_by`).
- Documents were plain attachments → logical Document + immutable Versions + Links pinned to a version.
- Hard-coded Arabic strings → `__()` + `ar.csv`; dates via `Intl`.
- No ERPNext linkage → Projects, Tasks, ToDo, Calendar, notifications, parties (see integrations).
- Fixed widths/physical CSS properties → logical properties and container queries (checked at 420px).
