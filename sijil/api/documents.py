import frappe
from frappe import _
from frappe.utils import cint

from sijil.api.common import count, page_response, paging, parse, user_names
from sijil.services import documents as documents_service
from sijil.services import folders as folder_service

DOC_FIELDS = [
	"name", "title", "land", "folder", "document_type", "reference_no", "document_date", "is_confidential",
	"archived", "current_version", "version_count", "owner", "creation", "modified",
]


def _decorate_documents(rows):
	versions = {}
	names = [r.current_version for r in rows if r.current_version]
	if names:
		for v in frappe.db.get_all(
			"Sijil Document Version", filters={"name": ["in", names]},
			fields=["name", "version_no", "file", "file_name", "file_size", "creation"],
		):
			versions[v.name] = v
	people = user_names([r.owner for r in rows])
	link_counts = {}
	if rows:
		for r in frappe.db.get_all(
			"Sijil Document Link", filters={"document": ["in", [r.name for r in rows]]},
			fields=["document", "count(name) as c"], group_by="document",
		):
			link_counts[r.document] = r.c
	for r in rows:
		r["version"] = versions.get(r.current_version)
		r["owner_name"] = people.get(r.owner)
		r["links"] = link_counts.get(r.name, 0)
	return rows


@frappe.whitelist()
def library(land, folder=None, search=None, document_type=None, recursive=0, start=0, page_length=24):
	"""One screen of the library: breadcrumbs, subfolders and a page of documents."""
	frappe.has_permission("Sijil Land", "read", land, throw=True)
	start, page_length = paging(start, page_length)
	root = frappe.db.get_value("Sijil Land", land, "root_folder")
	folder = folder or root

	if folder:
		folder_land = frappe.db.get_value("Sijil Folder", folder, "land")
		if folder_land != land:
			frappe.throw(_("This folder does not belong to the selected land."), frappe.PermissionError)

	all_folders = frappe.get_list(
		"Sijil Folder", filters={"land": land}, fields=["name", "folder_name", "parent_folder", "is_root", "folder_path"],
		order_by="folder_name asc", limit_page_length=2000,
	)
	doc_counts = {
		r.folder: r.c
		for r in frappe.db.get_all("Sijil Document", filters={"land": land}, fields=["folder", "count(name) as c"], group_by="folder")
	}
	for f in all_folders:
		f["document_count"] = doc_counts.get(f.name, 0)
		f["child_count"] = sum(1 for x in all_folders if x.parent_folder == f.name)

	filters = {"land": land}
	or_filters = None
	searching = bool(search) or bool(document_type) or cint(recursive)
	if document_type:
		filters["document_type"] = document_type
	if search:
		like = f"%{search.strip()}%"
		or_filters = {"title": ["like", like], "reference_no": ["like", like], "description": ["like", like]}
	if not searching:
		filters["folder"] = folder
	elif cint(recursive) and folder:
		subtree = [f.name for f in all_folders if f.name == folder or f"/{folder}/" in (f.folder_path or "")]
		filters["folder"] = ["in", subtree]
	total = count("Sijil Document", filters, or_filters)
	rows = frappe.get_list(
		"Sijil Document", filters=filters, or_filters=or_filters, fields=DOC_FIELDS,
		order_by="title asc", start=start, page_length=page_length,
	)
	folder_names = {f.name: f.folder_name for f in all_folders}
	for r in rows:
		r["folder_name"] = folder_names.get(r.folder)
	return {
		"root": root,
		"folder": folder,
		"breadcrumbs": folder_service.breadcrumbs(folder),
		"tree": all_folders,
		"children": [f for f in all_folders if f.parent_folder == folder],
		"documents": page_response(total, _decorate_documents(rows), start, page_length),
		"searching": searching,
	}


@frappe.whitelist()
def get_document(name):
	doc = frappe.get_doc("Sijil Document", name)
	doc.check_permission("read")
	data = doc.as_dict()
	data["land_name"] = frappe.db.get_value("Sijil Land", doc.land, "land_name")
	data["breadcrumbs"] = folder_service.breadcrumbs(doc.folder)
	versions = frappe.get_list(
		"Sijil Document Version", filters={"document": name},
		fields=["name", "version_no", "file", "file_name", "file_size", "notes", "uploaded_by", "creation", "is_current"],
		order_by="version_no desc", limit_page_length=100,
	)
	people = user_names([v.uploaded_by for v in versions])
	for v in versions:
		v["uploaded_by_name"] = people.get(v.uploaded_by)
	data["versions"] = versions
	links = frappe.get_list(
		"Sijil Document Link", filters={"document": name},
		fields=["name", "linked_doctype", "linked_name", "document_version", "follow_latest", "linked_by", "creation"],
		limit_page_length=200,
	)
	title_fields = {"Sijil Land": "land_name", "Sijil Case": "title", "Sijil Case Event": "title",
		"Sijil Task": "title", "Sijil Follow Up": "title"}
	for link in links:
		link["title"] = frappe.db.get_value(link.linked_doctype, link.linked_name, title_fields[link.linked_doctype])
		link["version_no"] = frappe.db.get_value("Sijil Document Version", link.document_version, "version_no")
	data["links"] = links
	data["can_write"] = bool(doc.has_permission("write"))
	return data


