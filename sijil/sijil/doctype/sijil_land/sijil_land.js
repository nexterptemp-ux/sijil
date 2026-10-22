frappe.ui.form.on("Sijil Land", {
	refresh(frm) {
		if (frm.is_new()) return;
		frm.add_custom_button(__("Open SIJIL"), () => (window.location.href = "/sijil/lands/" + encodeURIComponent(frm.doc.name)));
		frm.add_custom_button(__("History Report"), () => {
			window.open(
				`/api/method/sijil.api.reports.land_history_pdf?land=${encodeURIComponent(frm.doc.name)}`
			);
		}, __("Reports"));
		if (!frm.doc.project) {
			frm.add_custom_button(__("Create ERPNext Project"), () => {
				frappe.call({
					method: "sijil.api.lands.create_project",
					args: { land: frm.doc.name },
					freeze: true,
					callback: () => frm.reload_doc(),
				});
			}, __("ERPNext"));
		} else {
			frm.add_custom_button(__("ERPNext Project"), () => frappe.set_route("Form", "Project", frm.doc.project), __("ERPNext"));
		}
	},
});
