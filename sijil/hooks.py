app_name = "sijil"
app_title = "Sijil"
app_publisher = "SIJIL"
app_description = "Real estate operations, case follow-up, task and document management"
app_email = "a.shawki@punditnet.com"
app_license = "MIT"
app_version = "0.1.0"

required_apps = ["erpnext"]

# Apps screen
# -----------
add_to_apps_screen = [
	{
		"name": "sijil",
		"logo": "/assets/sijil/images/sijil-logo.svg",
		"title": "Sijil",
		"route": "/app/sijil-app",
		"has_permission": "sijil.permissions.has_app_permission",
	}
]

# Install / migrate
# -----------------
before_install = "sijil.install.before_install"
after_install = "sijil.install.after_install"
after_migrate = "sijil.install.after_migrate"

# Fixtures: roles are created in install.py, nothing to export here.

# Permissions
# -----------
permission_query_conditions = {
	"Sijil Land": "sijil.permissions.land_query",
	"Sijil Case": "sijil.permissions.case_query",
	"Sijil Case Event": "sijil.permissions.case_event_query",
	"Sijil Follow Up": "sijil.permissions.followup_query",
	"Sijil Task": "sijil.permissions.task_query",
	"Sijil Folder": "sijil.permissions.folder_query",
	"Sijil Document": "sijil.permissions.document_query",
	"Sijil Document Version": "sijil.permissions.document_version_query",
	"Sijil Document Link": "sijil.permissions.document_link_query",
}

has_permission = {
	"Sijil Land": "sijil.permissions.land_has_permission",
	"Sijil Case": "sijil.permissions.case_has_permission",
	"Sijil Case Event": "sijil.permissions.case_event_has_permission",
	"Sijil Follow Up": "sijil.permissions.followup_has_permission",
	"Sijil Task": "sijil.permissions.task_has_permission",
	"Sijil Folder": "sijil.permissions.folder_has_permission",
	"Sijil Document": "sijil.permissions.document_has_permission",
	"Sijil Document Version": "sijil.permissions.document_version_has_permission",
	"Sijil Document Link": "sijil.permissions.document_link_has_permission",
}

# Show Sijil records on the dashboards of ERPNext documents
# ---------------------------------------------------------
override_doctype_dashboards = {
	"Project": "sijil.overrides.dashboards.project_dashboard",
	"Task": "sijil.overrides.dashboards.task_dashboard",
	"Supplier": "sijil.overrides.dashboards.supplier_dashboard",
	"Customer": "sijil.overrides.dashboards.customer_dashboard",
}

# Two-way sync with ERPNext Task / Project
doc_events = {
	"Task": {
		"on_update": "sijil.integrations.erpnext.on_erpnext_task_update",
		"on_trash": "sijil.integrations.erpnext.on_erpnext_task_trash",
	},
	"Project": {
		"on_trash": "sijil.integrations.erpnext.on_erpnext_project_trash",
	},
}

# Scheduled jobs
# --------------
scheduler_events = {
	"daily": [
		"sijil.tasks.send_daily_reminders",
	],
}

# Desk assets
# -----------
app_include_css = []

# Translations: sijil/translations/ar.csv is picked up automatically by Frappe.
