# Copyright (c) 2026, SIJIL and contributors
# License: MIT. See license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, nowdate

from sijil.integrations import erpnext as erp
from sijil.utils import followup_state, refresh_case_followup_date, setting


class SijilFollowUp(Document):
	def validate(self):
		self.title = (self.title or "").strip()
		if not self.case and not self.land:
			frappe.throw(_("A follow-up must belong to a case or a land / project."))
		if self.case:
			case_land = frappe.db.get_value("Sijil Case", self.case, "land")
			if not case_land:
				frappe.throw(_("Case {0} does not exist.").format(self.case))
			if self.land and self.land != case_land:
				frappe.throw(_("The case does not belong to the selected land."))
			self.land = case_land
		if self.reminder_days_before in (None, ""):
			self.reminder_days_before = cint(setting("default_reminder_days", 1))

		before = self.get_doc_before_save()
		if before:
			if before.status in ("Completed", "Cancelled") and self.status != before.status:
				frappe.throw(_("A closed follow-up cannot be reopened. Create a new follow-up instead."))
			if before.status == "Completed":
				# Outcome and result are history; only notes may change.
				for field in ("due_date", "assigned_to", "case", "outcome"):
					if str(before.get(field) or "") != str(self.get(field) or ""):
						frappe.throw(_("A completed follow-up cannot be changed."))
		if self.status == "Completed" and not self.completion_date:
			self.completion_date = nowdate()

	@property
	def state(self):
		return followup_state(self.status, self.due_date)

	def on_update(self):
		is_open = self.status == "Open"
		who = self.assigned_to
		description = _("Follow-up: {0}").format(self.title)
		if self.case:
			description += " — " + (frappe.db.get_value("Sijil Case", self.case, "title") or self.case)
		erp.sync_todo(self, who, description, self.due_date, self.priority, is_open)
		erp.sync_calendar_event(self)
		if self.case:
			refresh_case_followup_date(self.case)

	def on_trash(self):
		if self.status == "Completed" and frappe.db.exists("Sijil Case Event", {"source_followup": self.name}):
			frappe.throw(
				_("A completed follow-up is part of the case history and cannot be deleted."),
				title=_("History Is Preserved"),
			)
		erp.delete_todo(self)
		erp.delete_calendar_event(self)

	def after_delete(self):
		if self.case:
			refresh_case_followup_date(self.case)
