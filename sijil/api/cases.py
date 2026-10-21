import frappe
from frappe.utils import add_days, cint, nowdate

from sijil.api.common import count, labels, page_response, paging, parse, user_names
from sijil.api.dashboard import decorate_followups, FOLLOWUP_FIELDS
from sijil.services import cases as case_service
from sijil.services import documents as documents_service
from sijil.utils import CASE_CLOSED_STATUSES, get_settings

CASE_FIELDS = [
	"name", "title", "reference_no", "land", "case_type", "status", "priority", "owner_user", "current_situation",
	"external_organization", "last_update_date", "next_followup_date", "start_date", "target_date", "modified",
]
ORDERS = {
	"updated": "last_update_date desc",
	"stale": "last_update_date asc",
	"followup": "next_followup_date asc",
	"title": "title asc",
}


def decorate_cases(rows):
	lands = labels("Sijil Land", [r.land for r in rows], "land_name")
	people = user_names([r.owner_user for r in rows])
	for r in rows:
		r["land_name"] = lands.get(r.land)
		r["owner_name"] = people.get(r.owner_user)
	return rows


@frappe.whitelist()
def list_cases(search=None, land=None, status=None, priority=None, owner=None, mine=0, stale=0, scope=None,
		order="updated", start=0, page_length=20):
	start, page_length = paging(start, page_length)
	filters, or_filters = {}, None
	if land:
		filters["land"] = land
	if status and status not in ("open", "closed"):
		filters["status"] = status
	if scope == "open" or status == "open":
		filters["status"] = ["not in", list(CASE_CLOSED_STATUSES)]
	elif scope == "closed" or status == "closed":
		filters["status"] = ["in", list(CASE_CLOSED_STATUSES)]
	if priority:
		filters["priority"] = priority
	if cint(mine):
		filters["owner_user"] = frappe.session.user
	elif owner:
		filters["owner_user"] = owner
	if cint(stale):
		days = cint(get_settings().stale_case_days) or 14
		filters["last_update_date"] = ["<", add_days(nowdate(), -days)]
		filters.setdefault("status", ["not in", list(CASE_CLOSED_STATUSES)])
	if search:
		like = f"%{search.strip()}%"
		or_filters = {"title": ["like", like], "reference_no": ["like", like], "name": ["like", like]}
	total = count("Sijil Case", filters, or_filters)
	rows = frappe.get_list(
		"Sijil Case", filters=filters, or_filters=or_filters, fields=CASE_FIELDS,
		order_by=ORDERS.get(order, ORDERS["updated"]), start=start, page_length=page_length,
	)
	return page_response(total, decorate_cases(rows), start, page_length)


@frappe.whitelist()
def get_case(name):
	doc = frappe.get_doc("Sijil Case", name)
	doc.check_permission("read")
	data = doc.as_dict()
	data["land_name"] = frappe.db.get_value("Sijil Land", doc.land, "land_name")
	data["owner_name"] = user_names([doc.owner_user]).get(doc.owner_user)
	data["external_organization_name"] = doc.external_organization
	if doc.external_contact:
		data["external_contact_name"] = frappe.db.get_value("Contact", doc.external_contact, "full_name") or doc.external_contact
	data["relations"] = [
		{
			"related_case": r.related_case, "relation_type": r.relation_type,
			"title": frappe.db.get_value("Sijil Case", r.related_case, "title"),
			"status": frappe.db.get_value("Sijil Case", r.related_case, "status"),
		}
		for r in doc.relations
	]
	open_followups = frappe.get_list(
		"Sijil Follow Up", filters={"case": name, "status": "Open"}, fields=FOLLOWUP_FIELDS + ["description"],
		order_by="due_date asc", page_length=20,
	)
	data["open_followups"] = decorate_followups(open_followups)
	data["tasks"] = frappe.get_list(
		"Sijil Task", filters={"case": name, "status": ["in", ["Open", "In Progress"]]},
		fields=["name", "title", "status", "priority", "due_date", "assigned_to"], order_by="due_date asc", page_length=20,
	)
	people = user_names([t.assigned_to for t in data["tasks"]])
	for t in data["tasks"]:
		t["assigned_to_name"] = people.get(t.assigned_to)
	data["documents"] = [d for d in documents_service.links_for("Sijil Case", name) if d]
	data["stats"] = {
		"events": count("Sijil Case Event", {"case": name, "entry_status": "Active"}),
		"followups_total": count("Sijil Follow Up", {"case": name}),
		"followups_done": count("Sijil Follow Up", {"case": name, "status": "Completed"}),
		"tasks_open": len(data["tasks"]),
		"documents": count("Sijil Document Link", {"linked_doctype": "Sijil Case Event",
			"linked_name": ["in", frappe.db.get_all("Sijil Case Event", {"case": name}, pluck="name") or [""]]}),
	}
	last = frappe.get_list(
		"Sijil Case Event", filters={"case": name, "entry_status": "Active"},
		fields=["name", "title", "event_date", "recorded_by"], order_by="event_date desc, creation desc", page_length=1,
	)
	data["last_event"] = last[0] if last else None
	data["can_write"] = bool(doc.has_permission("write"))
	return data


@frappe.whitelist()
def list_events(case, start=0, page_length=15, include_superseded=1):
	frappe.has_permission("Sijil Case", "read", case, throw=True)
	start, page_length = paging(start, page_length)
	total, rows = case_service.events_page(case, start, page_length, include_superseded)
	names = [r.name for r in rows]
	links = {}
	if names:
		for link in frappe.get_list(
			"Sijil Document Link", filters={"linked_doctype": "Sijil Case Event", "linked_name": ["in", names]},
			fields=["name", "document", "document_version", "follow_latest", "note", "linked_by", "creation", "linked_name"],
			limit_page_length=500,
		):
			described = documents_service.describe_link(link)
			if described:
				links.setdefault(link.linked_name, []).append(described)
	people = user_names([r.recorded_by for r in rows])
	orgs = [r.external_organization for r in rows]
	for r in rows:
		r["recorded_by_name"] = people.get(r.recorded_by)
		r["documents"] = links.get(r.name, [])
	return page_response(total, rows, start, page_length)


@frappe.whitelist()
def save_case(data):
	data = parse(data, {})
	name = data.get("name")
	if name:
		doc = frappe.get_doc("Sijil Case", name)
		doc.check_permission("write")
	else:
		doc = frappe.new_doc("Sijil Case")
	for field in (
		"title", "reference_no", "land", "case_type", "status", "priority", "owner_user", "external_organization",
		"external_contact", "start_date", "target_date", "description", "current_situation",
	):
		if field in data:
			doc.set(field, data.get(field) or None)
	if not doc.owner_user:
		doc.owner_user = frappe.session.user
	if "relations" in data:
		doc.set("relations", [])
		for row in data["relations"] or []:
			if row.get("related_case"):
				doc.append("relations", {"related_case": row["related_case"], "relation_type": row.get("relation_type") or "Related"})
	doc.save()
	return {"name": doc.name}


@frappe.whitelist()
def record_event(data):
	"""Record a new development.  Documents (names) are linked, not copied."""
	data = parse(data, {})
	event = case_service.add_event(data)
	return {"name": event.name}


@frappe.whitelist()
def correct_event(name, data, reason):
	new = case_service.correct_event(name, parse(data, {}), reason)
	return {"name": new.name}


@frappe.whitelist()
def update_situation(case, situation, status=None, title=None):
	frappe.has_permission("Sijil Case", "write", case, throw=True)
	event = case_service.update_case_situation(case, situation, status, title)
	return {"name": event.name}
