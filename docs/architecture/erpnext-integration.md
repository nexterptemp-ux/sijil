# ERPNext integration

Decision: [ADR-002](../decisions/ADR-002-erpnext-dependency.md). Code: `sijil/integrations/erpnext.py`,
`sijil/overrides/dashboards.py`, `hooks.py` (`doc_events`, `override_doctype_dashboards`).
Each integration is a flag in **Sijil Settings** and is shown in the in-app Integrations screen.

| Integration | Flag | Behaviour |
|---|---|---|
| Project per land | `enable_project_integration` | A land can link an ERPNext Project; `create_project` creates one (company = land's or Settings default). Deleting a Project unlinks it from lands, cases and tasks. |
| Auto-create project | `auto_create_project` (+ above) | New land → Project created automatically. |
| Task sync | `enable_task_sync` (+ project) | A Sijil Task on a land with a Project is mirrored to an ERPNext Task (title, status, priority, dates, description, assignee). ERPNext Task changes (status, subject, dates) flow back. `frappe.flags.sijil_syncing` prevents loops. Deleting the ERPNext Task unlinks it. |
| ToDo | `enable_todo` | Follow-ups and tasks create/close a ToDo for the assignee. |
| Calendar | `enable_calendar` | Open follow-ups appear as a Frappe Event for the assignee. |
| Notifications | `enable_notifications` | Reminders as Notification Log (Desk bell). |
| Email reminders | `enable_email_reminders` | Reminders also by email (needs an outgoing email account). |

Always-on links (no flag): External Organization → Supplier / Customer / Contact; Case → Contact;
Land → Company; dashboards of Project, Task, Supplier and Customer show a "SIJIL" connections group.

Status mapping (Sijil ↔ ERPNext Task): Open↔Open, In Progress↔Working (Pending Review → In Progress),
Completed↔Completed, Cancelled↔Cancelled; ERPNext "Overdue" keeps the Sijil status.

## Rules
- All ERPNext writes live in `integrations/erpnext.py` and check their flag first.
- ERPNext records are created with `ignore_permissions` as a side effect of an authorized Sijil action.
- Never modify ERPNext DocTypes; use hooks and dashboard overrides.

## Not verified
None of this has run against a live ERPNext (see STATUS). Staging checks are AC-06 in
[product/acceptance.md](../product/acceptance.md).
