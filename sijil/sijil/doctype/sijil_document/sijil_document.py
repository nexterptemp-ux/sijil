# Copyright (c) 2026, SIJIL and contributors
# License: MIT. See license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class SijilDocument(Document):
	def validate(self):
		if not self.is_new():
			before = self.get_doc_before_save()
			if before and before.land != self.land:
				frappe.throw(_("A document cannot be moved to another land. Upload it there instead."))
		if not self.folder:
			self.folder = frappe.db.get_value("Sijil Land", self.land, "root_folder")
		if self.folder:
			folder_land = frappe.db.get_value("Sijil Folder", self.folder, "land")
			if folder_land != self.land:
				frappe.throw(_("The selected folder belongs to a different land."))

	def on_trash(self):
		if frappe.db.exists("Sijil Document Link", {"document": self.name}):
			frappe.throw(
				_("This document is linked to cases, events or tasks and cannot be deleted. Archive it instead."),
				title=_("Cannot Delete"),
			)
		frappe.flags.sijil_document_delete = True
		frappe.db.set_value("Sijil Document", self.name, "current_version", None, update_modified=False)
		for version in frappe.db.get_all("Sijil Document Version", filters={"document": self.name}, pluck="name"):
			frappe.delete_doc("Sijil Document Version", version, force=True, ignore_permissions=True)
		frappe.flags.sijil_document_delete = False
