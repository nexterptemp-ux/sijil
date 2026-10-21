// Copyright (c) 2026, SIJIL and contributors
// License: MIT. See license.txt

frappe.query_reports["Sijil Outstanding Tasks"] = {
	filters: [
		{ fieldname: "land", label: __("Land / Project"), fieldtype: "Link", options: "Sijil Land" },
		{ fieldname: "assigned_to", label: __("Assigned To"), fieldtype: "Link", options: "User" },
	],
};
