"""Shared helpers for SIJIL."""

import frappe
from frappe import _
from frappe.utils import cint, getdate, nowdate

CASE_CLOSED_STATUSES = ("Completed", "Cancelled")
MANAGER_ROLES = ("System Manager", "Sijil Manager")
USER_ROLES = ("Sijil User", "Sijil Manager", "System Manager")


def get_settings():
	"""Return the cached Sijil Settings document."""
	return frappe.get_cached_doc("Sijil Settings")


def setting(key, default=None):
	value = get_settings().get(key)
	return default if value is None else value


def flag(key):
	"""Boolean integration flag from Sijil Settings."""
	return bool(cint(setting(key, 0)))


def is_manager(user=None):
	user = user or frappe.session.user
	if user == "Administrator":
		return True
	return bool(set(MANAGER_ROLES) & set(frappe.get_roles(user)))


def followup_state(status, due_date, today=None):
	"""Derived follow-up state. Only Open follow-ups are time-derived; nothing is stored."""
	if status in ("Completed", "Cancelled"):
		return status
	today = getdate(today or nowdate())
	due = getdate(due_date)
	if due < today:
		return "Overdue"
	if due == today:
		return "Due Today"
	return "Upcoming"


def _request_cache(key):
	"""Per-request dict stored on frappe.local (a werkzeug Local has no __dict__)."""
	cache = getattr(frappe.local, key, None)
	if cache is None:
		cache = {}
		setattr(frappe.local, key, cache)
	return cache


def user_display(user):
	"""Full name for a user id (cached per request)."""
	if not user:
		return ""
	cache = _request_cache("sijil_user_names")
	if user not in cache:
		cache[user] = frappe.db.get_value("User", user, "full_name") or user
	return cache[user]


def user_card(user):
	if not user:
		return None
	return {"name": user, "full_name": user_display(user)}


def clean_text(value):
	return (value or "").strip()


def next_open_followup_date(case):
	"""Earliest due date among open follow-ups of a case."""
	return frappe.db.get_value(
		"Sijil Follow Up",
		{"case": case, "status": "Open"},
		"min(due_date)",
	)


def refresh_case_followup_date(case):
	"""Keep the denormalised Case.next_followup_date in sync."""
	if not case or not frappe.db.exists("Sijil Case", case):
		return
	frappe.db.set_value(
		"Sijil Case", case, "next_followup_date", next_open_followup_date(case), update_modified=False
	)


def throw_immutable(what):
	frappe.throw(
		_("{0} cannot be edited or deleted once recorded. Use the correction workflow instead.").format(_(what)),
		title=_("History Is Preserved"),
	)
