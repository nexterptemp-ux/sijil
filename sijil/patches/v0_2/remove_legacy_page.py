"""Remove the old Desk-page SPA (/app/sijil-app); the React app at /sijil replaces it."""

import frappe


def execute():
	if frappe.db.exists("Page", "sijil-app"):
		frappe.delete_doc("Page", "sijil-app", force=True, ignore_permissions=True)
