"""Everything SIJIL does to / receives from standard ERPNext & Frappe features.

Integration points (all individually switchable in Sijil Settings):

* Project   - a Sijil Land can be linked to (or auto-create) an ERPNext Project.
* Task      - a Sijil Task of a land with a Project is mirrored to an ERPNext Task
              (two-way: status, dates, title).
* ToDo      - follow-ups and tasks create a ToDo for the assignee.
* Event     - follow-ups appear in the assignee's Frappe calendar.
* Notification Log / Email - reminders.
* Supplier / Customer / Contact - external organizations link to them.
* File      - documents are private Files attached to document versions.
"""

import json

import frappe
from frappe import _
from frappe.utils import get_datetime, getdate

from sijil.utils import flag, setting

TASK_STATUS_TO_ERP = {
	"Open": "Open",
	"In Progress": "Working",
	"Completed": "Completed",
	"Cancelled": "Cancelled",
}
ERP_STATUS_TO_TASK = {
	"Open": "Open",
	"Working": "In Progress",
	"Pending Review": "In Progress",
	"Completed": "Completed",
	"Cancelled": "Cancelled",
}


# ------------------------------------------------------------------ Project
def create_project_for_land(land):
	"""Create an ERPNext Project for a Sijil Land and link it. Returns Project name."""
	if land.project:
		return land.project
	company = land.company or setting("default_company") or frappe.defaults.get_global_default("company")
	if not company:
		frappe.throw(_("Set a Company on the land or a Default Company in Sijil Settings first."))
	project = frappe.get_doc(
		{
			"doctype": "Project",
			"project_name": land.land_name,
			"company": company,
			"status": "Open",
			"notes": land.description or "",
		}
	)
	project.flags.ignore_permissions = True
	project.insert()
	frappe.db.set_value("Sijil Land", land.name, "project", project.name, update_modified=False)
	land.project = project.name
	return project.name


def on_erpnext_project_trash(doc, method=None):
	"""Allow deleting a Project that a Land points to: just unlink it."""
	for land in frappe.db.get_all("Sijil Land", filters={"project": doc.name}, pluck="name"):
		frappe.db.set_value("Sijil Land", land, "project", None, update_modified=False)
	for task in frappe.db.get_all("Sijil Task", filters={"project": doc.name}, pluck="name"):
		frappe.db.set_value("Sijil Task", task, "project", None, update_modified=False)
	for case in frappe.db.get_all("Sijil Case", filters={"project": doc.name}, pluck="name"):
		frappe.db.set_value("Sijil Case", case, "project", None, update_modified=False)


# ------------------------------------------------------------------ ToDo
def sync_todo(doc, assigned_to, description, due_date, priority, is_open):
	"""Create / re-assign / close the ToDo that mirrors `doc` for `assigned_to`."""
	if not flag("enable_todo"):
		return
	todo_name = doc.get("todo")
	if todo_name and not frappe.db.exists("ToDo", todo_name):
		todo_name = None

	if not is_open:
		if todo_name:
			frappe.db.set_value("ToDo", todo_name, "status", "Closed")
		return

	values = {
		"allocated_to": assigned_to,
		"description": description,
		"date": due_date,
		"priority": "High" if priority in ("High", "Urgent") else priority if priority in ("Low", "Medium") else "Medium",
		"status": "Open",
	}
	if todo_name:
		frappe.db.set_value("ToDo", todo_name, values)
		return
	todo = frappe.get_doc(
		{"doctype": "ToDo", "reference_type": doc.doctype, "reference_name": doc.name, **values}
	)
	todo.flags.ignore_permissions = True
	todo.insert()
	frappe.db.set_value(doc.doctype, doc.name, "todo", todo.name, update_modified=False)
	doc.todo = todo.name


def delete_todo(doc):
	todo = doc.get("todo")
	if todo and frappe.db.exists("ToDo", todo):
		frappe.db.set_value(doc.doctype, doc.name, "todo", None, update_modified=False)
		frappe.delete_doc("ToDo", todo, ignore_permissions=True, force=True)


