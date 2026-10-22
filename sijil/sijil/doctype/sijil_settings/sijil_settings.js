frappe.ui.form.on("Sijil Settings", {
	refresh(frm) {
		frm.add_custom_button(__("Open SIJIL"), () => (window.location.href = "/sijil/settings"));
	},
});
