import { call, debounce, delegate, esc, go, icon, state } from "../core.js";
import { caseTable } from "../components.js";
import { caseForm } from "../forms.js";
import { heading, loading, moreButton } from "../ui.js";

export default {
	async mount(el, params, app) {
		app.setCrumbs([{ label: __("Cases") }]);
		const preset = params.id; // open | stale | mine
		const q = { search: "", scope: preset === "open" ? "open" : "", stale: preset === "stale" ? 1 : 0, mine: preset === "mine" ? 1 : 0, order: preset === "stale" ? "stale" : "updated", rows: [], total: 0 };
		const filters = [["", __("All")], ["open", __("Open")], ["closed", __("Closed")]];
		el.innerHTML = `${heading({
			eyebrow: __("Case Follow-up"),
			title: __("Cases"),
			sub: __("Ongoing cases across all lands, each with its current situation."),
			actions: state.boot.can_create["Sijil Case"] ? `<button type="button" class="sj-btn primary" data-action="new">${icon("plus")} ${esc(__("New Case"))}</button>` : "",
		})}
		<div class="sj-toolbar"><div class="sj-filters">${filters.map(([k, l]) => `<button type="button" class="sj-filter ${q.scope === k && !q.stale && !q.mine ? "active" : ""}" data-action="scope" data-scope="${k}">${esc(l)}</button>`).join("")}
			<button type="button" class="sj-filter ${q.stale ? "active" : ""}" data-action="stale">${esc(__("No recent update"))}</button>
			<button type="button" class="sj-filter ${q.mine ? "active" : ""}" data-action="mine">${esc(__("My cases"))}</button></div>
		<div class="sj-row"><select class="sj-select" data-order aria-label="${esc(__("Sort by"))}"><option value="updated">${esc(__("Latest update"))}</option><option value="stale" ${q.order === "stale" ? "selected" : ""}>${esc(__("Oldest update"))}</option><option value="followup">${esc(__("Next follow-up"))}</option><option value="title">${esc(__("Title"))}</option></select>
		<input class="sj-input" type="search" data-search placeholder="${esc(__("Search cases..."))}"></div></div>
		<section class="sj-panel" data-list></section>`;
		const list = el.querySelector("[data-list]");
		const load = async (append = false) => {
			if (!append) { q.rows = []; list.innerHTML = loading(); }
			const r = await call("cases.list_cases", { search: q.search, scope: q.scope, stale: q.stale, mine: q.mine, order: q.order, start: q.rows.length, page_length: 25 });
			q.rows = q.rows.concat(r.rows);
			q.total = r.total;
			list.innerHTML = caseTable(q.rows) + moreButton(q.rows.length, q.total);
		};
		await load();
		const sync = (active) => el.querySelectorAll(".sj-filters .sj-filter").forEach((b) => b.classList.toggle("active", b === active));
		el.querySelector("[data-search]").addEventListener("input", debounce((e) => { q.search = e.target.value; load(); }, 300));
		el.querySelector("[data-order]").addEventListener("change", (e) => { q.order = e.target.value; load(); });
		el.addEventListener("click", (e) => { const r = e.target.closest("tr[data-open]"); if (r) go("case", r.dataset.open); });
		delegate(el, {
			scope: (t) => { q.scope = t.dataset.scope; q.stale = 0; q.mine = 0; sync(t); load(); },
			stale: (t) => { q.stale = q.stale ? 0 : 1; q.scope = ""; q.mine = 0; sync(q.stale ? t : null); load(); },
			mine: (t) => { q.mine = q.mine ? 0 : 1; q.scope = ""; q.stale = 0; sync(q.mine ? t : null); load(); },
			more: () => load(true),
			new: () => caseForm({ onDone: (r) => go("case", r.name) }),
		});
	},
};
