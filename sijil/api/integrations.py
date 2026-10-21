import frappe
from frappe import _

from sijil.integrations import erpnext as erp
from sijil.permissions import has_app_permission
from sijil.utils import is_manager

ALLOWED_FLAGS = {
	"enable_project_integration", "auto_create_project", "enable_task_sync", "enable_todo", "enable_calendar",
	"enable_notifications", "enable_email_reminders",
}


@frappe.whitelist()
def get_integrations():
	if not has_app_permission():
		frappe.throw(_("Not permitted"), frappe.PermissionError)
	return erp.integration_status()


@frappe.whitelist()
def set_integration(flag, value):
	if not is_manager():
		frappe.throw(_("Only managers can change integration settings."), frappe.PermissionError)
	if flag not in ALLOWED_FLAGS:
		frappe.throw(_("Unknown setting {0}").format(flag))
	settings = frappe.get_doc("Sijil Settings")
	settings.set(flag, 1 if str(value) in ("1", "true", "True") else 0)
	settings.flags.ignore_permissions = True
	settings.save()
	return erp.integration_status()


@frappe.whitelist()
def link_pending_tasks():
	"""Mirror existing Sijil Tasks (whose land has a Project) to ERPNext Tasks."""
	if not is_manager():
		frappe.throw(_("Only managers can run this."), frappe.PermissionError)
	done = 0
	for name in frappe.db.get_all("Sijil Task", filters={"erpnext_task": ["is", "not set"], "status": ["in", ["Open", "In Progress"]]}, pluck="name"):
		task = frappe.get_doc("Sijil Task", name)
		if task.land and frappe.db.get_value("Sijil Land", task.land, "project"):
			erp.sync_erpnext_task(task)
			done += 1
	return {"synced": done}
