"""Case developments: recording events and correcting them without rewriting history."""

import frappe
from frappe import _
from frappe.utils import cint, nowdate

from sijil.services import documents as documents_service

EVENT_FIELDS = (
	"event_date",
	"event_time",
	"title",
	"description",
	"event_type",
	"communication_method",
	"external_organization",
	"outcome",
	"situation_update",
	"status_after",
	"is_milestone",
)


def _event_values(data):
	values = {k: data.get(k) for k in EVENT_FIELDS if data.get(k) not in (None, "")}
	values["is_milestone"] = cint(data.get("is_milestone"))
	return values


def add_event(data):
	"""Record a development.  `data['documents']` is a list of document names (or
	{"document", "version"} dicts) to link to the new event."""
	case = data.get("case")
	frappe.has_permission("Sijil Case", "read", case, throw=True)
	land = frappe.db.get_value("Sijil Case", case, "land")
	doc = frappe.get_doc({"doctype": "Sijil Case Event", "case": case, "land": land, **_event_values(data)})
	if data.get("source_followup"):
		doc.source_followup = data["source_followup"]
	doc.insert()
	link_documents(doc.name, data.get("documents"))
	return doc


def link_documents(event, documents):
	for item in documents or []:
		if isinstance(item, str):
			item = {"document": item}
		documents_service.link_document(
			item["document"], "Sijil Case Event", event, item.get("version"), item.get("follow_latest", 0)
		)


def correct_event(name, data, reason):
	"""Replace a wrong event by a corrected one.

	The original stays in the history, flagged Superseded and pointing at its
	replacement; documents linked to it are carried over to the new entry.
	"""
	reason = (reason or "").strip()
	if not reason:
		frappe.throw(_("A reason is required to correct a recorded event."))
	old = frappe.get_doc("Sijil Case Event", name)
	old.check_permission("read")
	frappe.has_permission("Sijil Case", "write", old.case, throw=True)
	if old.entry_status == "Superseded":
		frappe.throw(_("This event has already been corrected."))

	merged = {f: old.get(f) for f in EVENT_FIELDS}
	# A correction never re-applies an old situation/status change implicitly.
	merged["situation_update"] = None
	merged["status_after"] = None
	merged.update({k: v for k, v in (data or {}).items() if k in EVENT_FIELDS})
	new = frappe.get_doc(
		{
			"doctype": "Sijil Case Event",
			"case": old.case,
			"corrects": old.name,
			"correction_reason": reason,
			"source_followup": old.source_followup,
			**_event_values(merged),
		}
	)
	new.insert()

	frappe.db.set_value(
		"Sijil Case Event",
		old.name,
		{"entry_status": "Superseded", "superseded_by": new.name},
		update_modified=True,
	)
	for link in frappe.db.get_all(
		"Sijil Document Link",
		filters={"linked_doctype": "Sijil Case Event", "linked_name": old.name},
		fields=["document", "document_version", "follow_latest"],
	):
		documents_service.link_document(
			link.document, "Sijil Case Event", new.name, link.document_version, link.follow_latest
		)
	return new


def update_case_situation(case, situation, status=None, title=None, event_date=None):
	"""Change the current situation *through* an event so the change is recorded."""
	return add_event(
		{
			"case": case,
			"title": title or _("Current situation updated"),
			"description": situation,
			"event_type": "Update",
			"event_date": event_date or nowdate(),
			"situation_update": situation,
			"status_after": status,
		}
	)


def events_page(case, start=0, page_length=20, include_superseded=1):
	filters = {"case": case}
	if not cint(include_superseded):
		filters["entry_status"] = "Active"
	total = frappe.get_list("Sijil Case Event", filters=filters, fields=["count(name) as c"])[0].c
	rows = frappe.get_list(
		"Sijil Case Event",
		filters=filters,
		fields=[
			"name", "title", "description", "event_date", "event_time", "event_type", "communication_method",
			"external_organization", "outcome", "situation_update", "status_after", "is_milestone", "recorded_by",
			"recorded_on", "entry_status", "corrects", "superseded_by", "correction_reason", "source_followup",
		],
		order_by="event_date desc, creation desc",
		start=cint(start),
		page_length=cint(page_length),
	)
	return total, rows
