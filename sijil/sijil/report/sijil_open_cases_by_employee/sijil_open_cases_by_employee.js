// Copyright (c) 2026, SIJIL and contributors
// License: MIT. See license.txt

frappe.query_reports["Sijil Open Cases by Employee"] = {
	filters: [
		{ fieldname: "land", label: __("Land / Project"), fieldtype: "Link", options: "Sijil Land" },
	],
};
