"""Serves the React single-page app at /sijil (and /sijil/<path> via website_route_rules).

The app is built by `frontend/` (vite build) into sijil/public/frontend and loaded from
/assets/sijil/frontend/. Vite writes hashed file names and a manifest; this page reads the manifest to
find the entry script and its CSS. See docs/architecture/frontend.md.
"""

import json
import os
from urllib.parse import quote

import frappe
from frappe import _

from sijil.permissions import has_app_permission

no_cache = 1

ASSET_BASE = "/assets/sijil/frontend/"


def _entry():
	"""(script_url, [css_urls]) of the built app, or (None, []) if it has not been built."""
	manifest_path = frappe.get_app_path("sijil", "public", "frontend", ".vite", "manifest.json")
	if not os.path.exists(manifest_path):
		return None, []
	with open(manifest_path, encoding="utf-8") as fh:
		manifest = json.load(fh)
	entry = manifest.get("index.html") or next((m for m in manifest.values() if m.get("isEntry")), None)
	if not entry:
		return None, []
	return ASSET_BASE + entry["file"], [ASSET_BASE + css for css in entry.get("css", [])]


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

	context.entry_js, context.entry_css = _entry()
	return context
