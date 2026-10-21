# Copyright (c) 2026, SIJIL and contributors
# License: MIT. See license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import getdate, now_datetime, nowdate

from sijil.integrations import erpnext as erp


class SijilTask(Document):
	def validate(self):
		self.title = (self.title or "").strip()
		if self.case:
			case = frappe.db.get_value("Sijil Case", self.case, ["land"], as_dict=True)
			if not case:
				frappe.throw(_("Case {0} does not exist.").format(self.case))
			if self.land and self.land != case.land:
				frappe.throw(_("The case does not belong to the selected land."))
			self.land = case.land
		if self.case_event:
			event_case = frappe.db.get_value("Sijil Case Event", self.case_event, "case")
			if event_case != self.case:
				frappe.throw(_("The related event does not belong to the selected case."))
		if self.start_date and self.due_date and getdate(self.due_date) < getdate(self.start_date):
			frappe.throw(_("Due Date cannot be before Start Date."))

		before = self.get_doc_before_save()
		if self.status == "Completed":
			self.completed_on = self.completed_on or nowdate()
		else:
			self.completed_on = None
		if before and before.status != self.status:
			note = _("Status changed from {0} to {1}").format(_(before.status), _(self.status))
			if self.flags.get("from_erpnext"):
				note += " (" + _("synced from ERPNext Task") + ")"
			self.append("updates", {"update_on": now_datetime(), "user": frappe.session.user, "note": note})

	def on_update(self):
		erp.sync_todo(
			self,
			self.assigned_to,
			_("Task: {0}").format(self.title),
			self.due_date,
			self.priority,
			self.status in ("Open", "In Progress"),
		)
		erp.sync_erpnext_task(self)

	def on_trash(self):
		erp.delete_todo(self)
