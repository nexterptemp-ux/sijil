"""Serves the React single-page app at /sijil (and /sijil/<path> via website_route_rules).

The app is built by `frontend/` (vite build) into sijil/public/frontend and loaded from
/assets/sijil/frontend/. See docs/architecture/frontend.md.
"""

import os
from urllib.parse import quote

import frappe
from frappe import _

from sijil.permissions import has_app_permission

no_cache = 1


def get_context(context):
	if frappe.session.user == "Guest":
		frappe.local.flags.redirect_location = "/login?redirect-to=" + quote(frappe.request.path)
		raise frappe.Redirect
	if not has_app_permission():
		frappe.throw(_("You do not have access to Sijil."), frappe.PermissionError)

	# Same pattern as Frappe's own SPAs: render the CSRF token into the page.
	context.csrf_token = frappe.sessions.get_csrf_token()
	frappe.db.commit()

	lang = (frappe.local.lang or "en").split("-")[0]
	context.lang = lang
	context.dir = "rtl" if lang in ("ar", "he", "fa", "ur") else "ltr"

	entry = frappe.get_app_path("sijil", "public", "frontend", "assets", "index.js")
	context.built = os.path.exists(entry)
	context.asset_version = int(os.path.getmtime(entry)) if context.built else 0
	return context
