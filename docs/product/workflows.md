# Core workflows

Each workflow names the backend operation that owns it ([architecture/api.md](../architecture/api.md)).
The frontend only collects input and shows results.

## W1 Record a development — `cases.record_event`
User opens a case → "Record development" → enters actual date, title, description, type, communication
method, outcome; optionally a new current situation and/or status; optionally attaches documents (upload new
or pick existing from the land library, pinned to the current version). Saving creates one Case Event,
updates the case's last-update date, and — only if this is the latest event — its situation/status.

## W2 Correct a development — `cases.correct_event`
User picks a wrong event → "Correct" → edits fields and gives a **reason**. A new event is created that
`corrects` the old one; the old one becomes Superseded and links to the new one. Both remain in the history.
Documents linked to the old event are linked to the new one.

## W3 Update current situation — `cases.update_situation`
A quick action on the case page. Internally it is an event of type *Update* with a situation (and optional
status) change, so the change is part of the history.

## W4 Plan a follow-up — `followups.save_followup`
From a case (or land, or right after recording an event): title, assignee, due date, priority, reminder lead
days. The case's next-follow-up date updates. The assignee gets a ToDo and calendar entry (if enabled).

## W5 Complete a follow-up — `followups.complete`
Assignee opens the follow-up → "Complete" → writes the **actual outcome** (mandatory, even "no progress"),
optionally adjusts the event fields, optionally attaches documents, optionally schedules the next follow-up.
One transaction: event created → next follow-up created → current one closed with links to both.
Reschedule (`followups.reschedule`) and cancel with reason (`followups.cancel`) are the alternatives.

## W6 File a document — `documents.upload_document`, `documents.upload_version`, `documents.link_document`
Upload into a land folder with metadata → document + version 1. Uploading again creates version N+1; existing
pinned links keep their version and show "newer version available". Linking an existing document to a
record never copies the file.

## W7 Manage independent work — `tasks.save_task`, `tasks.set_status`, `tasks.add_update`
Create a task with or without a case, post progress notes, complete or cancel. Synced to ERPNext Task when
enabled and the land has a Project.

## W8 Review and report — `cases.get_case`, `reports.case_history(_pdf)`, `reports.land_history(_pdf)`
Manager opens a case: situation, status, owner, external organization, last development, next follow-up,
open tasks, documents and the full paged history are on one screen. "Report" produces the case (or land)
history as HTML or PDF.

## W9 Daily reminders — `sijil.tasks.send_daily_reminders` (scheduler)
Once a day: follow-ups within their reminder lead time, due today or overdue, and tasks due today/overdue,
notify the assignee (Notification Log, and email if enabled). At most one follow-up reminder per day.
