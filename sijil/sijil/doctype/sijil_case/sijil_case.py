# Copyright (c) 2026, SIJIL and contributors
# License: MIT. See license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import getdate, now_datetime, nowdate

from sijil.utils import CASE_CLOSED_STATUSES


class SijilCase(Document):
	def validate(self):
		self.title = (self.title or "").strip()
		if self.target_date and self.start_date and getdate(self.target_date) < getdate(self.start_date):
			frappe.throw(_("Target Date cannot be before Start Date."))

		land_status = frappe.db.get_value("Sijil Land", self.land, "status")
		if self.is_new() and land_status == "Archived":
			frappe.throw(_("Cannot add a case to an archived land."))

		for row in self.get("relations"):
			if row.related_case == self.name:
				frappe.throw(_("Row {0}: a case cannot be related to itself.").format(row.idx))

		if not self.is_new():
			before = self.get_doc_before_save()
			if before and before.land != self.land:
				frappe.throw(_("A case cannot be moved to another land."))
			if before and (before.current_situation or "") != (self.current_situation or ""):
				self.situation_updated_on = now_datetime()
		elif self.current_situation:
			self.situation_updated_on = now_datetime()

		if not self.last_update_date:
			self.last_update_date = self.start_date or nowdate()

	def on_trash(self):
		if frappe.db.exists("Sijil Case Event", {"case": self.name}):
			frappe.throw(
				_("This case has recorded developments and cannot be deleted. Set its status to Cancelled instead."),
				title=_("History Is Preserved"),
			)
		for doctype in ("Sijil Follow Up", "Sijil Task"):
			if frappe.db.exists(doctype, {"case": self.name}):
				frappe.throw(
					_("This case still has related follow-ups or tasks and cannot be deleted."),
					title=_("Cannot Delete"),
				)

	@property
	def is_closed(self):
		return self.status in CASE_CLOSED_STATUSES
