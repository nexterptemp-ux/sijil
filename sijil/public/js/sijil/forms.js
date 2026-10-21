// Forms shared by several screens: record a development, complete a follow-up,
// create/edit follow-ups, tasks, cases and lands, and the document attach picker.

import { call, state, toHtml, plain, upload, esc, icon, debounce } from "./core.js";
import { openForm, toast } from "./ui.js";

const opts = () => state.boot.options;
const today = () => state.boot.today;

// ------------------------------------------------------------------ document picker
/** Attach existing library documents and/or upload new files. getValue() -> {existing, files} */
function docPicker(landId) {
	const html = `<div class="sj-nested" data-docpicker>
		<h4>${esc(__("Supporting Documents"))}</h4>
		<div class="sj-row" data-chips style="margin-bottom:8px"></div>
		<div class="sj-field"><label>${esc(__("Attach an existing document from the library"))}</label>
			<input type="text" data-docsearch placeholder="${esc(__("Type to search"))}" autocomplete="off">
			<div class="sj-combo-list" data-doclist hidden style="position:static;margin-top:4px"></div></div>
		<div class="sj-field" style="margin-bottom:0"><label>${esc(__("Upload new files (stored once in the library)"))}</label>
			<input type="file" multiple data-docfiles></div>
	</div>`;
	const picked = new Map();
	const bind = (root) => {
		const chips = root.querySelector("[data-chips]");
		const input = root.querySelector("[data-docsearch]");
		const list = root.querySelector("[data-doclist]");
		const files = root.querySelector("[data-docfiles]");
		const draw = () => {
			chips.innerHTML = [...picked].map(([n, t]) => `<span class="sj-attach">${icon("file")} ${esc(t)} <button type="button" data-rm="${esc(n)}" style="border:0;background:none">×</button></span>`).join("");
		};
		chips.addEventListener("click", (e) => {
			const b = e.target.closest("[data-rm]");
			if (b) { picked.delete(b.dataset.rm); draw(); }
		});
		const search = debounce(async () => {
			if (!landId) return;
			const rows = await call("documents.search_documents", { land: landId, query: input.value });
			list.innerHTML = rows.length
				? rows.map((r) => `<button type="button" data-n="${esc(r.name)}" data-t="${esc(r.title)}">${esc(r.title)}<small>${esc(r.document_type ? __(r.document_type) : "")} · v${r.version_count || 1}</small></button>`).join("")
				: `<div class="sj-muted" style="padding:8px 10px">${esc(__("No results"))}</div>`;
			list.hidden = false;
		}, 250);
		input.addEventListener("input", search);
		input.addEventListener("focus", search);
		list.addEventListener("click", (e) => {
			const b = e.target.closest("button[data-n]");
			if (!b) return;
			picked.set(b.dataset.n, b.dataset.t);
			list.hidden = true;
			input.value = "";
			draw();
		});
		return () => ({ existing: [...picked.keys()], files: [...files.files] });
	};
	return { html, bind };
}

async function uploadFiles(files, { land, linkDoctype, linkName }) {
	const failed = [];
	for (const file of files) {
		const form = new FormData();
		form.append("file", file, file.name);
		form.append("land", land);
		form.append("title", file.name.replace(/\.[^.]+$/, ""));
		form.append("link_doctype", linkDoctype);
		form.append("link_name", linkName);
		try {
			await upload("documents.upload_document", form);
		} catch (e) {
			failed.push(file.name + " — " + e.message);
		}
	}
	if (failed.length) frappe.msgprint({ title: __("Some files were not uploaded"), message: failed.map(esc).join("<br>"), indicator: "orange" });
}

// ------------------------------------------------------------------ development (case event)
const eventFields = (c, { withCase = false } = {}) => [
	...(withCase ? [{ name: "case", label: __("Case"), type: "link", doctype: "Sijil Case", required: true }] : []),
	{ name: "title", label: __("Event Title"), required: true, placeholder: __("e.g. Signature obtained") },
	{ name: "event_date", label: __("Actual Event Date"), type: "date", required: true, value: today(), max: today(), row: "half" },
	{ name: "event_type", label: __("Event Type"), type: "select", options: opts().event_type, value: "Update", required: true, row: "half" },
	{ name: "description", label: __("Detailed Description"), type: "textarea", required: true },
	{ name: "communication_method", label: __("Communication Method"), type: "select", options: opts().communication_method, row: "half" },
	{ name: "outcome", label: __("Outcome"), row: "half" },
	{ name: "situation_update", label: __("New Current Situation"), type: "textarea", value: "", hint: __("Optional. Fill this in when the development changes where the case stands; leave empty to keep the current situation.") },
	{ name: "status_after", label: __("New Case Status"), type: "select", options: opts().case_status, row: "half" },
	{ name: "is_milestone", label: __("Milestone"), type: "check", row: "half" },
];

