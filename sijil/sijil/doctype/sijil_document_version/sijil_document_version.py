# Copyright (c) 2026, SIJIL and contributors
# License: MIT. See license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class SijilDocumentVersion(Document):
	"""One stored file of a logical Sijil Document.  Immutable once created."""

	def before_validate(self):
		if not self.is_new():
			frappe.throw(_("Document versions cannot be edited. Upload a new version instead."))

	def validate(self):
		if not frappe.db.exists("Sijil Document", self.document):
			frappe.throw(_("Document {0} does not exist.").format(self.document))
		# Serialise concurrent uploads for the same document.
		frappe.db.get_value("Sijil Document", self.document, "name", for_update=True)
		last = frappe.db.get_value("Sijil Document Version", {"document": self.document}, "max(version_no)") or 0
		self.version_no = int(last) + 1
		self.uploaded_by = frappe.session.user

		file = frappe.db.get_value(
			"File",
			{"file_url": self.file},
			["name", "file_name", "file_size", "is_private"],
			as_dict=True,
			order_by="creation desc",
		)
		if not file:
			frappe.throw(_("The uploaded file could not be found."))
		self.file_name = file.file_name
		self.file_size = file.file_size or 0
		self._file_docname = file.name
		self._file_is_private = file.is_private

	def after_insert(self):
		file = frappe.get_doc("File", self._file_docname)
		file.attached_to_doctype = self.doctype
		file.attached_to_name = self.name
		file.attached_to_field = "file"
		if not file.is_private:
			# Documents are never exposed through public URLs.
			file.is_private = 1
		file.flags.ignore_permissions = True
		file.save()
		if file.file_url != self.file:
			frappe.db.set_value(self.doctype, self.name, "file", file.file_url, update_modified=False)
			self.file = file.file_url

		previous = frappe.db.get_value("Sijil Document", self.document, "current_version")
		if previous:
			frappe.db.set_value("Sijil Document Version", previous, "is_current", 0, update_modified=False)
		frappe.db.set_value(self.doctype, self.name, "is_current", 1, update_modified=False)
		frappe.db.set_value(
			"Sijil Document",
			self.document,
			{"current_version": self.name, "version_count": self.version_no},
			update_modified=True,
		)

	def on_trash(self):
		if not frappe.flags.get("sijil_document_delete"):
			frappe.throw(
				_("Document versions cannot be deleted individually; this preserves the history of linked records."),
				title=_("History Is Preserved"),
			)
