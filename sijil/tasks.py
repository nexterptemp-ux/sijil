"""Scheduled jobs."""

import frappe
from frappe import _
from frappe.utils import add_days, cint, getdate, nowdate

from sijil.integrations.erpnext import notify


def send_daily_reminders():
	"""Remind assignees of follow-ups / tasks that are due soon, due today or overdue."""
	today = getdate(nowdate())
	_followup_reminders(today)
	_task_reminders(today)


def _followup_reminders(today):
	rows = frappe.db.get_all(
		"Sijil Follow Up",
		filters={"status": "Open", "due_date": ["<=", add_days(today, 30)]},
		fields=["name", "title", "assigned_to", "due_date", "reminder_days_before", "last_reminder_on", "case"],
		limit_page_length=0,
	)
	for r in rows:
		if r.last_reminder_on and getdate(r.last_reminder_on) == today:
			continue
		due = getdate(r.due_date)
		lead = cint(r.reminder_days_before)
		if due > add_days(today, lead):
			continue
		if due < today:
			subject = _("Overdue follow-up: {0}").format(r.title)
		elif due == today:
			subject = _("Follow-up due today: {0}").format(r.title)
		else:
			subject = _("Upcoming follow-up ({0}): {1}").format(due, r.title)
		try:
			notify(r.assigned_to, subject, "Sijil Follow Up", r.name)
			frappe.db.set_value("Sijil Follow Up", r.name, "last_reminder_on", today, update_modified=False)
		except Exception:
			frappe.log_error(title="SIJIL follow-up reminder failed")
	frappe.db.commit()


def _task_reminders(today):
	rows = frappe.db.get_all(
		"Sijil Task",
		filters={"status": ["in", ["Open", "In Progress"]], "due_date": ["<=", today]},
		fields=["name", "title", "assigned_to", "due_date"],
		limit_page_length=0,
	)
	for r in rows:
		subject = (
			_("Overdue task: {0}").format(r.title)
			if getdate(r.due_date) < today
			else _("Task due today: {0}").format(r.title)
		)
		try:
			notify(r.assigned_to, subject, "Sijil Task", r.name)
		except Exception:
			frappe.log_error(title="SIJIL task reminder failed")
