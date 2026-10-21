import { call, debounce, delegate, esc, fmtDate, fmtDateTime, icon, pill, plain } from "../core.js";
import { docChip, taskRow } from "../components.js";
import { taskForm } from "../forms.js";
import { empty, heading, loading, moreButton, overlay, toast, openForm } from "../ui.js";

const SCOPES = [["open", __("Open")], ["overdue", __("Overdue")], ["completed", __("Completed")], ["all", __("All")]];

export async function taskDrawer(name, { app, onChange }) {
	const t = await call("tasks.get_task", { name });
	const o = overlay({
		kind: "drawer",
		title: t.title,
		body: `<div class="sj-row" style="margin-bottom:10px">${pill(t.status)} ${pill(t.priority)}</div>
			<div class="sj-kv"><div><strong>${esc(__("Assigned To"))}</strong><small>${esc(t.assigned_to_name)}</small></div></div>
			<div class="sj-kv"><div><strong>${esc(__("Due Date"))}</strong><small>${esc(fmtDate(t.due_date))}</small></div></div>
			${t.land ? `<div class="sj-kv"><div><strong>${esc(__("Land / Project"))}</strong><small>${esc(t.land_name || t.land)}</small></div></div>` : ""}
			${t.case ? `<div class="sj-kv"><div><strong>${esc(__("Related Case"))}</strong><small>${esc(t.case_title || t.case)}</small></div></div>` : ""}
			${t.erpnext_task ? `<div class="sj-kv"><div><strong>${esc(__("ERPNext Task"))}</strong><small><a class="sj-link" target="_blank" rel="noopener" href="/app/task/${encodeURIComponent(t.erpnext_task)}">${esc(t.erpnext_task)}</a></small></div></div>` : ""}
			${t.description ? `<p style="white-space:pre-wrap;line-height:1.9">${esc(plain(t.description))}</p>` : ""}
			${t.documents.length ? `<h4 style="margin:10px 0 4px">${esc(__("Supporting Documents"))}</h4>${t.documents.map(docChip).join("")}` : ""}
			<h4 style="margin:14px 0 6px">${esc(__("Notes and Updates"))}</h4>
			${t.updates.length ? t.updates.slice().reverse().map((u) => `<div class="sj-kv"><div><small>${esc(u.user_name)} · ${esc(fmtDateTime(u.update_on))}</small><div style="white-space:pre-wrap">${esc(u.note)}</div></div></div>`).join("") : `<div class="sj-muted">${esc(__("No updates yet."))}</div>`}`,
		footer: t.can_write ? `<button type="button" class="sj-btn" data-act="note">${esc(__("Add Note"))}</button><button type="button" class="sj-btn" data-act="edit">${icon("edit")} ${esc(__("Edit"))}</button>${t.status === "Completed" ? `<button type="button" class="sj-btn" data-act="reopen">${esc(__("Reopen"))}</button>` : `<button type="button" class="sj-btn primary" data-act="done">${icon("check")} ${esc(__("Mark as completed"))}</button>`}` : "",
	});
	o.root.addEventListener("click", async (e) => {
		const b = e.target.closest("[data-act]");
		if (!b) return;
		const finish = () => { o.root.remove(); onChange && onChange(); };
		if (b.dataset.act === "done") { await call("tasks.set_status", { name, status: "Completed" }); toast(__("Task completed")); finish(); }
		if (b.dataset.act === "reopen") { await call("tasks.set_status", { name, status: "Open" }); finish(); }
		if (b.dataset.act === "edit") { o.root.remove(); taskForm({ task: t, onDone: onChange }); }
		if (b.dataset.act === "note") {
			await openForm({ title: __("Add Note"), fields: [{ name: "note", label: __("Note"), type: "textarea", required: true }], onSubmit: async (v) => { await call("tasks.add_update", { name, note: v.note }); o.root.remove(); onChange && onChange(); taskDrawer(name, { app, onChange }); } });
		}
	});
}

export default {
	async mount(el, params, app) {
		app.setCrumbs([{ label: __("Tasks") }]);
		const q = { scope: SCOPES.some(([k]) => k === params.id) ? params.id : "open", mine: 0, search: "", rows: [], total: 0 };
		el.innerHTML = `${heading({
			eyebrow: __("Task Management"),
			title: __("Tasks"),
			sub: __("Independent work items, optionally tied to a land or case. Tasks of lands with an ERPNext Project are mirrored to ERPNext Tasks."),
			actions: `<button type="button" class="sj-btn primary" data-action="new">${icon("plus")} ${esc(__("New Task"))}</button>`,
		})}
		<div class="sj-toolbar"><div class="sj-filters" data-scopes></div>
		<div class="sj-row"><label class="sj-checklabel"><input type="checkbox" data-mine> ${esc(__("Assigned to me"))}</label>
		<input class="sj-input" type="search" data-search placeholder="${esc(__("Search tasks..."))}"></div></div>
		<section class="sj-panel" data-list></section>`;
		const list = el.querySelector("[data-list]");
		const scopes = el.querySelector("[data-scopes]");
		const drawScopes = (counts) => {
			scopes.innerHTML = SCOPES.map(([k, l]) => `<button type="button" class="sj-filter ${q.scope === k ? "active" : ""}" data-action="scope" data-scope="${k}">${esc(l)}${counts && counts[k] !== undefined ? ` <span class="sj-badge soft">${counts[k]}</span>` : ""}</button>`).join("");
		};
		const load = async (append = false) => {
			if (!append) { q.rows = []; list.innerHTML = loading(); }
			const r = await call("tasks.list_tasks", { scope: q.scope, mine: q.mine, search: q.search, start: q.rows.length, page_length: 25 });
			q.rows = q.rows.concat(r.rows);
			q.total = r.total;
			list.innerHTML = (q.rows.length ? q.rows.map((t) => taskRow(t)).join("") : empty(__("No tasks in this view."), "task")) + moreButton(q.rows.length, q.total);
		};
		const loadCounts = async () => drawScopes(await call("tasks.task_counts", { mine: q.mine }));
		drawScopes();
		await Promise.all([load(), loadCounts()]);
		el.querySelector("[data-mine]").addEventListener("change", (e) => { q.mine = e.target.checked ? 1 : 0; load(); loadCounts(); });
		el.querySelector("[data-search]").addEventListener("input", debounce((e) => { q.search = e.target.value; load(); }, 300));
		const done = () => { load(); loadCounts(); };
		delegate(el, {
			scope: (t) => { q.scope = t.dataset.scope; drawScopes(); load(); loadCounts(); },
			more: () => load(true),
			new: () => taskForm({ onDone: done }),
			"open-task": (t) => taskDrawer(t.dataset.name, { app, onChange: done }),
			"toggle-task": async (t) => { await call("tasks.set_status", { name: t.dataset.name, status: t.checked ? "Completed" : "Open" }); done(); },
		});
	},
};
