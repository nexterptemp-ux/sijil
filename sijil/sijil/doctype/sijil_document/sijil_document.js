frappe.ui.form.on("Sijil Document", {
	refresh(frm) {
		if (frm.is_new()) return;
		frm.add_custom_button(__("Open SIJIL"), () => frappe.set_route("sijil-app", "documents", frm.doc.land, frm.doc.folder || ""));
		if (frm.doc.current_version) {
			frm.add_custom_button(__("Current Version"), () => frappe.set_route("Form", "Sijil Document Version", frm.doc.current_version));
		}
	},
	setup(frm) {
		frm.set_query("folder", () => ({ filters: { land: frm.doc.land } }));
	},
});
