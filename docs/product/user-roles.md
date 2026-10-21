# User roles

Roles are Frappe roles created by `sijil/install.py`. Record-level visibility is described in
[architecture/security.md](../architecture/security.md).

| Role | Who | Can do |
|---|---|---|
| **Sijil User** | Engineers, government-relations and admin staff who follow up | Read lands; create/edit cases, follow-ups, tasks, folders, documents; record events. Cannot create or delete lands, cannot delete cases/documents, cannot unlink documents from recorded events, cannot change settings. |
| **Sijil Manager** | Department/project managers, executives | Everything a user can, plus create/edit/delete lands, delete records (where history allows), unlink documents from events, change Sijil Settings and integrations, always sees all lands and confidential documents. |
| **System Manager** | ERPNext administrators | Same as Sijil Manager (treated as privileged). |

Executives are Sijil Managers today; a read-only "viewer" role is an [open decision](open-decisions.md).

## Responsibility on a land
A land lists **responsible employees** (`Sijil Land Responsible`: user + responsibility text) and
**external organizations** (consultants, municipalities, …) with their role. Responsibility matters for:
- **Restricted mode** (`Sijil Settings → restrict_to_assigned_lands`): non-managers only see lands they are
  responsible for or created, plus cases/follow-ups/tasks they own or are assigned.
- **Confidential documents**: visible only to managers, the uploader and the land's responsible employees.

## Responsibility on work
- Case: `owner_user` — the internal employee who owns the case.
- Follow-up / Task: `assigned_to` — receives ToDo, calendar entry and reminders.
- Event: `recorded_by` — set automatically, never editable.
