# Copyright (c) 2026, SIJIL and contributors
# License: MIT. See license.txt

import frappe
from frappe import _
from frappe.model.document import Document

from sijil.utils import is_manager


class SijilDocumentLink(Document):
	"""Connects one logical document to a land, case, event, task or follow-up.

	The *file* is stored once (Sijil Document Version).  A link normally pins the
	version that was current when the link was made, so a historical event keeps
	pointing at the exact approved file even after newer versions are uploaded.
	"""

	def validate(self):
		document = frappe.db.get_value("Sijil Document", self.document, ["land", "current_version"], as_dict=True)
		if not document:
			frappe.throw(_("Document {0} does not exist.").format(self.document))
		if not frappe.db.exists(self.linked_doctype, self.linked_name):
			frappe.throw(_("{0} {1} does not exist.").format(_(self.linked_doctype), self.linked_name))

		self.land = self.get_linked_land()
		if self.land and self.land != document.land:
			frappe.throw(_("The document and the record it is linked to must belong to the same land."))

		if self.follow_latest:
			self.document_version = document.current_version
		elif not self.document_version:
			self.document_version = document.current_version
		elif frappe.db.get_value("Sijil Document Version", self.document_version, "document") != self.document:
			frappe.throw(_("The selected version does not belong to this document."))

		if self.is_new():
			self.linked_by = frappe.session.user
			if frappe.db.exists(
				"Sijil Document Link",
				{"document": self.document, "linked_doctype": self.linked_doctype, "linked_name": self.linked_name},
			):
				frappe.throw(_("This document is already linked to {0} {1}.").format(_(self.linked_doctype), self.linked_name))

	def get_linked_land(self):
		if self.linked_doctype == "Sijil Land":
			return self.linked_name
		return frappe.db.get_value(self.linked_doctype, self.linked_name, "land")

	def on_trash(self):
		if self.linked_doctype == "Sijil Case Event" and not is_manager():
			frappe.throw(
				_("Documents linked to a recorded event can only be unlinked by a manager."),
				title=_("History Is Preserved"),
			)
