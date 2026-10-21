"""Document library services: logical documents, immutable versions and links."""

import frappe
from frappe import _
from frappe.utils import cint

LINKABLE = ("Sijil Land", "Sijil Case", "Sijil Case Event", "Sijil Task", "Sijil Follow Up")


def _store_file(filename, content, attached_to_doctype, attached_to_name):
	if not content:
		frappe.throw(_("The uploaded file is empty."))
	file = frappe.get_doc(
		{
			"doctype": "File",
			"file_name": filename,
			"content": content,
			"is_private": 1,  # documents are never published under /files
			"attached_to_doctype": attached_to_doctype,
			"attached_to_name": attached_to_name,
		}
	)
	file.save(ignore_permissions=True)
	return file


def create_document(values, filename, content):
	"""Create a logical document and its first version in one transaction."""
	land = values.get("land")
	frappe.has_permission("Sijil Land", "read", land, throw=True)
	doc = frappe.get_doc(
		{
			"doctype": "Sijil Document",
			"title": (values.get("title") or filename).strip(),
			"land": land,
			"folder": values.get("folder") or None,
			"document_type": values.get("document_type") or "",
			"reference_no": values.get("reference_no"),
			"document_date": values.get("document_date") or None,
			"description": values.get("description"),
			"is_confidential": cint(values.get("is_confidential")),
		}
	)
	doc.insert()
	version = add_version(doc.name, filename, content, values.get("notes"))
	return {"document": doc.name, "version": version}


def add_version(document, filename, content, notes=None):
	frappe.has_permission("Sijil Document", "write", document, throw=True)
	file = _store_file(filename, content, "Sijil Document", document)
	version = frappe.get_doc(
		{"doctype": "Sijil Document Version", "document": document, "file": file.file_url, "notes": notes}
	)
	version.insert()
	return version.name


def link_document(document, linked_doctype, linked_name, document_version=None, follow_latest=0, note=None):
	if linked_doctype not in LINKABLE:
		frappe.throw(_("Documents cannot be linked to {0}.").format(_(linked_doctype)))
	frappe.has_permission("Sijil Document", "read", document, throw=True)
	# Events are immutable, so attaching evidence needs read access only.
	right = "read" if linked_doctype == "Sijil Case Event" else "write"
	frappe.has_permission(linked_doctype, right, linked_name, throw=True)
	link = frappe.get_doc(
		{
			"doctype": "Sijil Document Link",
			"document": document,
			"document_version": document_version,
			"follow_latest": cint(follow_latest),
			"linked_doctype": linked_doctype,
			"linked_name": linked_name,
			"note": note,
		}
	)
	link.insert()
	return link.name


def links_for(linked_doctype, linked_name):
	"""Documents linked to a record, with the pinned version resolved."""
	links = frappe.get_list(
		"Sijil Document Link",
		filters={"linked_doctype": linked_doctype, "linked_name": linked_name},
		fields=["name", "document", "document_version", "follow_latest", "note", "linked_by", "creation"],
		order_by="creation desc",
		limit_page_length=200,
	)
	return [describe_link(link) for link in links]


def describe_link(link):
	doc = frappe.db.get_value(
		"Sijil Document",
		link.document,
		["title", "document_type", "current_version", "version_count", "land", "is_confidential"],
		as_dict=True,
	)
	if not doc:
		return None
	version_name = doc.current_version if link.follow_latest else (link.document_version or doc.current_version)
	version = frappe.db.get_value(
		"Sijil Document Version",
		version_name,
		["name", "version_no", "file", "file_name", "file_size", "creation", "uploaded_by"],
		as_dict=True,
	)
	return {
		"link": link.name,
		"document": link.document,
		"title": doc.title,
		"document_type": doc.document_type,
		"land": doc.land,
		"is_confidential": doc.is_confidential,
		"follow_latest": link.follow_latest,
		"note": link.note,
		"linked_by": link.linked_by,
		"linked_on": link.creation,
		"version": version,
		"has_newer_version": bool(version and doc.current_version and version.name != doc.current_version),
		"current_version_no": doc.version_count,
	}
