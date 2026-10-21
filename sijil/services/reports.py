"""Operational reports (shared by the Script Reports and the in-app Reports screen)
and the data behind the printable history reports."""

import frappe
from frappe import _
from frappe.utils import add_days, cint, date_diff, getdate, nowdate

from sijil.api.common import user_names
from sijil.utils import CASE_CLOSED_STATUSES, followup_state, get_settings

LIMIT = 5000


def col(fieldname, label, fieldtype="Data", options=None, width=130):
	d = {"fieldname": fieldname, "label": label, "fieldtype": fieldtype, "width": width}
	if options:
		d["options"] = options
	return d


def _val(filters, key):
	return (filters or {}).get(key) or None


def _followups(filters, status_filters):
	f = {"status": "Open", **status_filters}
	for key in ("land", "assigned_to"):
		if _val(filters, key):
			f[key] = filters[key]
	return frappe.get_list(
		"Sijil Follow Up", filters=f, order_by="due_date asc", limit_page_length=LIMIT,
		fields=["name", "title", "case", "land", "assigned_to", "due_date", "priority"],
	)


def overdue_followups(filters=None):
	today = getdate(nowdate())
	rows = _followups(filters, {"due_date": ["<", today]})
	for r in rows:
		r["days_overdue"] = date_diff(today, r.due_date)
	columns = [
		col("name", _("Follow-up"), "Link", "Sijil Follow Up"), col("title", _("Title"), width=240),
		col("case", _("Case"), "Link", "Sijil Case"), col("land", _("Land / Project"), "Link", "Sijil Land"),
		col("assigned_to", _("Assigned To"), "Link", "User"), col("due_date", _("Due Date"), "Date"),
		col("days_overdue", _("Days Overdue"), "Int", width=100), col("priority", _("Priority"), width=90),
	]
	return columns, rows


def upcoming_followups(filters=None):
	today = getdate(nowdate())
	days = cint((filters or {}).get("days")) or 14
	rows = _followups(filters, {"due_date": ["between", [today, add_days(today, days)]]})
	for r in rows:
		r["days_left"] = date_diff(r.due_date, today)
	columns = [
		col("name", _("Follow-up"), "Link", "Sijil Follow Up"), col("title", _("Title"), width=240),
		col("case", _("Case"), "Link", "Sijil Case"), col("land", _("Land / Project"), "Link", "Sijil Land"),
		col("assigned_to", _("Assigned To"), "Link", "User"), col("due_date", _("Due Date"), "Date"),
		col("days_left", _("Days Left"), "Int", width=100), col("priority", _("Priority"), width=90),
	]
	return columns, rows


def open_cases_by_employee(filters=None):
	f = {"status": ["not in", list(CASE_CLOSED_STATUSES)]}
	if _val(filters, "land"):
		f["land"] = filters["land"]
	cases = frappe.get_list("Sijil Case", filters=f, fields=["owner_user", "status"], limit_page_length=LIMIT)
	statuses = ["Not Started", "In Progress", "Awaiting Action", "On Hold"]
	by_user = {}
	for c in cases:
		row = by_user.setdefault(c.owner_user, {"owner_user": c.owner_user, "total": 0, **{s: 0 for s in statuses}})
		row["total"] += 1
		row[c.status] = row.get(c.status, 0) + 1
	overdue = {}
	for r in frappe.get_list("Sijil Follow Up", filters={"status": "Open", "due_date": ["<", nowdate()]},
			fields=["assigned_to"], limit_page_length=LIMIT):
		overdue[r.assigned_to] = overdue.get(r.assigned_to, 0) + 1
	rows = sorted(by_user.values(), key=lambda r: -r["total"])
	for r in rows:
		r["overdue_followups"] = overdue.get(r["owner_user"], 0)
		for s in statuses:
			r[s.lower().replace(" ", "_")] = r.pop(s)
	columns = [
		col("owner_user", _("Internal Owner"), "Link", "User", 200), col("total", _("Open Cases"), "Int", width=100),
		col("not_started", _("Not Started"), "Int", width=100), col("in_progress", _("In Progress"), "Int", width=100),
		col("awaiting_action", _("Awaiting Action"), "Int", width=120), col("on_hold", _("On Hold"), "Int", width=100),
		col("overdue_followups", _("Overdue Follow-ups"), "Int", width=140),
	]
	return columns, rows


def case_status_by_project(filters=None):
	statuses = ["Not Started", "In Progress", "Awaiting Action", "On Hold", "Completed", "Cancelled"]
	f = {}
	if _val(filters, "land"):
		f["land"] = filters["land"]
	cases = frappe.get_list("Sijil Case", filters=f, fields=["land", "status"], limit_page_length=LIMIT)
	lands = {}
	for c in cases:
		row = lands.setdefault(c.land, {"land": c.land, "total": 0, **{s: 0 for s in statuses}})
		row["total"] += 1
		row[c.status] = row.get(c.status, 0) + 1
	projects = {
		r.name: r.project for r in frappe.db.get_all("Sijil Land", filters={"name": ["in", list(lands) or [""]]}, fields=["name", "project"])
	}
	rows = sorted(lands.values(), key=lambda r: -r["total"])
	for r in rows:
		r["project"] = projects.get(r["land"])
		for s in statuses:
			r[s.lower().replace(" ", "_")] = r.pop(s)
	columns = [
		col("land", _("Land / Project"), "Link", "Sijil Land", 200), col("project", _("ERPNext Project"), "Link", "Project", 160),
		col("total", _("Total"), "Int", width=80), col("not_started", _("Not Started"), "Int", width=100),
		col("in_progress", _("In Progress"), "Int", width=100), col("awaiting_action", _("Awaiting Action"), "Int", width=120),
		col("on_hold", _("On Hold"), "Int", width=90), col("completed", _("Completed"), "Int", width=100),
		col("cancelled", _("Cancelled"), "Int", width=100),
	]
	return columns, rows


