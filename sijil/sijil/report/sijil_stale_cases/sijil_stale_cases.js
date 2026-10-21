// Copyright (c) 2026, SIJIL and contributors
// License: MIT. See license.txt

frappe.query_reports["Sijil Stale Cases"] = {
	filters: [
		{ fieldname: "land", label: __("Land / Project"), fieldtype: "Link", options: "Sijil Land" },
		{ fieldname: "days", label: __("Days"), fieldtype: "Int" },
	],
};