export async function recordEvent({ caseDoc, onDone }) {
	const picker = docPicker(caseDoc.land);
	let getDocs = () => ({ existing: [], files: [] });
	await openForm({
		title: __("Record a Development") + " — " + caseDoc.title,
		wide: true,
		fields: eventFields(caseDoc).map((f) => (f.name === "status_after" ? { ...f, value: "" } : f)),
		note: __("Developments are kept in the case history and cannot be edited later; corrections are recorded as new entries."),
		extraHtml: picker.html,
		afterOpen: (form) => { getDocs = picker.bind(form); },
		submitLabel: __("Record Development"),
		onSubmit: async (v) => {
			const { existing, files } = getDocs();
			const res = await call("cases.record_event", {
				data: JSON.stringify({ ...v, case: caseDoc.name, description: toHtml(v.description), documents: existing }),
			});
			await uploadFiles(files, { land: caseDoc.land, linkDoctype: "Sijil Case Event", linkName: res.name });
			toast(__("Development recorded"));
			onDone && onDone(res);
		},
	});
}

export async function recordEventAnywhere({ onDone }) {
	await openForm({
		title: __("Record a Development"),
		fields: [{ name: "case", label: __("Case"), type: "link", doctype: "Sijil Case", required: true }],
		submitLabel: __("Continue"),
		onSubmit: async (v) => {
			const c = await call("cases.get_case", { name: v.case });
			setTimeout(() => recordEvent({ caseDoc: c, onDone }), 50);
		},
	});
}

export async function correctEvent({ event, onDone }) {
	await openForm({
		title: __("Correct a Recorded Event"),
		note: __("The original entry stays in the history, marked as superseded, and links to this correction."),
		fields: [
			{ name: "title", label: __("Event Title"), value: event.title, required: true },
			{ name: "event_date", label: __("Actual Event Date"), type: "date", value: event.event_date, max: today(), required: true, row: "half" },
			{ name: "event_type", label: __("Event Type"), type: "select", options: opts().event_type, value: event.event_type, row: "half" },
			{ name: "description", label: __("Detailed Description"), type: "textarea", value: plain(event.description) },
			{ name: "outcome", label: __("Outcome"), value: event.outcome || "" },
			{ name: "reason", label: __("Correction Reason"), type: "textarea", required: true },
		],
		onSubmit: async (v) => {
			const { reason, ...data } = v;
			data.description = toHtml(data.description);
			const res = await call("cases.correct_event", { name: event.name, data: JSON.stringify(data), reason });
			toast(__("Correction recorded"));
			onDone && onDone(res);
		},
	});
}

export async function editSituation({ caseDoc, onDone }) {
	await openForm({
		title: __("Update Current Situation"),
		note: __("The change is recorded as a development so the history shows when and why the situation changed."),
		fields: [
			{ name: "title", label: __("Event Title"), value: __("Current situation updated"), required: true },
			{ name: "situation", label: __("Current Situation"), type: "textarea", value: caseDoc.current_situation || "", required: true },
			{ name: "status", label: __("Status"), type: "select", options: opts().case_status, value: caseDoc.status, required: true },
		],
		onSubmit: async (v) => {
			await call("cases.update_situation", { case: caseDoc.name, situation: v.situation, status: v.status, title: v.title });
			toast(__("Situation updated"));
			onDone && onDone();
		},
	});
}

// ------------------------------------------------------------------ follow-ups
export async function newFollowup({ caseDoc, land, onDone }) {
	await openForm({
		title: __("New Follow-up"),
		fields: [
			{ name: "title", label: __("Follow-up Title"), required: true },
			...(caseDoc ? [] : [{ name: "case", label: __("Case"), type: "link", doctype: "Sijil Case" }]),
			{ name: "assigned_to", label: __("Assigned To"), type: "user", required: true, value: state.boot.user.name, row: "half" },
			{ name: "due_date", label: __("Due Date"), type: "date", required: true, min: today(), row: "half" },
			{ name: "priority", label: __("Priority"), type: "select", options: opts().priority, value: "Medium", required: true, row: "half" },
			{ name: "reminder_days_before", label: __("Remind (Days Before Due Date)"), type: "number", value: state.boot.settings.default_reminder_days, row: "half" },
			{ name: "description", label: __("Description"), type: "textarea" },
		],
		onSubmit: async (v) => {
			await call("followups.save_followup", { data: JSON.stringify({ ...v, case: caseDoc ? caseDoc.name : v.case, land: land || (caseDoc && caseDoc.land) }) });
			toast(__("Follow-up scheduled"));
			onDone && onDone();
		},
	});
}

