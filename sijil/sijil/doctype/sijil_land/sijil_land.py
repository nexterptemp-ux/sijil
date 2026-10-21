# Copyright (c) 2026, SIJIL and contributors
# License: MIT. See license.txt

import frappe
from frappe import _
from frappe.model.document import Document

from sijil.integrations import erpnext as erp
from sijil.utils import flag, setting


class SijilLand(Document):
	def validate(self):
		self.land_name = (self.land_name or "").strip()
		if not self.land_name:
			frappe.throw(_("Land / Project Name is required."))
		seen = set()
		for row in self.get("responsibles"):
			if row.user in seen:
				frappe.throw(_("Row {0}: {1} is listed more than once as responsible.").format(row.idx, row.user))
			seen.add(row.user)
		if not self.company:
			self.company = setting("default_company")
		if self.project and not flag("enable_project_integration") and self.is_new():
			frappe.msgprint(_("Project integration is disabled in Sijil Settings."), indicator="orange", alert=True)

	def after_insert(self):
		if not self.land_code:
			frappe.db.set_value(self.doctype, self.name, "land_code", self.name, update_modified=False)
			self.land_code = self.name
		from sijil.services import folders

		folders.create_land_folders(self)
		if flag("enable_project_integration") and flag("auto_create_project") and not self.project:
			try:
				erp.create_project_for_land(self)
			except Exception:
				frappe.log_error(title="SIJIL: could not auto-create Project")
				frappe.msgprint(_("The land was saved but its ERPNext Project could not be created."), indicator="orange")

	def on_update(self):
		root = self.get("root_folder")
		if root and frappe.db.exists("Sijil Folder", root):
			frappe.db.set_value("Sijil Folder", root, "folder_name", self.land_name, update_modified=False)

	def on_trash(self):
		for doctype, label in (
			("Sijil Case", "cases"),
			("Sijil Task", "tasks"),
			("Sijil Follow Up", "follow-ups"),
			("Sijil Document", "documents"),
		):
			if frappe.db.exists(doctype, {"land": self.name}):
				frappe.throw(
					_("This land still has {0}. Archive it instead of deleting it.").format(_(label)),
					title=_("Cannot Delete"),
				)
		# Only empty folders are left at this point (root + template folders).
		frappe.flags.sijil_land_delete = True
		frappe.db.set_value("Sijil Land", self.name, "root_folder", None, update_modified=False)
		try:
			for folder in frappe.db.get_all(
				"Sijil Folder", filters={"land": self.name}, pluck="name", order_by="length(folder_path) desc"
			):
				frappe.delete_doc("Sijil Folder", folder, force=True, ignore_permissions=True)
		finally:
			frappe.flags.sijil_land_delete = False
