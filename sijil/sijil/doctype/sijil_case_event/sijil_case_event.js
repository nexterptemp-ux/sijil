frappe.ui.form.on("Sijil Case Event", {
	refresh(frm) {
		if (frm.is_new()) return;
		frm.disable_save();
		frm.set_intro(__("Developments are kept in the case history and cannot be edited later; corrections are recorded as new entries."), "blue");
		if (frm.doc.entry_status === "Active" && frappe.model.can_write("Sijil Case")) {
			frm.add_custom_button(__("Correct this entry"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Correct a Recorded Event"),
					fields: [
						{ fieldname: "title", fieldtype: "Data", label: __("Event Title"), reqd: 1, default: frm.doc.title },
						{ fieldname: "event_date", fieldtype: "Date", label: __("Actual Event Date"), reqd: 1, default: frm.doc.event_date },
						{ fieldname: "description", fieldtype: "Small Text", label: __("Detailed Description") },
						{ fieldname: "reason", fieldtype: "Small Text", label: __("Correction Reason"), reqd: 1 },
					],
					primary_action_label: __("Save"),
					primary_action(values) {
						const { reason, ...data } = values;
						frappe.call({
							method: "sijil.api.cases.correct_event",
							args: { name: frm.doc.name, data: JSON.stringify(data), reason },
							freeze: true,
							callback: (r) => {
								d.hide();
								frappe.set_route("Form", "Sijil Case Event", r.message.name);
							},
						});
					},
				});
				d.show();
			});
		}
		frm.add_custom_button(__("Open SIJIL"), () => (window.location.href = "/sijil/cases/" + encodeURIComponent(frm.doc.case)));
	},
});
