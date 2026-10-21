"""Record-level permissions for SIJIL.

Role permissions on the DocTypes decide *what* a user may do.  These hooks decide
*which records* are visible.  They apply both to list queries (get_list) and to
single-document checks, and Frappe's File permission check for private files
delegates to them (a file attached to a Sijil Document Version is only served to
users who may read that version).
"""

import frappe
from sijil.utils import _request_cache

MANAGER_ROLES = {"System Manager", "Sijil Manager"}
APP_ROLES = {"Sijil User", "Sijil Manager", "System Manager"}


def has_app_permission():
	return bool(APP_ROLES & set(frappe.get_roles()))


def _is_privileged(user):
	return user == "Administrator" or bool(MANAGER_ROLES & set(frappe.get_roles(user)))


def _restricted(user):
	if _is_privileged(user):
		return False
	return bool(frappe.db.get_single_value("Sijil Settings", "restrict_to_assigned_lands"))


def user_lands(user):
	"""Lands the user is responsible for (or created)."""
	cache = _request_cache("sijil_land_cache")
	if user not in cache:
		lands = set(
			frappe.db.get_all(
				"Sijil Land Responsible",
				filters={"user": user, "parenttype": "Sijil Land"},
				pluck="parent",
			)
		)
		lands |= set(frappe.db.get_all("Sijil Land", filters={"owner": user}, pluck="name"))
		cache[user] = lands
	return cache[user]


def _in(column, values):
	if not values:
		return "1=0"
	return "{} in ({})".format(column, ", ".join(frappe.db.escape(v) for v in sorted(values)))


# ---------------------------------------------------------------- query conditions
def land_query(user=None):
	user = user or frappe.session.user
	if not _restricted(user):
		return ""
	return _in("`tabSijil Land`.name", user_lands(user))


def case_query(user=None):
	user = user or frappe.session.user
	if not _restricted(user):
		return ""
	return "({} or `tabSijil Case`.owner_user = {} or `tabSijil Case`.owner = {})".format(
		_in("`tabSijil Case`.land", user_lands(user)), frappe.db.escape(user), frappe.db.escape(user)
	)


def case_event_query(user=None):
	user = user or frappe.session.user
	if not _restricted(user):
		return ""
	return "({} or `tabSijil Case Event`.owner = {})".format(
		_in("`tabSijil Case Event`.land", user_lands(user)), frappe.db.escape(user)
	)


def followup_query(user=None):
	user = user or frappe.session.user
	if not _restricted(user):
		return ""
	u = frappe.db.escape(user)
	return "({} or `tabSijil Follow Up`.assigned_to = {} or `tabSijil Follow Up`.owner = {})".format(
		_in("`tabSijil Follow Up`.land", user_lands(user)), u, u
	)


def task_query(user=None):
	user = user or frappe.session.user
	if not _restricted(user):
		return ""
	u = frappe.db.escape(user)
	return "({} or `tabSijil Task`.assigned_to = {} or `tabSijil Task`.owner = {})".format(
		_in("`tabSijil Task`.land", user_lands(user)), u, u
	)


def folder_query(user=None):
	user = user or frappe.session.user
	if not _restricted(user):
		return ""
	return _in("`tabSijil Folder`.land", user_lands(user))


def document_query(user=None):
	user = user or frappe.session.user
	if _is_privileged(user):
		return ""
	u = frappe.db.escape(user)
	parts = []
	lands = user_lands(user)
	# Confidential documents: owner or responsible employees of the land only.
	parts.append(
		"(`tabSijil Document`.is_confidential = 0 or `tabSijil Document`.owner = {} or {})".format(
			u, _in("`tabSijil Document`.land", lands)
		)
	)
	if _restricted(user):
		parts.append(_in("`tabSijil Document`.land", lands))
	return " and ".join(parts)


def document_version_query(user=None):
	user = user or frappe.session.user
	cond = document_query(user)
	if not cond:
		return ""
	return "`tabSijil Document Version`.document in (select name from `tabSijil Document` where {})".format(cond)


def document_link_query(user=None):
	user = user or frappe.session.user
	cond = document_query(user)
	if not cond:
		return ""
	return "`tabSijil Document Link`.document in (select name from `tabSijil Document` where {})".format(cond)


# ---------------------------------------------------------------- document level
def _land_ok(land, user):
	if not _restricted(user):
		return True
	return bool(land) and land in user_lands(user)


def land_has_permission(doc, ptype=None, user=None, debug=False):
	user = user or frappe.session.user
	if not _land_ok(doc.name, user):
		return False


def case_has_permission(doc, ptype=None, user=None, debug=False):
	user = user or frappe.session.user
	if _land_ok(doc.land, user) or doc.owner_user == user or doc.owner == user:
		return None
	return False


def _land_of(doc):
	"""Land of a record; for a document that is not saved yet, derive it from its case."""
	if doc.get("land"):
		return doc.land
	if doc.get("case"):
		return frappe.db.get_value("Sijil Case", doc.case, "land")
	return None


def case_event_has_permission(doc, ptype=None, user=None, debug=False):
	user = user or frappe.session.user
	if _land_ok(_land_of(doc), user) or doc.owner == user:
		return None
	return False


def followup_has_permission(doc, ptype=None, user=None, debug=False):
	user = user or frappe.session.user
	if _land_ok(_land_of(doc), user) or user in (doc.assigned_to, doc.owner):
		return None
	return False


def task_has_permission(doc, ptype=None, user=None, debug=False):
	user = user or frappe.session.user
	if _land_ok(_land_of(doc), user) or user in (doc.assigned_to, doc.owner):
		return None
	return False


def folder_has_permission(doc, ptype=None, user=None, debug=False):
	user = user or frappe.session.user
	if _land_ok(doc.land, user):
		return None
	return False


def _document_allowed(document, user):
	"""document: a dict/doc with land, owner, is_confidential."""
	if _is_privileged(user):
		return True
	if not _land_ok(document.get("land"), user):
		return False
	if document.get("is_confidential"):
		return document.get("owner") == user or document.get("land") in user_lands(user)
	return True


def document_has_permission(doc, ptype=None, user=None, debug=False):
	user = user or frappe.session.user
	if _document_allowed(doc, user):
		return None
	return False


def _parent_document(name):
	return frappe.db.get_value(
		"Sijil Document", name, ["land", "owner", "is_confidential"], as_dict=True
	)


def document_version_has_permission(doc, ptype=None, user=None, debug=False):
	user = user or frappe.session.user
	parent = _parent_document(doc.document)
	if not parent or _document_allowed(parent, user):
		return None
	return False


def document_link_has_permission(doc, ptype=None, user=None, debug=False):
	user = user or frappe.session.user
	parent = _parent_document(doc.document)
	if not parent or _document_allowed(parent, user):
		return None
	return False
