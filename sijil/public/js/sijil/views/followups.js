import { call, debounce, delegate, esc, icon, state } from "../core.js";
import { followupRow } from "../components.js";
import { completeFollowup, newFollowup, rescheduleFollowup } from "../forms.js";
import { empty, heading, loading, moreButton, toast } from "../ui.js";

const SCOPES = [["open", __("Open")], ["overdue", __("Overdue")], ["today", __("Due Today")], ["week", __("Next 7 Days")], ["upcoming", __("Upcoming")], ["completed", __("Completed")], ["cancelled", __("Cancelled")]];

export default {
	async mount(el, params, app) {
		app.setCrumbs([{ label: __("Follow-ups") }]);
		const q = { scope: SCOPES.some(([k]) => k === params.id) ? params.id : "open", mine: 0, search: "", rows: [], total: 0 };
		el.innerHTML = `${heading({
			eyebrow: __("Follow-up Center"),
			title: __("Follow-ups"),
			sub: __("Every follow-up has an owner, a due date and a case. Completing one records its outcome in the case history."),
			actions: `<button type="button" class="sj-btn primary" data-action="new">${icon("plus")} ${esc(__("New Follow-up"))}</button>`,
		})}
		<div class="sj-toolbar"><div class="sj-filters" data-scopes></div>
		<div class="sj-row"><label class="sj-checklabel"><input type="checkbox" data-mine> ${esc(__("Assigned to me"))}</label>
		<input class="sj-input" type="search" data-search placeholder="${esc(__("Search follow-ups..."))}"></div></div>
		<section class="sj-panel" data-list></section>`;
		const list = el.querySelector("[data-list]");
		const scopes = el.querySelector("[data-scopes]");

		const drawScopes = (counts) => {
			scopes.innerHTML = SCOPES.map(([k, l]) => `<button type="button" class="sj-filter ${q.scope === k ? "active" : ""}" data-action="scope" data-scope="${k}">${esc(l)}${counts && counts[k] !== undefined && ["open", "overdue", "today"].includes(k) ? ` <span class="sj-badge ${k === "overdue" && counts[k] ? "" : "soft"}">${counts[k]}</span>` : ""}</button>`).join("");
		};
		const load = async (append = false) => {
			if (!append) { q.rows = []; list.innerHTML = loading(); }
			const r = await call("followups.list_followups", { scope: q.scope, mine: q.mine, search: q.search, start: q.rows.length, page_length: 20 });
			q.rows = q.rows.concat(r.rows);
			q.total = r.total;
			list.innerHTML = (q.rows.length ? q.rows.map((f) => followupRow(f)).join("") : empty(__("No follow-ups in this view."), "clock")) + moreButton(q.rows.length, q.total);
		};
		const loadCounts = async () => drawScopes(await call("followups.followup_counts", { mine: q.mine }));
		drawScopes();
		await Promise.all([load(), loadCounts()]);

		el.querySelector("[data-mine]").addEventListener("change", (e) => { q.mine = e.target.checked ? 1 : 0; load(); loadCounts(); });
		el.querySelector("[data-search]").addEventListener("input", debounce((e) => { q.search = e.target.value; load(); }, 300));
		const done = () => { load(); loadCounts(); app.refreshBadge(); };
		delegate(el, {
			scope: (t) => { q.scope = t.dataset.scope; drawScopes(); load(); loadCounts(); },
			more: () => load(true),
			new: () => newFollowup({ onDone: done }),
			complete: (t) => completeFollowup({ fu: q.rows.find((f) => f.name === t.dataset.name), onDone: done }),
			reschedule: (t) => rescheduleFollowup({ fu: q.rows.find((f) => f.name === t.dataset.name), onDone: done }),
			"cancel-fu": async (t) => { await call("followups.cancel", { name: t.dataset.name }); toast(__("Follow-up cancelled")); done(); },
		});
	},
};