# ------------------------------------------------------------------ Calendar
def sync_calendar_event(followup):
	"""Mirror a follow-up as an all-day Frappe Event owned by the assignee."""
	if not flag("enable_calendar"):
		return
	event_name = followup.get("calendar_event")
	if event_name and not frappe.db.exists("Event", event_name):
		event_name = None

	if followup.status != "Open":
		if event_name:
			frappe.db.set_value("Event", event_name, "status", "Completed" if followup.status == "Completed" else "Cancelled")
		return

	starts_on = get_datetime(f"{getdate(followup.due_date)} 09:00:00")
	subject = followup.title
	if event_name:
		frappe.db.set_value(
			"Event",
			event_name,
			{"subject": subject, "starts_on": starts_on, "owner": followup.assigned_to, "status": "Open"},
		)
		return
	event = frappe.get_doc(
		{
			"doctype": "Event",
			"subject": subject,
			"event_category": "Event",
			"event_type": "Private",
			"all_day": 1,
			"starts_on": starts_on,
			"send_reminder": 0,
			"description": followup.description or "",
			"reference_doctype": followup.doctype,
			"reference_docname": followup.name,
			"status": "Open",
		}
	)
	event.flags.ignore_permissions = True
	event.insert()
	# Private events are only visible to their owner: make it the assignee's.
	frappe.db.set_value("Event", event.name, "owner", followup.assigned_to, update_modified=False)
	frappe.db.set_value("Sijil Follow Up", followup.name, "calendar_event", event.name, update_modified=False)
	followup.calendar_event = event.name


def delete_calendar_event(followup):
	event = followup.get("calendar_event")
	if event and frappe.db.exists("Event", event):
		frappe.db.set_value("Sijil Follow Up", followup.name, "calendar_event", None, update_modified=False)
		frappe.delete_doc("Event", event, ignore_permissions=True, force=True)


# ------------------------------------------------------------------ ERPNext Task (two-way)
def sync_erpnext_task(task):
	"""Mirror a Sijil Task to an ERPNext Task when its land has a Project."""
	if not (flag("enable_project_integration") and flag("enable_task_sync")):
		return
	if frappe.flags.get("sijil_syncing"):
		return
	project = task.get("project") or (task.land and frappe.db.get_value("Sijil Land", task.land, "project"))
	if not project:
		return

	values = {
		"subject": task.title,
		"project": project,
		"status": TASK_STATUS_TO_ERP.get(task.status, "Open"),
		"priority": task.priority or "Medium",
		"exp_start_date": task.start_date,
		"exp_end_date": task.due_date,
		"description": task.description or "",
	}
	frappe.flags.sijil_syncing = True
	try:
		name = task.get("erpnext_task")
		if name and frappe.db.exists("Task", name):
			erp = frappe.get_doc("Task", name)
			erp.update(values)
			erp.flags.ignore_permissions = True
			erp.flags.ignore_mandatory = True
			erp.save()
		else:
			erp = frappe.get_doc({"doctype": "Task", **values})
			erp.flags.ignore_permissions = True
			erp.insert()
			frappe.db.set_value("Sijil Task", task.name, {"erpnext_task": erp.name, "project": project}, update_modified=False)
			task.erpnext_task = erp.name
		# Show the assignee in ERPNext's task list without creating a second ToDo.
		frappe.db.set_value("Task", erp.name, "_assign", json.dumps([task.assigned_to]), update_modified=False)
	finally:
		frappe.flags.sijil_syncing = False


def on_erpnext_task_update(doc, method=None):
	"""ERPNext Task -> Sijil Task."""
	if frappe.flags.get("sijil_syncing") or not flag("enable_task_sync"):
		return
	name = frappe.db.get_value("Sijil Task", {"erpnext_task": doc.name}, "name")
	if not name:
		return
	task = frappe.get_doc("Sijil Task", name)
	new_status = ERP_STATUS_TO_TASK.get(doc.status)
	if new_status is None and doc.status == "Overdue":
		new_status = task.status if task.status in ("Open", "In Progress") else "Open"
	changed = False
	if new_status and new_status != task.status:
		task.status = new_status
		changed = True
	if doc.subject and doc.subject != task.title:
		task.title = doc.subject
		changed = True
	if doc.exp_end_date and str(doc.exp_end_date) != str(task.due_date):
		task.due_date = doc.exp_end_date
		changed = True
	if doc.exp_start_date and str(doc.exp_start_date) != str(task.start_date):
		task.start_date = doc.exp_start_date
		changed = True
	if not changed:
		return
	frappe.flags.sijil_syncing = True
	try:
		task.flags.ignore_permissions = True
		task.flags.from_erpnext = True
		task.save()
	finally:
		frappe.flags.sijil_syncing = False


