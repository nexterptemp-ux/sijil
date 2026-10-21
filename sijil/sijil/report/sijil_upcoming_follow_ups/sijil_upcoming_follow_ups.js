// Copyright (c) 2026, SIJIL and contributors
// License: MIT. See license.txt

frappe.query_reports["Sijil Upcoming Follow Ups"] = {
	filters: [
		{ fieldname: "land", label: __("Land / Project"), fieldtype: "Link", options: "Sijil Land" },
		{ fieldname: "assigned_to", label: __("Assigned To"), fieldtype: "Link", options: "User" },
		{ fieldname: "days", label: __("Days"), fieldtype: "Int" },
	],
};
