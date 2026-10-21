"""Follow-up workflows."""

import frappe
from frappe import _
from frappe.utils import nowdate

from sijil.services import cases as case_service


def create_followup(data):
	doc = frappe.get_doc(
		{
			"doctype": "Sijil Follow Up",
			"title": data.get("title"),
			"description": data.get("description"),
			"case": data.get("case") or None,
			"land": data.get("land") or None,
			"assigned_to": data.get("assigned_to") or frappe.session.user,
			"due_date": data.get("due_date"),
			"priority": data.get("priority") or "Medium",
			"originating_event": data.get("originating_event") or None,
			"reminder_days_before": data.get("reminder_days_before"),
		}
	)
	doc.insert()
	return doc


def complete_followup(name, outcome, event=None, next_followup=None, documents=None):
	"""Complete a follow-up, record its outcome as a case event and optionally
	schedule the next follow-up -- as one transaction.

	Concurrency / duplicate protection: the follow-up row is locked (FOR UPDATE) and
	re-checked, so a double click or two users completing the same follow-up can
	produce at most one event and one next follow-up.
	"""
	outcome = (outcome or "").strip()
	if not outcome:
		frappe.throw(_("Please describe the actual outcome of this follow-up."))

	frappe.db.get_value("Sijil Follow Up", name, "status", for_update=True)
	followup = frappe.get_doc("Sijil Follow Up", name)
	followup.check_permission("write")
	if followup.status != "Open":
		frappe.throw(_("This follow-up is already {0}.").format(_(followup.status)), title=_("Already Closed"))

	result_event = None
	if followup.case:
		event = dict(event or {})
		event.setdefault("title", _("Follow-up result: {0}").format(followup.title))
		event.setdefault("description", outcome)
		event.setdefault("event_date", nowdate())
		event.setdefault("event_type", "Contact")
		event["outcome"] = outcome
		event["case"] = followup.case
		event["source_followup"] = followup.name
		event["documents"] = documents
		result_event = case_service.add_event(event)

	next_doc = None
	if next_followup and next_followup.get("due_date"):
		next_doc = create_followup(
			{
				"title": next_followup.get("title") or followup.title,
				"description": next_followup.get("description"),
				"case": followup.case,
				"land": followup.land,
				"assigned_to": next_followup.get("assigned_to") or followup.assigned_to,
				"due_date": next_followup["due_date"],
				"priority": next_followup.get("priority") or followup.priority,
				"originating_event": result_event.name if result_event else followup.originating_event,
			}
		)

	followup.status = "Completed"
	followup.completion_date = nowdate()
	followup.outcome = outcome
	followup.result_event = result_event.name if result_event else None
	followup.next_followup = next_doc.name if next_doc else None
	followup.flags.ignore_permissions = True
	followup.save()
	return {
		"followup": followup.name,
		"event": result_event.name if result_event else None,
		"next_followup": next_doc.name if next_doc else None,
	}


def cancel_followup(name, reason=None):
	frappe.db.get_value("Sijil Follow Up", name, "status", for_update=True)
	followup = frappe.get_doc("Sijil Follow Up", name)
	followup.check_permission("write")
	if followup.status != "Open":
		frappe.throw(_("This follow-up is already {0}.").format(_(followup.status)), title=_("Already Closed"))
	followup.status = "Cancelled"
	if reason:
		followup.outcome = reason
	followup.save()
	return followup


def reschedule_followup(name, due_date, assigned_to=None):
	followup = frappe.get_doc("Sijil Follow Up", name)
	followup.check_permission("write")
	if followup.status != "Open":
		frappe.throw(_("Only open follow-ups can be rescheduled."))
	followup.due_date = due_date
	if assigned_to:
		followup.assigned_to = assigned_to
	followup.save()
	return followup
