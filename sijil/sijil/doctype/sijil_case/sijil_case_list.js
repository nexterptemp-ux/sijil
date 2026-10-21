frappe.listview_settings["Sijil Case"] = {
	add_fields: ["status", "priority"],
	get_indicator(doc) {
		const colors = { "Not Started": "grey", "In Progress": "orange", "Awaiting Action": "blue", "On Hold": "grey", Completed: "green", Cancelled: "grey" };
		return [__(doc.status), colors[doc.status] || "grey", "status,=," + doc.status];
	},
};
