# Acceptance criteria

A slice is accepted only when its criteria are exercised on a running site (see
[testing/strategy.md](../testing/strategy.md)). Unit tests alone are not acceptance.

## AC-01 — Konooz Jeddah: Master Plan Approval (canonical)
`bench --site <site> execute sijil.install.make_demo_data` seeds the start of this scenario, but it must also be
performed by hand through the UI.

**Setup.** Land *Konooz Jeddah (كنوز جدة)* with a development engineer as responsible. External organization:
an engineering consultancy. Case *Master Plan Approval (اعتماد المخطط)*, owner = the engineer, status In
Progress.

1. **Week 1.** The engineer records a development: "Technical review completed; submitted for approval",
   with the actual date, communication method Phone, a situation update.
   - The event shows actual date, recorded-on timestamp, recorded-by, title, description, method.
   - The case's current situation shows the new text; last update = event date.
2. **Week 2.** New development: "At the Secretary/Mayor's office awaiting signature".
   - Week 1's event is still there, unchanged. History is newest-first by actual date.
3. **Week 3 (milestone).** Development "Secretary/Mayor's signature obtained", marked milestone, with the signed
   PDF uploaded **into the land library** (folder *Government Approvals / Secretary - Mayor Signature*) and
   linked to the event.
   - The file exists once (one Document, one Version). It appears in the library, on the event and in the
     case's documents.
   - The engineer creates a follow-up "Follow up on obtaining the formal approval", assigned to themself, due
     next week. The case shows it as the next follow-up; the engineer gets a ToDo/calendar entry and, on the
     due day, a reminder.
4. **Week 4 (no progress).** The engineer completes the follow-up with outcome "Approval not issued yet" and
   schedules the next follow-up for the following week.
   - Exactly one new event (type Contact, outcome recorded, source follow-up set) and exactly one new
     follow-up, even if "Complete" is clicked twice.
   - The old follow-up is Completed with its outcome and links to the event and the next follow-up.
5. **Three months later.** A manager opens the case and sees without searching: current situation, status,
   owner, external organization, latest development, next follow-up, outstanding tasks, documents, and the
   complete chronological history.
6. The manager downloads the **case history PDF in Arabic**: correct shaping and RTL, every event with date,
   recorded-by and document references, follow-up history, outstanding actions, generation date.

## AC-02 — History integrity
- Editing or deleting a Case Event via UI, API or Desk fails with "History is preserved".
- Correcting an event requires a reason; the original shows as Superseded with a link to its correction;
  a second correction of the same original is refused.
- A back-dated event does not overwrite a newer current situation or status.
- A case with events cannot be deleted; a land with cases/tasks/follow-ups/documents cannot be deleted.

## AC-03 — Documents
- Uploading a new version of the Week-3 PDF leaves the Week-3 event pointing at version 1, with a "newer
  version" hint; a `follow_latest` link shows version 2.
- Linking a document to a record of another land is refused.
- A non-manager cannot unlink a document from an event.
- A user without access gets **403** on the private file URL (not just a hidden button).
- A confidential document is invisible to a non-responsible Sijil User.

## AC-04 — Permissions (restricted mode on)
- A Sijil User responsible for land A sees land A only; cases/follow-ups/tasks of other lands are absent
  from lists, search, dashboard counts and reports, and direct URLs/API calls return 403.
- They can still see follow-ups/tasks assigned to them on other lands.

## AC-05 — Follow-up states and reminders
- Upcoming / Due Today / Overdue change with the date, without any stored-state update.
- The daily job sends one reminder per follow-up per day within the lead time.

## AC-06 — ERPNext integration (each with its toggle on)
- Creating a land with "create project" creates an ERPNext Project and links it.
- A Sijil Task on that land creates an ERPNext Task; changing the ERPNext Task status updates the Sijil Task
  and does not loop back.
- Each toggle off → no ERPNext side effects.

## AC-07 — Language and layout
- Every screen in Arabic and English: RTL correct, no clipped/overflowing text, directional icons mirrored,
  dates via locale, usable at 420 px width.
