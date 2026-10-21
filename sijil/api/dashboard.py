import frappe
from frappe.utils import add_days, cint, nowdate

from sijil.api.common import count, labels, user_names
from sijil.utils import CASE_CLOSED_STATUSES, followup_state, get_settings

OPEN_TASK = ["in", ["Open", "In Progress"]]


def decorate_followups(rows):
	cases = labels("Sijil Case", [r.get("case") for r in rows], "title")
	lands = labels("Sijil Land", [r.get("land") for r in rows], "land_name")
	people = user_names([r.get("assigned_to") for r in rows])
	for r in rows:
		r["state"] = followup_state(r["status"], r["due_date"])
		r["case_title"] = cases.get(r.get("case"))
		r["land_name"] = lands.get(r.get("land"))
		r["assigned_to_name"] = people.get(r.get("assigned_to"))
	return rows


FOLLOWUP_FIELDS = ["name", "title", "case", "land", "assigned_to", "due_date", "priority", "status", "completion_date"]


@frappe.whitelist()
def get_dashboard():
	today = nowdate()
	stale_days = cint(get_settings().stale_case_days) or 14
	stale_before = add_days(today, -stale_days)
	open_case = {"status": ["not in", list(CASE_CLOSED_STATUSES)]}

	counts = {
		"active_lands": count("Sijil Land", {"status": "Active"}),
		"open_cases": count("Sijil Case", open_case),
		"awaiting_action": count("Sijil Case", {"status": "Awaiting Action"}),
		"overdue_followups": count("Sijil Follow Up", {"status": "Open", "due_date": ["<", today]}),
		"due_today_followups": count("Sijil Follow Up", {"status": "Open", "due_date": today}),
		"upcoming_followups": count(
			"Sijil Follow Up", {"status": "Open", "due_date": ["between", [add_days(today, 1), add_days(today, 7)]]}
		),
		"open_tasks": count("Sijil Task", {"status": OPEN_TASK}),
		"overdue_tasks": count("Sijil Task", {"status": OPEN_TASK, "due_date": ["<", today]}),
		"stale_cases": count("Sijil Case", {**open_case, "last_update_date": ["<", stale_before]}),
	}

	attention = frappe.get_list(
		"Sijil Follow Up",
		filters={"status": "Open", "due_date": ["<=", today]},
		fields=FOLLOWUP_FIELDS,
		order_by="due_date asc",
		page_length=8,
	)
	upcoming = frappe.get_list(
		"Sijil Follow Up",
		filters={"status": "Open", "due_date": [">", today]},
		fields=FOLLOWUP_FIELDS,
		order_by="due_date asc",
		page_length=6,
	)
	events = frappe.get_list(
		"Sijil Case Event",
		filters={"entry_status": "Active"},
		fields=["name", "title", "case", "land", "event_date", "event_type", "recorded_by", "is_milestone"],
		order_by="event_date desc, creation desc",
		page_length=8,
	)
	case_titles = labels("Sijil Case", [e.case for e in events], "title")
	land_names = labels("Sijil Land", [e.land for e in events], "land_name")
	people = user_names([e.recorded_by for e in events])
	for e in events:
		e["case_title"] = case_titles.get(e.case)
		e["land_name"] = land_names.get(e.land)
		e["recorded_by_name"] = people.get(e.recorded_by)

	docs = frappe.get_list(
		"Sijil Document",
		fields=["name", "title", "land", "document_type", "creation", "version_count"],
		order_by="modified desc",
		page_length=6,
	)
	doc_lands = labels("Sijil Land", [d.land for d in docs], "land_name")
	for d in docs:
		d["land_name"] = doc_lands.get(d.land)

	stale = frappe.get_list(
		"Sijil Case",
		filters={**open_case, "last_update_date": ["<", stale_before]},
		fields=["name", "title", "land", "owner_user", "last_update_date", "status"],
		order_by="last_update_date asc",
		page_length=6,
	)
	stale_lands = labels("Sijil Land", [c.land for c in stale], "land_name")
	stale_people = user_names([c.owner_user for c in stale])
	for c in stale:
		c["land_name"] = stale_lands.get(c.land)
		c["owner_name"] = stale_people.get(c.owner_user)

	return {
		"today": today,
		"stale_days": stale_days,
		"counts": counts,
		"attention_followups": decorate_followups(attention),
		"upcoming_followups": decorate_followups(upcoming),
		"recent_events": events,
		"recent_documents": docs,
		"stale_cases": stale,
	}
