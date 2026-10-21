frappe.listview_settings["Sijil Follow Up"] = {
	add_fields: ["status", "due_date"],
	get_indicator(doc) {
		if (doc.status === "Completed") return [__("Completed"), "green", "status,=,Completed"];
		if (doc.status === "Cancelled") return [__("Cancelled"), "grey", "status,=,Cancelled"];
		const diff = frappe.datetime.get_diff(doc.due_date, frappe.datetime.get_today());
		if (diff < 0) return [__("Overdue"), "red", "status,=,Open"];
		if (diff === 0) return [__("Due Today"), "orange", "status,=,Open"];
		return [__("Upcoming"), "blue", "status,=,Open"];
	},
};
