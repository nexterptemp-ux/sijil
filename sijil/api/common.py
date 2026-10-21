"""Helpers shared by the whitelisted API modules."""

import json

import frappe
from frappe.utils import cint

MAX_PAGE = 100


def parse(value, default=None):
	"""Arguments arrive as JSON strings from the browser."""
	if value in (None, ""):
		return default
	if isinstance(value, (dict, list)):
		return value
	try:
		return json.loads(value)
	except (TypeError, ValueError):
		return value


def paging(start=0, page_length=20):
	return max(cint(start), 0), min(max(cint(page_length), 1), MAX_PAGE)


def count(doctype, filters=None, or_filters=None):
	"""Permission-aware COUNT."""
	rows = frappe.get_list(
		doctype, filters=filters or {}, or_filters=or_filters or None, fields=["count(name) as c"]
	)
	return cint(rows[0].c) if rows else 0


def labels(doctype, names, field, key="name"):
	"""{name: label} for a set of linked names (single query)."""
	names = sorted({n for n in names if n})
	if not names:
		return {}
	rows = frappe.db.get_all(doctype, filters={key: ["in", names]}, fields=[key, field])
	return {r[key]: r[field] for r in rows}


def user_names(users):
	return labels("User", users, "full_name")


def page_response(total, rows, start, page_length):
	return {
		"total": total,
		"rows": rows,
		"start": start,
		"page_length": page_length,
		"has_more": start + len(rows) < total,
	}


def ensure_list(value):
	value = parse(value, [])
	return value if isinstance(value, list) else [value]


def select_options(doctype, fieldname):
	field = frappe.get_meta(doctype).get_field(fieldname)
	return [o for o in (field.options or "").split("\n")]
