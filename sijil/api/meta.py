import frappe
from frappe import _
from frappe.utils import cint, nowdate

from sijil.api.common import labels, select_options
from sijil.utils import get_settings, is_manager, user_display


@frappe.whitelist()
def bootstrap():
	"""Everything the single-page app needs on load."""
	settings = get_settings()
	return {
		"today": nowdate(),
		"user": {
			"name": frappe.session.user,
			"full_name": user_display(frappe.session.user),
			"is_manager": is_manager(),
			"image": frappe.db.get_value("User", frappe.session.user, "user_image"),
		},
		"lang": frappe.local.lang,
		"settings": {
			"stale_case_days": cint(settings.stale_case_days) or 14,
			"default_reminder_days": cint(settings.default_reminder_days),
			"restrict_to_assigned_lands": cint(settings.restrict_to_assigned_lands),
		},
		"options": {
			"case_status": [o for o in select_options("Sijil Case", "status") if o],
			"priority": [o for o in select_options("Sijil Case", "priority") if o],
			"land_status": [o for o in select_options("Sijil Land", "status") if o],
			"event_type": [o for o in select_options("Sijil Case Event", "event_type") if o],
			"communication_method": [o for o in select_options("Sijil Case Event", "communication_method") if o],
			"task_status": [o for o in select_options("Sijil Task", "status") if o],
			"document_type": [o for o in select_options("Sijil Document", "document_type") if o],
			"organization_type": [o for o in select_options("Sijil External Organization", "organization_type") if o],
		},
		"case_types": frappe.get_list("Sijil Case Type", pluck="name", limit_page_length=200),
		"can_create": {
			doctype: bool(frappe.has_permission(doctype, "create"))
			for doctype in ("Sijil Land", "Sijil Case", "Sijil Task", "Sijil Follow Up", "Sijil Document")
		},
	}


@frappe.whitelist()
def users(search=None):
	"""Enabled users that can be assigned work."""
	filters = {"enabled": 1, "user_type": "System User", "name": ["not in", ["Administrator", "Guest"]]}
	or_filters = None
	if search:
		like = f"%{search}%"
		or_filters = {"full_name": ["like", like], "name": ["like", like]}
	return frappe.db.get_all(
		"User",
		filters=filters,
		or_filters=or_filters,
		fields=["name", "full_name", "user_image"],
		order_by="full_name asc",
		limit_page_length=200,
	)


@frappe.whitelist()
def search(query):
	"""Global search across lands, cases, tasks, follow-ups and documents."""
	query = (query or "").strip()
	if len(query) < 2:
		return {}
	like = f"%{query}%"
	out = {}
	out["lands"] = frappe.get_list(
		"Sijil Land", or_filters={"land_name": ["like", like], "land_code": ["like", like], "city": ["like", like]},
		fields=["name", "land_name", "land_code", "city"], limit_page_length=5)
	cases = frappe.get_list(
		"Sijil Case", or_filters={"title": ["like", like], "reference_no": ["like", like], "name": ["like", like]},
		fields=["name", "title", "land", "status"], limit_page_length=6)
	land_names = labels("Sijil Land", [c.land for c in cases], "land_name")
	for case in cases:
		case["land_name"] = land_names.get(case.land)
	out["cases"] = cases
	out["tasks"] = frappe.get_list(
		"Sijil Task", or_filters={"title": ["like", like]}, fields=["name", "title", "status"], limit_page_length=5)
	out["followups"] = frappe.get_list(
		"Sijil Follow Up", or_filters={"title": ["like", like]}, fields=["name", "title", "due_date", "status"],
		limit_page_length=5)
	out["documents"] = frappe.get_list(
		"Sijil Document", or_filters={"title": ["like", like], "reference_no": ["like", like]},
		fields=["name", "title", "land", "folder"], limit_page_length=5)
	return out


LOOKUP = {
	# doctype: (title field, extra search fields, allowed filter keys)
	"Sijil Land": ("land_name", ["land_code", "city"], ()),
	"Sijil Case": ("title", ["reference_no"], ("land",)),
	"Sijil Case Event": ("title", [], ("case",)),
	"Sijil External Organization": ("organization_name", [], ()),
	"Sijil Case Type": ("type_name", [], ()),
	"Contact": ("full_name", [], ()),
	"Project": ("project_name", [], ()),
	"Company": ("name", [], ()),
}


@frappe.whitelist()
def lookup(doctype, txt=None, filters=None):
	"""Typeahead for link fields: [{value, label}] using each doctype's title field."""
	from sijil.api.common import parse

	if doctype not in LOOKUP:
		frappe.throw(_("Lookup is not available for {0}").format(doctype))
	title, extra, allowed = LOOKUP[doctype]
	flt = {k: v for k, v in (parse(filters, {}) or {}).items() if k in allowed}
	or_filters = None
	if txt:
		like = f"%{txt}%"
		or_filters = {f: ["like", like] for f in [title, "name", *extra]}
	rows = frappe.get_list(
		doctype, filters=flt, or_filters=or_filters, fields=["name", title], order_by="modified desc", page_length=12
	)
	return [{"value": r.name, "label": r.get(title) or r.name} for r in rows]


@frappe.whitelist()
def label_for(doctype, name):
	if doctype not in LOOKUP or not name:
		return None
	title = LOOKUP[doctype][0]
	return frappe.db.get_value(doctype, name, title)
