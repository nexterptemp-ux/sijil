# Background jobs and reporting

## Scheduled jobs (`hooks.scheduler_events`)
| Schedule | Function | Does |
|---|---|---|
| daily | `sijil.tasks.send_daily_reminders` | **Follow-ups:** open ones due within `reminder_days_before` (default from Settings), due today or overdue → `notify(assignee)`; `last_reminder_on` ensures at most one per day. **Tasks:** open/in-progress due today or overdue → notify. Each failure is logged (`frappe.log_error`) and does not stop the run. |

`notify` writes a Notification Log and/or sends email depending on Settings flags
([erpnext-integration.md](erpnext-integration.md)). Requires the Frappe scheduler to be enabled on the site
(`bench --site <site> enable-scheduler`). No other background jobs exist; long work (e.g. bulk imports) should
use `frappe.enqueue` when added.

## Operational reports
Defined once in `sijil/services/reports.py` (`REPORTS`) and exposed two ways:
- Frappe **Script Reports** in `sijil/sijil/report/` (Desk report view, export, print);
- `sijil.api.reports.run` for the SPA.

| Key | Report |
|---|---|
| `overdue_followups` | Sijil Overdue Follow Ups |
| `upcoming_followups` | Sijil Upcoming Follow Ups |
| `open_cases_by_employee` | Sijil Open Cases by Employee |
| `case_status_by_project` | Sijil Case Status by Project |
| `outstanding_tasks` | Sijil Outstanding Tasks |
| `stale_cases` | Sijil Stale Cases (no update for `stale_case_days`) |

All data comes from `frappe.get_list`, so record-level permissions apply.

## History reports
`case_history_context` / `land_history_context` build the data; Jinja templates in
`sijil/templates/reports/` render HTML (`dir` from the user's language). PDF via Frappe's `get_pdf`
(wkhtmltopdf). Endpoints: `reports.case_history`, `land_history` (HTML) and `*_pdf` (download).

**Arabic PDF risk:** wkhtmltopdf needs an Arabic-capable font installed on the server (e.g. Cairo or Noto
Naskh Arabic) and the patched-Qt build of wkhtmltopdf. Shaping, RTL order, numerals and page breaks must be
checked by eye (AC-01 step 6).
