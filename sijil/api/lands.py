import frappe
from frappe.utils import add_days, cint, nowdate

from sijil.api.common import count, labels, page_response, paging, parse, user_names
from sijil.integrations import erpnext as erp
from sijil.utils import CASE_CLOSED_STATUSES, KEY_DOCUMENT_TYPES, get_settings

LAND_FIELDS = ["name", "land_name", "land_code", "status", "city", "company", "project", "modified"]


def _grouped(doctype, field, names, extra=None):
	filters = {field: ["in", names], **(extra or {})}
	rows = frappe.db.get_all(doctype, filters=filters, fields=[field, "count(name) as c"], group_by=field)
	return {r[field]: r.c for r in rows}


@frappe.whitelist()
def list_lands(search=None, status=None, start=0, page_length=24):
	start, page_length = paging(start, page_length)
	filters, or_filters = {}, None
	if status:
		filters["status"] = status
	if search:
		like = f"%{search.strip()}%"
		or_filters = {"land_name": ["like", like], "land_code": ["like", like], "city": ["like", like]}
	total = count("Sijil Land", filters, or_filters)
	rows = frappe.get_list(
		"Sijil Land", filters=filters, or_filters=or_filters, fields=LAND_FIELDS,
		order_by="land_name asc", start=start, page_length=page_length,
	)
	names = [r.name for r in rows]
	if names:
		open_cases = _grouped("Sijil Case", "land", names, {"status": ["not in", list(CASE_CLOSED_STATUSES)]})
		all_cases = _grouped("Sijil Case", "land", names)
		followups = _grouped("Sijil Follow Up", "land", names, {"status": "Open"})
		documents = _grouped("Sijil Document", "land", names)
		# Which key documents exist per land (permission-aware, archived excluded).
		key_docs = {}
		for d in frappe.get_list(
			"Sijil Document",
			filters={"land": ["in", names], "document_type": ["in", list(KEY_DOCUMENT_TYPES)], "archived": 0},
			fields=["land", "document_type"], group_by="land, document_type", limit_page_length=0,
		):
			key_docs.setdefault(d.land, set()).add(d.document_type)
		overdue = _grouped("Sijil Follow Up", "land", names, {"status": "Open", "due_date": ["<", nowdate()]})
		for r in rows:
			r.update(
				open_cases=open_cases.get(r.name, 0), total_cases=all_cases.get(r.name, 0),
				open_followups=followups.get(r.name, 0), overdue_followups=overdue.get(r.name, 0),
				documents=documents.get(r.name, 0),
				key_documents=sorted(key_docs.get(r.name, set()), key=KEY_DOCUMENT_TYPES.index),
			)
	return page_response(total, rows, start, page_length)


@frappe.whitelist()
def get_land(name):
	doc = frappe.get_doc("Sijil Land", name)
	doc.check_permission("read")
	today = nowdate()
	stale_days = cint(get_settings().stale_case_days) or 14
	open_case = {"land": name, "status": ["not in", list(CASE_CLOSED_STATUSES)]}
	people = user_names([r.user for r in doc.responsibles])
	orgs = labels("Sijil External Organization", [r.organization for r in doc.organizations], "organization_type")
	data = doc.as_dict()
	data["responsibles"] = [
		{"user": r.user, "full_name": people.get(r.user) or r.user, "responsibility": r.responsibility}
		for r in doc.responsibles
	]
	data["organizations"] = [
		{"organization": r.organization, "role": r.role, "organization_type": orgs.get(r.organization)}
		for r in doc.organizations
	]
	data["stats"] = {
		"cases_total": count("Sijil Case", {"land": name}),
		"cases_open": count("Sijil Case", open_case),
		"cases_stale": count("Sijil Case", {**open_case, "last_update_date": ["<", add_days(today, -stale_days)]}),
		"followups_open": count("Sijil Follow Up", {"land": name, "status": "Open"}),
		"followups_overdue": count("Sijil Follow Up", {"land": name, "status": "Open", "due_date": ["<", today]}),
		"tasks_open": count("Sijil Task", {"land": name, "status": ["in", ["Open", "In Progress"]]}),
		"documents": count("Sijil Document", {"land": name}),
		"events": count("Sijil Case Event", {"land": name, "entry_status": "Active"}),
	}
	data["key_documents"] = key_documents(name)
	data["can_write"] = bool(doc.has_permission("write"))
	return data


@frappe.whitelist()
def land_activity(land, start=0, page_length=15):
	"""Latest developments across all cases of a land."""
	frappe.has_permission("Sijil Land", "read", land, throw=True)
	start, page_length = paging(start, page_length)
	filters = {"land": land, "entry_status": "Active"}
	total = count("Sijil Case Event", filters)
	rows = frappe.get_list(
		"Sijil Case Event", filters=filters,
		fields=["name", "title", "case", "event_date", "event_type", "recorded_by", "is_milestone"],
		order_by="event_date desc, creation desc", start=start, page_length=page_length,
	)
	titles = labels("Sijil Case", [r.case for r in rows], "title")
	people = user_names([r.recorded_by for r in rows])
	for r in rows:
		r["case_title"] = titles.get(r.case)
		r["recorded_by_name"] = people.get(r.recorded_by)
	return page_response(total, rows, start, page_length)


@frappe.whitelist()
def save_land(data):
	data = parse(data, {})
	name = data.get("name")
	if name:
		doc = frappe.get_doc("Sijil Land", name)
		doc.check_permission("write")
	else:
		doc = frappe.new_doc("Sijil Land")
	for field in ("land_name", "land_code", "status", "city", "company", "location", "description", "notes", "project"):
		if field in data:
			doc.set(field, data.get(field) or None if field in ("project", "company", "land_code") else data.get(field))
	if "responsibles" in data:
		doc.set("responsibles", [])
		for row in data["responsibles"] or []:
			if row.get("user"):
				doc.append("responsibles", {"user": row["user"], "responsibility": row.get("responsibility")})
	if "organizations" in data:
		doc.set("organizations", [])
		for row in data["organizations"] or []:
			if row.get("organization"):
				doc.append("organizations", {"organization": row["organization"], "role": row.get("role")})
	doc.save()
	if cint(data.get("create_project")) and not doc.project:
		erp.create_project_for_land(doc)
	return {"name": doc.name}


@frappe.whitelist()
def create_project(land):
	"""Create (or return) the ERPNext Project for a land."""
	doc = frappe.get_doc("Sijil Land", land)
	doc.check_permission("write")
	return {"project": erp.create_project_for_land(doc)}


def key_documents(land):
	"""The three key documents of a land in fixed order; the latest non-archived one of each type, or None."""
	latest = {}
	for d in frappe.get_list(
		"Sijil Document",
		filters={"land": land, "document_type": ["in", list(KEY_DOCUMENT_TYPES)], "archived": 0},
		fields=["name", "title", "document_type", "document_date", "reference_no", "version_count", "modified"],
		order_by="modified desc", limit_page_length=50,
	):
		latest.setdefault(d.document_type, d)
	return [{"document_type": t, "document": latest.get(t)} for t in KEY_DOCUMENT_TYPES]