export async function rescheduleFollowup({ fu, onDone }) {
	await openForm({
		title: __("Reschedule Follow-up"),
		fields: [
			{ name: "due_date", label: __("Due Date"), type: "date", required: true, value: fu.due_date },
			{ name: "assigned_to", label: __("Assigned To"), type: "user", required: true, value: fu.assigned_to },
		],
		onSubmit: async (v) => {
			await call("followups.reschedule", v.assigned_to ? { name: fu.name, due_date: v.due_date, assigned_to: v.assigned_to } : { name: fu.name, due_date: v.due_date });
			toast(__("Follow-up rescheduled"));
			onDone && onDone();
		},
	});
}

/** Complete a follow-up -> record result as a case event -> optionally schedule the next one. One server transaction. */
export async function completeFollowup({ fu, onDone }) {
	const landId = fu.land;
	const picker = fu.case ? docPicker(landId) : null;
	let getDocs = () => ({ existing: [], files: [] });
	const nextBlock = `<div class="sj-nested"><label class="sj-checklabel"><input type="checkbox" name="schedule_next" checked> ${esc(__("Schedule the next follow-up"))}</label>
		<div data-next style="margin-top:10px">
		<div class="sj-field"><label>${esc(__("Follow-up Title"))}</label><input type="text" name="next_title" value="${esc(fu.title)}"></div>
		<div class="sj-grid2"><div class="sj-field"><label>${esc(__("Due Date"))}</label><input type="date" name="next_due" min="${today()}"></div>
		<div class="sj-field"><label>${esc(__("Assigned To"))}</label><select name="next_assignee"></select></div></div></div></div>`;
	await openForm({
		title: __("Complete Follow-up"),
		wide: true,
		note: `${fu.case_title ? fu.case_title + " — " : ""}${fu.title}`,
		fields: [
			{ name: "outcome", label: __("Actual Outcome"), type: "textarea", required: true, hint: __("Even if nothing progressed, record it: \"no progress\" is part of the history.") },
			...(fu.case ? [
				{ name: "title", label: __("Event Title"), value: __("Follow-up result: {0}", [fu.title]), required: true },
				{ name: "event_date", label: __("Actual Event Date"), type: "date", value: today(), max: today(), required: true, row: "half" },
				{ name: "event_type", label: __("Event Type"), type: "select", options: opts().event_type, value: "Contact", row: "half" },
				{ name: "situation_update", label: __("New Current Situation"), type: "textarea", hint: __("Optional. Leave empty to keep the current situation.") },
				{ name: "status_after", label: __("New Case Status"), type: "select", options: opts().case_status, row: "half" },
				{ name: "is_milestone", label: __("Milestone"), type: "check", row: "half" },
			] : []),
		],
		extraHtml: (picker ? picker.html : "") + nextBlock,
		afterOpen: async (form) => {
			if (picker) getDocs = picker.bind(form);
			const sel = form.querySelector("[name=next_assignee]");
			const list = await (await import("./core.js")).users();
			sel.innerHTML = list.map((u) => `<option value="${esc(u.name)}" ${u.name === fu.assigned_to ? "selected" : ""}>${esc(u.full_name || u.name)}</option>`).join("");
			const toggle = () => (form.querySelector("[data-next]").style.display = form.querySelector("[name=schedule_next]").checked ? "" : "none");
			form.querySelector("[name=schedule_next]").addEventListener("change", toggle);
			toggle();
		},
		submitLabel: __("Complete and Record"),
		onSubmit: async (v) => {
			const { existing, files } = getDocs();
			const event = fu.case ? {
				title: v.title, event_date: v.event_date, event_type: v.event_type, description: toHtml(v.outcome),
				situation_update: v.situation_update, status_after: v.status_after, is_milestone: v.is_milestone,
			} : {};
			const next = v.schedule_next && v.next_due ? { title: v.next_title, due_date: v.next_due, assigned_to: v.next_assignee } : null;
			if (v.schedule_next && !v.next_due) throw new Error(__("Choose a due date for the next follow-up, or untick the option."));
			const res = await call("followups.complete", {
				name: fu.name, outcome: v.outcome, event: JSON.stringify(event), next_followup: JSON.stringify(next), documents: JSON.stringify(existing),
			});
			if (res.event && files.length) await uploadFiles(files, { land: landId, linkDoctype: "Sijil Case Event", linkName: res.event });
			toast(__("Follow-up completed"));
			onDone && onDone(res);
		},
	});
}

