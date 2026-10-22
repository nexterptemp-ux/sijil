frappe.ui.form.on("Sijil Task", {
	refresh(frm) {
		if (frm.is_new()) return;
		frm.add_custom_button(__("Open SIJIL"), () => (window.location.href = "/sijil/tasks/" + encodeURIComponent(frm.doc.name)));
		if (frm.doc.erpnext_task) {
			frm.add_custom_button(__("ERPNext Task"), () => frappe.set_route("Form", "Task", frm.doc.erpnext_task), __("ERPNext"));
		}
	},
	land(frm) {
		frm.set_query("case", () => ({ filters: frm.doc.land ? { land: frm.doc.land } : {} }));
	},
});
