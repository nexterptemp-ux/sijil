# Open product decisions

Decisions the owner has **not** made yet. Don't implement around them silently — ask, then record the answer
(here → ADR or requirements) and remove the entry.

| # | Question | Current behaviour in code | Notes |
|---|---|---|---|
| OD-1 | **License.** Which license, if any? | `license.txt` and `hooks.py` say MIT (chosen by the initial build, not by the owner) | Internal company software is often "proprietary, all rights reserved". Owner: not known yet (2026-10-21) |
| OD-2 | Is Sijil installed on the **production ERPNext site** itself, and is that site ERPNext **v15**? | App requires ERPNext v15 on the same site | If custom apps aren't allowed there (e.g. hosted plan), integration must move to the REST API. Owner: not known yet (2026-10-21); blocks E3 staging, not F1–F8 |
| OD-3 | URL of the React app | Planned `/sijil` (ADR-003) | Any path works; must not clash with Desk routes |
| OD-4 | Read-only role for executives? | Executives must be Sijil Manager or Sijil User | A "Sijil Viewer" role is cheap to add. Owner: not known yet (2026-10-21) |
| OD-5 | Confidential-document access rule | Managers, uploader, land responsibles | Owner may want an explicit per-document access list |
| OD-6 | Can a Sijil User **create lands**? | No (read-only on Sijil Land) | |
| OD-7 | Should recording an event require **write** on the case? | Read access is enough to record an event | Events are append-only, so this was deliberate; confirm |
| OD-8 | Reminder channels | Notification Log + optional email | WhatsApp/SMS would be Future |
| OD-9 | Archiving a land | Status "Archived" only blocks new cases | Should it also block new follow-ups/tasks/documents, or hide the land from default lists? |
| OD-10 | Data migration | None | Is there existing data (Excel, old system) to import before go-live? |