// ------------------------------------------------------------------ tasks
export async function taskForm({ task, caseDoc, land, onDone }) {
	const t = task || {};
	await openForm({
		title: task ? __("Edit Task") : __("New Task"),
		fields: [
			{ name: "title", label: __("Task Title"), required: true, value: t.title || "" },
			{ name: "land", label: __("Land / Project"), type: "link", doctype: "Sijil Land", value: t.land || (caseDoc && caseDoc.land) || land || "", valueLabel: t.land_name || (caseDoc && caseDoc.land_name) || "" },
			{ name: "case", label: __("Related Case"), type: "link", doctype: "Sijil Case", value: t.case || (caseDoc && caseDoc.name) || "", valueLabel: t.case_title || (caseDoc && caseDoc.title) || "" },
			{ name: "assigned_to", label: __("Assigned To"), type: "user", required: true, value: t.assigned_to || state.boot.user.name, row: "half" },
			{ name: "priority", label: __("Priority"), type: "select", options: opts().priority, value: t.priority || "Medium", required: true, row: "half" },
			{ name: "start_date", label: __("Start Date"), type: "date", value: t.start_date || "", row: "half" },
			{ name: "due_date", label: __("Due Date"), type: "date", value: t.due_date || "", row: "half" },
			...(task ? [{ name: "status", label: __("Status"), type: "select", options: opts().task_status, value: t.status, required: true }] : []),
			{ name: "description", label: __("Description"), type: "textarea", value: plain(t.description) },
		],
		onSubmit: async (v) => {
			const data = { ...v, description: toHtml(v.description) };
			if (task) data.name = task.name;
			await call("tasks.save_task", { data: JSON.stringify(data) });
			toast(__("Task saved"));
			onDone && onDone();
		},
	});
}

// ------------------------------------------------------------------ case & land
export async function caseForm({ caseDoc, land, landLabel, onDone }) {
	const c = caseDoc || {};
	await openForm({
		title: caseDoc ? __("Edit Case") : __("New Case"),
		wide: true,
		fields: [
			{ name: "title", label: __("Case Title"), required: true, value: c.title || "" },
			{ name: "land", label: __("Land / Project"), type: "link", doctype: "Sijil Land", required: true, value: c.land || land || "", valueLabel: c.land_name || landLabel || "" },
			{ name: "case_type", label: __("Case Type"), type: "select", options: state.boot.case_types, value: c.case_type || "", translate: true, row: "half" },
			{ name: "reference_no", label: __("Reference Number"), value: c.reference_no || "", row: "half" },
			{ name: "owner_user", label: __("Internal Owner"), type: "user", required: true, value: c.owner_user || state.boot.user.name, row: "half" },
			{ name: "priority", label: __("Priority"), type: "select", options: opts().priority, value: c.priority || "Medium", required: true, row: "half" },
			{ name: "external_organization", label: __("External Responsible Organization"), type: "link", doctype: "Sijil External Organization", value: c.external_organization || "", valueLabel: c.external_organization || "" },
			{ name: "start_date", label: __("Start Date"), type: "date", value: c.start_date || today(), row: "half" },
			{ name: "target_date", label: __("Target Date"), type: "date", value: c.target_date || "", row: "half" },
			...(caseDoc ? [{ name: "status", label: __("Status"), type: "select", options: opts().case_status, value: c.status, required: true }] : [
				{ name: "current_situation", label: __("Current Situation"), type: "textarea", value: "" },
				{ name: "status", label: __("Status"), type: "select", options: opts().case_status, value: "Not Started", required: true },
			]),
			{ name: "description", label: __("Description"), type: "textarea", value: c.description || "" },
		],
		onSubmit: async (v) => {
			const data = { ...v };
			if (caseDoc) data.name = caseDoc.name;
			const res = await call("cases.save_case", { data: JSON.stringify(data) });
			toast(__("Case saved"));
			onDone && onDone(res);
		},
	});
}

