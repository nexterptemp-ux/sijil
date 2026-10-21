import frappe
from frappe.utils import add_days, cint, nowdate

from sijil.api.common import count, page_response, paging, parse
from sijil.api.dashboard import FOLLOWUP_FIELDS, decorate_followups
from sijil.services import followups as followup_service


def scope_filters(scope):
	today = nowdate()
	return {
		"open": {"status": "Open"},
		"overdue": {"status": "Open", "due_date": ["<", today]},
		"today": {"status": "Open", "due_date": today},
		"upcoming": {"status": "Open", "due_date": [">", today]},
		"week": {"status": "Open", "due_date": ["between", [today, add_days(today, 7)]]},
		"completed": {"status": "Completed"},
		"cancelled": {"status": "Cancelled"},
		"all": {},
	}.get(scope or "open", {"status": "Open"})


@frappe.whitelist()
def list_followups(scope="open", case=None, land=None, assigned_to=None, mine=0, search=None, start=0, page_length=20):
	start, page_length = paging(start, page_length)
	filters = dict(scope_filters(scope))
	if case:
		filters["case"] = case
	if land:
		filters["land"] = land
	if cint(mine):
		filters["assigned_to"] = frappe.session.user
	elif assigned_to:
		filters["assigned_to"] = assigned_to
	or_filters = {"title": ["like", f"%{search.strip()}%"]} if search else None
	total = count("Sijil Follow Up", filters, or_filters)
	completed = scope in ("completed", "cancelled")
	rows = frappe.get_list(
		"Sijil Follow Up", filters=filters, or_filters=or_filters,
		fields=FOLLOWUP_FIELDS + ["description", "outcome", "result_event", "next_followup"],
		order_by="completion_date desc, modified desc" if completed else "due_date asc",
		start=start, page_length=page_length,
	)
	return page_response(total, decorate_followups(rows), start, page_length)


@frappe.whitelist()
def followup_counts(mine=0):
	base = {"assigned_to": frappe.session.user} if cint(mine) else {}
	return {
		key: count("Sijil Follow Up", {**base, **scope_filters(key)})
		for key in ("open", "overdue", "today", "upcoming", "completed")
	}


@frappe.whitelist()
def save_followup(data):
	data = parse(data, {})
	if data.get("name"):
		doc = frappe.get_doc("Sijil Follow Up", data["name"])
		doc.check_permission("write")
		for field in ("title", "description", "due_date", "assigned_to", "priority"):
			if field in data:
				doc.set(field, data[field])
		doc.save()
	else:
		doc = followup_service.create_followup(data)
	return {"name": doc.name}


@frappe.whitelist()
def complete(name, outcome, event=None, next_followup=None, documents=None):
	"""Complete a follow-up: outcome -> case event -> optional next follow-up (one transaction)."""
	return followup_service.complete_followup(
		name, outcome, parse(event, {}), parse(next_followup, None), parse(documents, [])
	)


@frappe.whitelist()
def cancel(name, reason=None):
	return {"name": followup_service.cancel_followup(name, reason).name}


@frappe.whitelist()
def reschedule(name, due_date, assigned_to=None):
	return {"name": followup_service.reschedule_followup(name, due_date, assigned_to).name}