def on_erpnext_task_trash(doc, method=None):
	for name in frappe.db.get_all("Sijil Task", filters={"erpnext_task": doc.name}, pluck="name"):
		frappe.db.set_value("Sijil Task", name, "erpnext_task", None, update_modified=False)


# ------------------------------------------------------------------ notifications
def notify(user, subject, doctype, name, email_content=None):
	"""Desk bell notification and (optionally) an email."""
	if flag("enable_notifications"):
		log = frappe.get_doc(
			{
				"doctype": "Notification Log",
				"for_user": user,
				"type": "Alert",
				"subject": subject,
				"document_type": doctype,
				"document_name": name,
				"email_content": email_content or subject,
			}
		)
		log.flags.ignore_permissions = True
		log.insert()
	if flag("enable_email_reminders"):
		email = frappe.db.get_value("User", user, "email")
		if email:
			frappe.sendmail(
				recipients=[email],
				subject=subject,
				message=email_content or subject,
				reference_doctype=doctype,
				reference_name=name,
			)


# ------------------------------------------------------------------ status page
def integration_status():
	"""Data for the in-app Integrations screen."""
	def count(doctype, filters=None):
		return frappe.db.count(doctype, filters or {})

	installed = {
		"hrms": "hrms" in frappe.get_installed_apps(),
		"employee": bool(frappe.db.table_exists("Employee")),
	}
	items = [
		{
			"key": "project",
			"flag": "enable_project_integration",
			"doctype": "Project",
			"icon": "project",
			"enabled": flag("enable_project_integration"),
			"stats": {"linked_lands": count("Sijil Land", {"project": ["is", "set"]}), "total_lands": count("Sijil Land")},
		},
		{
			"key": "auto_project",
			"flag": "auto_create_project",
			"doctype": "Project",
			"icon": "project",
			"enabled": flag("auto_create_project"),
			"stats": {},
		},
		{
			"key": "task",
			"flag": "enable_task_sync",
			"doctype": "Task",
			"icon": "task",
			"enabled": flag("enable_task_sync"),
			"stats": {"synced_tasks": count("Sijil Task", {"erpnext_task": ["is", "set"]}), "total_tasks": count("Sijil Task")},
		},
		{
			"key": "todo",
			"flag": "enable_todo",
			"doctype": "ToDo",
			"icon": "todo",
			"enabled": flag("enable_todo"),
			"stats": {"open_todos": count("ToDo", {"reference_type": ["in", ["Sijil Follow Up", "Sijil Task"]], "status": "Open"})},
		},
		{
			"key": "calendar",
			"flag": "enable_calendar",
			"doctype": "Event",
			"icon": "calendar",
			"enabled": flag("enable_calendar"),
			"stats": {"events": count("Event", {"reference_doctype": "Sijil Follow Up", "status": "Open"})},
		},
		{
			"key": "notifications",
			"flag": "enable_notifications",
			"doctype": "Notification Log",
			"icon": "bell",
			"enabled": flag("enable_notifications"),
			"stats": {"unread": count("Notification Log", {"document_type": ["like", "Sijil%"], "read": 0})},
		},
		{
			"key": "email",
			"flag": "enable_email_reminders",
			"doctype": "Email Queue",
			"icon": "mail",
			"enabled": flag("enable_email_reminders"),
			"stats": {},
		},
		{
			"key": "parties",
			"flag": None,
			"doctype": "Supplier",
			"icon": "users",
			"enabled": True,
			"stats": {
				"organizations": count("Sijil External Organization"),
				"with_supplier": count("Sijil External Organization", {"supplier": ["is", "set"]}),
				"with_customer": count("Sijil External Organization", {"customer": ["is", "set"]}),
				"with_contact": count("Sijil External Organization", {"contact": ["is", "set"]}),
			},
		},
		{
			"key": "files",
			"flag": None,
			"doctype": "File",
			"icon": "file",
			"enabled": True,
			"stats": {"versions": count("Sijil Document Version"), "documents": count("Sijil Document")},
		},
		{
			"key": "employees",
			"flag": None,
			"doctype": "Employee",
			"icon": "user",
			"enabled": installed["employee"],
			"stats": {"hrms": 1 if installed["hrms"] else 0},
		},
		{
			"key": "company",
			"flag": None,
			"doctype": "Company",
			"icon": "building",
			"enabled": bool(setting("default_company")),
			"stats": {"default_company": setting("default_company") or ""},
		},
	]
	return items