export async function landForm({ land, onDone }) {
	const l = land || {};
	const fields = [
		{ name: "land_name", label: __("Land / Project Name"), required: true, value: l.land_name || "" },
		{ name: "land_code", label: __("Code / Reference Number"), value: l.land_code || "", row: "half", hint: __("Leave empty to use the generated identifier.") },
		{ name: "status", label: __("Status"), type: "select", options: opts().land_status, value: l.status || "Active", required: true, row: "half" },
		{ name: "city", label: __("City"), value: l.city || "", row: "half" },
		{ name: "company", label: __("Company"), type: "link", doctype: "Company", value: l.company || "", valueLabel: l.company || "", row: "half" },
		{ name: "location", label: __("Location"), type: "textarea", value: l.location || "" },
		{ name: "description", label: __("Description"), type: "textarea", value: l.description || "" },
		{ name: "notes", label: __("General Notes"), type: "textarea", value: l.notes || "" },
		{ name: "resp_user", label: __("Responsible Employees"), type: "user", value: "", hint: __("You can add more responsible employees from the land page.") },
	];
	if (!land) fields.push({ name: "create_project", label: __("Also create an ERPNext Project for this land"), type: "check" });
	await openForm({
		title: land ? __("Edit Land / Project") : __("New Land / Project"),
		wide: true,
		fields: land ? fields.filter((f) => f.name !== "resp_user") : fields,
		onSubmit: async (v) => {
			const data = { ...v };
			if (land) data.name = land.name;
			else if (v.resp_user) data.responsibles = [{ user: v.resp_user, responsibility: "" }];
			delete data.resp_user;
			const res = await call("lands.save_land", { data: JSON.stringify(data) });
			toast(__("Land saved"));
			onDone && onDone(res);
		},
	});
}

export async function peopleForm({ land, onDone }) {
	const users = await (await import("./core.js")).users();
	await openForm({
		title: __("Responsible Employees and External Organizations"),
		wide: true,
		fields: [],
		extraHtml: `<div class="sj-nested"><h4>${esc(__("Responsible Employees"))}</h4><div data-resp></div>
			<button type="button" class="sj-btn small" data-add-resp>${icon("plus")} ${esc(__("Add Employee"))}</button></div>
			<div class="sj-nested"><h4>${esc(__("External Organizations"))}</h4><div data-orgs></div>
			<button type="button" class="sj-btn small" data-add-org>${icon("plus")} ${esc(__("Add Organization"))}</button></div>`,
		afterOpen: (form) => {
			const resp = form.querySelector("[data-resp]");
			const orgs = form.querySelector("[data-orgs]");
			const respRow = (r = {}) => {
				const div = document.createElement("div");
				div.className = "sj-grid2";
				div.style.marginBottom = "8px";
				div.innerHTML = `<select data-user>${users.map((u) => `<option value="${esc(u.name)}" ${u.name === r.user ? "selected" : ""}>${esc(u.full_name || u.name)}</option>`).join("")}</select>
					<div class="sj-row"><input type="text" data-role value="${esc(r.responsibility || "")}" placeholder="${esc(__("Responsibility"))}" style="flex:1"><button type="button" class="sj-btn small danger" data-del>×</button></div>`;
				div.querySelector("[data-del]").onclick = () => div.remove();
				resp.appendChild(div);
			};
			const orgRow = (r = {}) => {
				const div = document.createElement("div");
				div.className = "sj-grid2";
				div.style.marginBottom = "8px";
				div.innerHTML = `<div class="sj-combo" data-doctype="Sijil External Organization" data-filters="{}"><input type="text" data-combo-input value="${esc(r.organization || "")}" autocomplete="off"><input type="hidden" data-org value="${esc(r.organization || "")}"><div class="sj-combo-list" hidden></div></div>
					<div class="sj-row"><input type="text" data-role value="${esc(r.role || "")}" placeholder="${esc(__("Role"))}" style="flex:1"><button type="button" class="sj-btn small danger" data-del>×</button></div>`;
				div.querySelector("[data-del]").onclick = () => div.remove();
				orgs.appendChild(div);
				import("./ui.js").then((m) => m.bindCombos(div));
			};
			(land.responsibles || []).forEach(respRow);
			(land.organizations || []).forEach(orgRow);
			form.querySelector("[data-add-resp]").onclick = () => respRow();
			form.querySelector("[data-add-org]").onclick = () => orgRow();
			form.dataset.ready = "1";
		},
		onSubmit: async (v, form) => {
			const responsibles = [...form.querySelectorAll("[data-resp] > div")].map((d) => ({ user: d.querySelector("[data-user]").value, responsibility: d.querySelector("[data-role]").value }));
			const organizations = [...form.querySelectorAll("[data-orgs] > div")].map((d) => ({ organization: d.querySelector("[data-org]").value, role: d.querySelector("[data-role]").value })).filter((o) => o.organization);
			await call("lands.save_land", { data: JSON.stringify({ name: land.name, responsibles, organizations }) });
			toast(__("Land saved"));
			onDone && onDone();
		},
	});
}
