frappe.ui.form.on("Sijil Case", {
	setup(frm) {
		frm.set_query("case_type", () => ({}));
		frm.set_query("related_case", "relations", () => ({ filters: { land: frm.doc.land } }));
	},
	refresh(frm) {
		if (frm.is_new()) return;
		frm.add_custom_button(__("Open SIJIL"), () => frappe.set_route("sijil-app", "case", frm.doc.name));
		frm.add_custom_button(__("Case History Report"), () => {
			window.open(`/api/method/sijil.api.reports.case_history_pdf?case=${encodeURIComponent(frm.doc.name)}`);
		}, __("Reports"));
		frm.dashboard.add_indicator(__("Status") + ": " + __(frm.doc.status), "blue");
	},
});