def outstanding_tasks(filters=None):
	f = {"status": ["in", ["Open", "In Progress"]]}
	for key in ("land", "assigned_to"):
		if _val(filters, key):
			f[key] = filters[key]
	rows = frappe.get_list(
		"Sijil Task", filters=f, order_by="due_date asc", limit_page_length=LIMIT,
		fields=["name", "title", "land", "case", "assigned_to", "status", "priority", "due_date"],
	)
	today = getdate(nowdate())
	for r in rows:
		r["days_overdue"] = max(date_diff(today, r.due_date), 0) if r.due_date else 0
	columns = [
		col("name", _("Task"), "Link", "Sijil Task"), col("title", _("Title"), width=240),
		col("land", _("Land / Project"), "Link", "Sijil Land"), col("case", _("Case"), "Link", "Sijil Case"),
		col("assigned_to", _("Assigned To"), "Link", "User"), col("status", _("Status"), width=100),
		col("priority", _("Priority"), width=90), col("due_date", _("Due Date"), "Date"),
		col("days_overdue", _("Days Overdue"), "Int", width=100),
	]
	return columns, rows


def stale_cases(filters=None):
	days = cint((filters or {}).get("days")) or cint(get_settings().stale_case_days) or 14
	today = getdate(nowdate())
	f = {"status": ["not in", list(CASE_CLOSED_STATUSES)], "last_update_date": ["<", add_days(today, -days)]}
	if _val(filters, "land"):
		f["land"] = filters["land"]
	rows = frappe.get_list(
		"Sijil Case", filters=f, order_by="last_update_date asc", limit_page_length=LIMIT,
		fields=["name", "title", "land", "status", "owner_user", "last_update_date", "next_followup_date"],
	)
	for r in rows:
		r["days_since_update"] = date_diff(today, r.last_update_date)
	columns = [
		col("name", _("Case"), "Link", "Sijil Case"), col("title", _("Case Title"), width=240),
		col("land", _("Land / Project"), "Link", "Sijil Land"), col("status", _("Status"), width=110),
		col("owner_user", _("Internal Owner"), "Link", "User"), col("last_update_date", _("Last Meaningful Update"), "Date"),
		col("days_since_update", _("Days Since Update"), "Int", width=120),
		col("next_followup_date", _("Next Follow-up"), "Date"),
	]
	return columns, rows


REPORTS = {
	"overdue_followups": ("Sijil Overdue Follow Ups", overdue_followups),
	"upcoming_followups": ("Sijil Upcoming Follow Ups", upcoming_followups),
	"open_cases_by_employee": ("Sijil Open Cases by Employee", open_cases_by_employee),
	"case_status_by_project": ("Sijil Case Status by Project", case_status_by_project),
	"outstanding_tasks": ("Sijil Outstanding Tasks", outstanding_tasks),
	"stale_cases": ("Sijil Stale Cases", stale_cases),
}


# ---------------------------------------------------------------- history reports
def case_history_context(case):
	doc = frappe.get_doc("Sijil Case", case)
	doc.check_permission("read")
	from sijil.services import documents as documents_service

	events = frappe.get_list(
		"Sijil Case Event", filters={"case": case},
		fields=["name", "title", "description", "event_date", "event_time", "event_type", "communication_method",
			"external_organization", "outcome", "situation_update", "status_after", "is_milestone", "recorded_by",
			"recorded_on", "entry_status", "corrects", "superseded_by", "correction_reason"],
		order_by="event_date asc, creation asc", limit_page_length=LIMIT,
	)
	people = user_names([e.recorded_by for e in events] + [doc.owner_user])
	for e in events:
		e["recorded_by_name"] = people.get(e.recorded_by) or e.recorded_by
		e["documents"] = [d for d in documents_service.links_for("Sijil Case Event", e.name) if d]
	followups = frappe.get_list(
		"Sijil Follow Up", filters={"case": case},
		fields=["name", "title", "assigned_to", "due_date", "status", "completion_date", "outcome", "priority"],
		order_by="due_date asc", limit_page_length=LIMIT,
	)
	fu_people = user_names([f.assigned_to for f in followups])
	for f in followups:
		f["assigned_to_name"] = fu_people.get(f.assigned_to) or f.assigned_to
		f["state"] = followup_state(f.status, f.due_date)
	tasks = frappe.get_list(
		"Sijil Task", filters={"case": case},
		fields=["name", "title", "status", "due_date", "assigned_to"], order_by="due_date asc", limit_page_length=LIMIT,
	)
	land = frappe.db.get_value("Sijil Land", doc.land, ["land_name", "land_code"], as_dict=True) or {}
	return {
		"case": doc,
		"land": land,
		"owner_name": people.get(doc.owner_user) or doc.owner_user,
		"events": events,
		"followups": followups,
		"outstanding": [f for f in followups if f.status == "Open"],
		"tasks": [t for t in tasks if t.status in ("Open", "In Progress")],
		"generated_on": nowdate(),
		"generated_by": user_names([frappe.session.user]).get(frappe.session.user) or frappe.session.user,
	}


def land_history_context(land):
	doc = frappe.get_doc("Sijil Land", land)
	doc.check_permission("read")
	cases = frappe.get_list(
		"Sijil Case", filters={"land": land}, fields=["name"], order_by="start_date asc", limit_page_length=LIMIT
	)
	return {
		"land": doc,
		"cases": [case_history_context(c.name) for c in cases],
		"generated_on": nowdate(),
		"generated_by": user_names([frappe.session.user]).get(frappe.session.user) or frappe.session.user,
	}
