import frappe
from frappe import _
from frappe.utils import cint, nowdate

from sijil.api.common import count, labels, page_response, paging, parse, user_names
from sijil.services import documents as documents_service
from sijil.utils import user_display

OPEN = ["in", ["Open", "In Progress"]]
TASK_FIELDS = [
	"name", "title", "status", "priority", "assigned_to", "land", "case", "due_date", "start_date", "completed_on",
	"erpnext_task", "project",
]


def scope_filters(scope):
	today = nowdate()
	return {
		"open": {"status": OPEN},
		"overdue": {"status": OPEN, "due_date": ["<", today]},
		"completed": {"status": "Completed"},
		"cancelled": {"status": "Cancelled"},
		"all": {},
	}.get(scope or "open", {"status": OPEN})


def decorate(rows):
	lands = labels("Sijil Land", [r.land for r in rows], "land_name")
	cases = labels("Sijil Case", [r.case for r in rows], "title")
	people = user_names([r.assigned_to for r in rows])
	today = nowdate()
	for r in rows:
		r["land_name"] = lands.get(r.land)
		r["case_title"] = cases.get(r.case)
		r["assigned_to_name"] = people.get(r.assigned_to)
		r["overdue"] = bool(r.due_date and str(r.due_date) < today and r.status in ("Open", "In Progress"))
	return rows


@frappe.whitelist()
def list_tasks(scope="open", land=None, case=None, assigned_to=None, mine=0, search=None, start=0, page_length=20):
	start, page_length = paging(start, page_length)
	filters = dict(scope_filters(scope))
	if land:
		filters["land"] = land
	if case:
		filters["case"] = case
	if cint(mine):
		filters["assigned_to"] = frappe.session.user
	elif assigned_to:
		filters["assigned_to"] = assigned_to
	or_filters = {"title": ["like", f"%{search.strip()}%"]} if search else None
	total = count("Sijil Task", filters, or_filters)
	rows = frappe.get_list(
		"Sijil Task", filters=filters, or_filters=or_filters, fields=TASK_FIELDS,
		order_by="due_date asc" if scope in ("open", "overdue") else "modified desc", start=start, page_length=page_length,
	)
	return page_response(total, decorate(rows), start, page_length)


@frappe.whitelist()
def task_counts(mine=0):
	base = {"assigned_to": frappe.session.user} if cint(mine) else {}
	return {k: count("Sijil Task", {**base, **scope_filters(k)}) for k in ("open", "overdue", "completed")}


@frappe.whitelist()
def get_task(name):
	doc = frappe.get_doc("Sijil Task", name)
	doc.check_permission("read")
	data = doc.as_dict()
	data["land_name"] = frappe.db.get_value("Sijil Land", doc.land, "land_name") if doc.land else None
	data["case_title"] = frappe.db.get_value("Sijil Case", doc.case, "title") if doc.case else None
	data["assigned_to_name"] = user_display(doc.assigned_to)
	for row in data["updates"]:
		row["user_name"] = user_display(row.get("user"))
	data["documents"] = [d for d in documents_service.links_for("Sijil Task", name) if d]
	data["can_write"] = bool(doc.has_permission("write"))
	return data


@frappe.whitelist()
def save_task(data):
	data = parse(data, {})
	if data.get("name"):
		doc = frappe.get_doc("Sijil Task", data["name"])
		doc.check_permission("write")
	else:
		doc = frappe.new_doc("Sijil Task")
	for field in (
		"title", "description", "land", "case", "case_event", "status", "priority", "assigned_to", "start_date",
		"due_date", "completion_notes",
	):
		if field in data:
			doc.set(field, data.get(field) or None)
	if not doc.assigned_to:
		doc.assigned_to = frappe.session.user
	doc.save()
	return {"name": doc.name}


@frappe.whitelist()
def set_status(name, status, completion_notes=None):
	doc = frappe.get_doc("Sijil Task", name)
	doc.check_permission("write")
	doc.status = status
	if completion_notes:
		doc.completion_notes = completion_notes
	doc.save()
	return {"name": doc.name, "status": doc.status}


@frappe.whitelist()
def add_update(name, note):
	note = (note or "").strip()
	if not note:
		frappe.throw(_("Please write a note."))
	doc = frappe.get_doc("Sijil Task", name)
	doc.check_permission("write")
	doc.append("updates", {"update_on": frappe.utils.now_datetime(), "user": frappe.session.user, "note": note})
	doc.save()
	return {"name": doc.name}
