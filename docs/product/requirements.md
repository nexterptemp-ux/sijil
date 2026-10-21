# Functional requirements

Tags: **MVP** = required for first production use. **Future** = planned, not committed.
Implementation state is tracked only in [STATUS.md](../STATUS.md), not here. Field-level detail lives in
[architecture/domain-model.md](../architecture/domain-model.md).

## R1 Lands and projects — MVP
- Many lands/projects with: stable ID, name, code, description, location/city, status
  (Active / On Hold / Completed / Archived), responsible employees, external organizations, notes,
  timestamps, optional ERPNext Company and Project.
- Each land has an overview: open/stale cases, open/overdue follow-ups, open tasks, documents, recent
  developments across its cases.
- Each land has its own document library, seeded from a configurable folder template.
- A land with cases, tasks, follow-ups or documents cannot be deleted — it is **archived**. No new cases on
  an archived land.

## R2 Cases — MVP
- A land holds many independent cases. Fields: title, reference no, land, type, status, priority, internal
  owner, external organization, optional external contact, start date, optional target date, description,
  relations to other cases (Related / Depends On / Blocks / Duplicate Of / Follows).
- **Status** (Not Started / In Progress / Awaiting Action / On Hold / Completed / Cancelled) and **current
  situation** (free narrative) are separate. Current situation is the most prominent element on the case page.
- Derived, read-only: last update date (latest event date), next follow-up date (earliest open follow-up).
- No mandatory workflow. Case types categorize only. Workflow templates are **Future**.
- A case with recorded events cannot be deleted; it is cancelled. A case cannot move to another land.

## R3 Case events (developments) — MVP
- First-class record, **not** Frappe comments/timeline. Fields: case, actual event date (+ optional time),
  system recorded-on timestamp, recorded-by, title, description, type, communication method, external
  organization, outcome, milestone flag, optional situation update, optional status change, source follow-up.
- Event date cannot be in the future (future actions are follow-ups).
- **Append-only.** Correction = a new event that `corrects` the old one with a mandatory reason; the old one
  is marked Superseded and stays visible. Linked documents carry over.
- A back-dated event never overwrites a newer situation/status.
- "No progress" is a valid, recorded development.

## R4 Follow-ups — MVP
- An obligation to check something. Fields: title, description, case and/or land, originating event,
  assignee, due date, priority, status (Open / Completed / Cancelled), completion date, outcome, result event,
  next follow-up, reminder lead days.
- Upcoming / Due Today / Overdue are **derived** from the due date, never stored.
- **Complete** = one transaction: record outcome → create a case event → optionally schedule the next
  follow-up → close. Safe against double-submit. A closed follow-up cannot be reopened.
- Reschedule and cancel (with reason) for open follow-ups.
- Reminders before/at/after due date (Frappe notification + optional email); ToDo and calendar entry for
  the assignee.

## R5 Tasks — MVP
- Ordinary work, independent of cases. Fields: title, description, assignee, optional land/case/event,
  status (Open / In Progress / Completed / Cancelled), priority, start/due dates, completion date and notes,
  progress updates log, documents.
- Dedicated Tasks section; also shown on land and case pages.
- Optional two-way sync with an ERPNext Task when the land has a Project.

## R6 Document library — MVP
- Per-land nested folders: create, rename, move, delete (empty only), breadcrumbs, browse, search, filter by
  type, recursive search.
- A document has its own identity (title, type, reference no, date, description, confidential, archived) and
  one or more **immutable versions** (file). New upload = new version.
- One document links to many records (land, case, event, task, follow-up) **without copying the file**.
  A link pins a version (default) or follows the latest. A historical event keeps showing the exact version
  it referenced.
- Links only within the same land. Unlinking from an event is manager-only. A linked document cannot be
  deleted — it is archived.
- Files are private; access is permission-checked on every download.
- Full-text search inside files, OCR, previews: **Future**.

## R7 Dashboard — MVP
Actionable, not chart-heavy: active lands, open cases, awaiting action, overdue / due today / upcoming
follow-ups, open and overdue tasks, stale cases (no update for N days, configurable), "needs attention"
list, recent developments, recent documents. Every item navigates to the record.

## R8 Reports — MVP
- **Case history** (HTML + PDF): case details, current situation/status, responsible parties, events by actual
  date with recorded-by and document references, follow-up history, outstanding actions, generation date.
- **Land history** (HTML + PDF): developments across all cases of a land.
- **Operational:** overdue follow-ups, upcoming follow-ups, open cases by employee, case status by
  project, outstanding tasks, stale cases.
- Arabic PDF output must be verified explicitly (shaping, RTL, numerals, page breaks).

## R9 Administration — MVP (basic), Future (rich)
- Settings: stale-case days, default reminder days, restricted mode, folder template, integration toggles,
  default company.
- In-app integrations screen showing each ERPNext integration's status.
- User management uses Frappe/ERPNext users and roles. A dedicated admin UX is **Future**.

## R10 Language and UX — MVP
English and Arabic, full RTL. See [ux-principles.md](ux-principles.md).

## R11 Scale — MVP
Comfortable with hundreds of lands, thousands of cases, years of events, thousands of tasks/follow-ups,
large libraries: server-side pagination everywhere, no loading full histories into the browser.

## MVP scope summary
R1–R8 plus the basic part of R9 and R10–R11, delivered through the **React frontend** (ADR-003), verified on a
staging ERPNext site. Everything tagged Future, plus anything in [open-decisions.md](open-decisions.md), is
outside the MVP until the owner decides.