@frappe.whitelist()
def update_document(name, data):
	data = parse(data, {})
	doc = frappe.get_doc("Sijil Document", name)
	doc.check_permission("write")
	for field in ("title", "document_type", "reference_no", "document_date", "description", "is_confidential",
			"archived", "folder"):
		if field in data:
			doc.set(field, data[field] if data[field] != "" else None)
	doc.save()
	return {"name": doc.name}


@frappe.whitelist()
def create_folder(land, folder_name, parent=None):
	frappe.has_permission("Sijil Land", "read", land, throw=True)
	frappe.has_permission("Sijil Folder", "create", throw=True)
	doc = frappe.get_doc(
		{"doctype": "Sijil Folder", "folder_name": folder_name, "land": land, "parent_folder": parent or None}
	)
	doc.insert()
	return {"name": doc.name}


@frappe.whitelist()
def rename_folder(name, folder_name):
	doc = frappe.get_doc("Sijil Folder", name)
	doc.check_permission("write")
	if doc.is_root:
		frappe.throw(_("The root folder takes the name of the land."))
	doc.folder_name = folder_name
	doc.save()
	return {"name": doc.name}


@frappe.whitelist()
def move_folder(name, parent):
	doc = frappe.get_doc("Sijil Folder", name)
	doc.check_permission("write")
	if doc.is_root:
		frappe.throw(_("The root folder cannot be moved."))
	doc.parent_folder = parent
	doc.save()
	return {"name": doc.name}


@frappe.whitelist()
def delete_folder(name):
	frappe.delete_doc("Sijil Folder", name)
	return {"name": name}


@frappe.whitelist()
def move_document(name, folder):
	doc = frappe.get_doc("Sijil Document", name)
	doc.check_permission("write")
	doc.folder = folder
	doc.save()
	return {"name": doc.name}


def _uploaded_file():
	files = frappe.request.files if frappe.request else None
	if not files or "file" not in files:
		frappe.throw(_("No file was uploaded."))
	upload = files["file"]
	return upload.filename, upload.stream.read()


@frappe.whitelist(methods=["POST"])
def upload_document():
	"""Multipart upload: file + land, folder, title, document_type, ... in the form."""
	filename, content = _uploaded_file()
	values = {k: v for k, v in frappe.form_dict.items() if k != "cmd"}
	result = documents_service.create_document(values, filename, content)
	if values.get("link_doctype") and values.get("link_name"):
		documents_service.link_document(result["document"], values["link_doctype"], values["link_name"])
	return result


@frappe.whitelist(methods=["POST"])
def upload_version(document, notes=None):
	filename, content = _uploaded_file()
	return {"version": documents_service.add_version(document, filename, content, notes)}


@frappe.whitelist()
def link_document(document, linked_doctype, linked_name, document_version=None, follow_latest=0, note=None):
	return {"name": documents_service.link_document(
		document, linked_doctype, linked_name, document_version, follow_latest, note)}


@frappe.whitelist()
def unlink_document(link):
	doc = frappe.get_doc("Sijil Document Link", link)
	doc.check_permission("delete")
	frappe.delete_doc("Sijil Document Link", link)
	return {"name": link}


@frappe.whitelist()
def linked_documents(linked_doctype, linked_name):
	frappe.has_permission(linked_doctype, "read", linked_name, throw=True)
	return [d for d in documents_service.links_for(linked_doctype, linked_name) if d]


@frappe.whitelist()
def search_documents(land, query=None, limit=20):
	"""Light lookup used by the "attach existing document" picker."""
	frappe.has_permission("Sijil Land", "read", land, throw=True)
	filters = {"land": land, "archived": 0}
	or_filters = {"title": ["like", f"%{query}%"], "reference_no": ["like", f"%{query}%"]} if query else None
	return frappe.get_list(
		"Sijil Document", filters=filters, or_filters=or_filters,
		fields=["name", "title", "document_type", "version_count", "current_version"],
		order_by="modified desc", page_length=min(cint(limit), 50),
	)
