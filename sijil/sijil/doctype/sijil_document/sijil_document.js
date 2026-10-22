frappe.ui.form.on("Sijil Document", {
	refresh(frm) {
		if (frm.is_new()) return;
		frm.add_custom_button(__("Open SIJIL"), () => (window.location.href = "/sijil/documents/" + encodeURIComponent(frm.doc.land) + "?doc=" + encodeURIComponent(frm.doc.name)));
		if (frm.doc.current_version) {
			frm.add_custom_button(__("Current Version"), () => frappe.set_route("Form", "Sijil Document Version", frm.doc.current_version));
		}
	},
	setup(frm) {
		frm.set_query("folder", () => ({ filters: { land: frm.doc.land } }));
	},
});
