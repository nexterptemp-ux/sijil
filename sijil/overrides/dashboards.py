"""Add a "SIJIL" group to the dashboards (connections) of ERPNext documents."""

from frappe import _


def _merge(data, label, items, fieldname_map):
	data.setdefault("non_standard_fieldnames", {}).update(fieldname_map)
	data.setdefault("transactions", []).append({"label": label, "items": items})
	return data


def project_dashboard(data):
	return _merge(
		data,
		_("SIJIL"),
		["Sijil Land", "Sijil Case", "Sijil Task"],
		{"Sijil Land": "project", "Sijil Case": "project", "Sijil Task": "project"},
	)


def task_dashboard(data):
	return _merge(data, _("SIJIL"), ["Sijil Task"], {"Sijil Task": "erpnext_task"})


def supplier_dashboard(data):
	return _merge(data, _("SIJIL"), ["Sijil External Organization"], {"Sijil External Organization": "supplier"})


def customer_dashboard(data):
	return _merge(data, _("SIJIL"), ["Sijil External Organization"], {"Sijil External Organization": "customer"})
