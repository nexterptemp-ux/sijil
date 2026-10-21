# Copyright (c) 2026, SIJIL and contributors
# License: MIT. See license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class SijilFolder(Document):
	def validate(self):
		self.folder_name = (self.folder_name or "").strip()
		if not self.folder_name:
			frappe.throw(_("Folder Name is required."))
		if "/" in self.folder_name or "\\" in self.folder_name:
			frappe.throw(_("A folder name cannot contain slashes."))

		if self.parent_folder:
			parent = frappe.db.get_value(
				"Sijil Folder", self.parent_folder, ["land", "folder_path"], as_dict=True
			)
			if not parent:
				frappe.throw(_("Parent folder {0} does not exist.").format(self.parent_folder))
			if parent.land != self.land:
				frappe.throw(_("A folder and its parent must belong to the same land."))
			if not self.is_new() and (
				self.parent_folder == self.name or f"/{self.name}/" in (parent.folder_path or "")
			):
				frappe.throw(_("A folder cannot be moved into itself or one of its subfolders."))

		self.validate_unique_sibling()

	def validate_unique_sibling(self):
		siblings = frappe.db.get_all(
			"Sijil Folder",
			filters={"land": self.land, "parent_folder": self.parent_folder or ["is", "not set"], "name": ["!=", self.name]},
			pluck="folder_name",
		)
		if self.folder_name.lower() in [s.lower() for s in siblings]:
			frappe.throw(_("A folder named {0} already exists here.").format(self.folder_name))

	def after_insert(self):
		self.set_path()

	def on_update(self):
		if not self.flags.in_insert and self.has_value_changed("parent_folder"):
			old_path = self.folder_path
			self.set_path()
			self.update_descendant_paths(old_path)

	def set_path(self):
		parent_path = ""
		if self.parent_folder:
			parent_path = frappe.db.get_value("Sijil Folder", self.parent_folder, "folder_path") or ""
		path = f"{parent_path or '/'}{self.name}/"
		self.folder_path = path
		frappe.db.set_value("Sijil Folder", self.name, "folder_path", path, update_modified=False)

	def update_descendant_paths(self, old_path):
		if not old_path or old_path == self.folder_path:
			return
		frappe.db.sql(
			"""update `tabSijil Folder`
			set folder_path = concat(%(new)s, substr(folder_path, %(cut)s))
			where folder_path like %(like)s and name != %(name)s""",
			{"new": self.folder_path, "cut": len(old_path) + 1, "like": old_path + "%", "name": self.name},
		)

	def on_trash(self):
		if self.is_root and not frappe.flags.get("sijil_land_delete") and frappe.db.exists("Sijil Land", self.land):
			frappe.throw(_("The root folder of a land cannot be deleted."))
		if frappe.db.exists("Sijil Folder", {"parent_folder": self.name}):
			frappe.throw(_("This folder contains subfolders. Move or delete them first."))
		if frappe.db.exists("Sijil Document", {"folder": self.name}):
			frappe.throw(_("This folder contains documents. Move them first."))
