# Copyright (c) 2026, SIJIL and contributors
# License: MIT. See license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import getdate, now_datetime, nowdate

from sijil.utils import throw_immutable


class SijilCaseEvent(Document):
	"""A first-class, chronological business development of a case.

	Events are append-only.  A mistake is fixed by recording a *correction*
	(see sijil.services.cases.correct_event): the wrong entry stays visible,
	marked Superseded, and links to the entry that replaces it.
	"""

	def before_validate(self):
		if not self.is_new():
			throw_immutable("Case events")

	def validate(self):
		case = frappe.db.get_value("Sijil Case", self.case, ["land", "status"], as_dict=True)
		if not case:
			frappe.throw(_("Case {0} does not exist.").format(self.case))
		self.land = case.land
		self.title = (self.title or "").strip()
		if getdate(self.event_date) > getdate(nowdate()):
			frappe.throw(
				_("An event records something that already happened. Use a follow-up for future actions."),
				title=_("Invalid Event Date"),
			)
		self.recorded_by = frappe.session.user
		self.recorded_on = now_datetime()
		self.entry_status = "Active" if not self.entry_status else self.entry_status

	def after_insert(self):
		self.apply_to_case()

	def apply_to_case(self):
		"""Reflect this event on its case: last update, situation, status."""
		case = frappe.get_doc("Sijil Case", self.case)
		latest = frappe.db.get_value(
			"Sijil Case Event",
			{"case": self.case, "entry_status": "Active", "name": ["!=", self.name]},
			"max(event_date)",
		)
		is_latest = not latest or getdate(self.event_date) >= getdate(latest)

		changed = False
		if not case.last_update_date or getdate(self.event_date) > getdate(case.last_update_date):
			case.last_update_date = self.event_date
			changed = True
		# A back-dated event must not overwrite a newer situation or status.
		if is_latest:
			if self.situation_update and self.situation_update.strip() != (case.current_situation or "").strip():
				case.current_situation = self.situation_update.strip()
				changed = True
			if self.status_after and self.status_after != case.status:
				case.status = self.status_after
				changed = True
		if changed:
			case.flags.ignore_permissions = True
			case.save()

	def on_trash(self):
		throw_immutable("Case events")
