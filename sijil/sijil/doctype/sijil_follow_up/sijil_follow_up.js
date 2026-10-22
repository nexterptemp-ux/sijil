frappe.ui.form.on("Sijil Follow Up", {
	refresh(frm) {
		if (frm.is_new()) return;
		const due = frappe.datetime.get_diff(frm.doc.due_date, frappe.datetime.get_today());
		if (frm.doc.status === "Open") {
			const state = due < 0 ? [__("Overdue"), "red"] : due === 0 ? [__("Due Today"), "orange"] : [__("Upcoming"), "blue"];
			frm.dashboard.add_indicator(state[0], state[1]);
			frm.add_custom_button(__("Complete and Record"), () => (window.location.href = frm.doc.case ? "/sijil/cases/" + encodeURIComponent(frm.doc.case) : "/sijil/followups"));
		} else {
			frm.dashboard.add_indicator(__(frm.doc.status), frm.doc.status === "Completed" ? "green" : "grey");
		}
		if (frm.doc.case) frm.add_custom_button(__("Open SIJIL"), () => (window.location.href = "/sijil/cases/" + encodeURIComponent(frm.doc.case)));
	},
});
