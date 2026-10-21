import { call, debounce, delegate, esc, go, icon, pill, state } from "../core.js";
import { landForm } from "../forms.js";
import { empty, heading, loading, moreButton } from "../ui.js";

export default {
	async mount(el, params, app) {
		app.setCrumbs([{ label: __("Lands and Projects") }]);
		const q = { search: "", status: "Active", rows: [], total: 0 };
		const can = state.boot.can_create["Sijil Land"];
		el.innerHTML = `${heading({
			eyebrow: __("Portfolio"),
			title: __("Lands and Projects"),
			sub: __("Each land is a master file holding its cases, tasks, follow-ups and document library."),
			actions: can ? `<button type="button" class="sj-btn primary" data-action="new">${icon("plus")} ${esc(__("New Land / Project"))}</button>` : "",
		})}
		<div class="sj-toolbar"><div class="sj-filters" data-filters>${["Active", "On Hold", "Completed", "Archived", ""].map((s) => `<button type="button" class="sj-filter ${s === q.status ? "active" : ""}" data-action="status" data-status="${esc(s)}">${esc(s ? __(s) : __("All"))}</button>`).join("")}</div>
		<input class="sj-input" data-search type="search" placeholder="${esc(__("Search lands..."))}"></div>
		<div data-grid></div>`;
		const grid = el.querySelector("[data-grid]");

		const load = async (append = false) => {
			if (!append) { q.rows = []; grid.innerHTML = loading(); }
			const r = await call("lands.list_lands", { search: q.search, status: q.status, start: q.rows.length, page_length: 24 });
			q.rows = q.rows.concat(r.rows);
			q.total = r.total;
			grid.innerHTML = q.rows.length
				? `<div class="sj-grid cols3">${q.rows.map((l) => `<button type="button" class="sj-landtile" data-action="open" data-name="${esc(l.name)}">
					<div class="sj-row"><span class="sj-fileicon">${icon("land")}</span>${pill(l.status)}<span class="sj-pill blue">${esc(l.land_code || l.name)}</span></div>
					<h3>${esc(l.land_name)}</h3><p>${esc(l.city || "")}</p>
					<div class="sj-landfoot"><span>${l.open_cases} ${esc(__("open cases"))}</span><span>${l.overdue_followups ? `<b style="color:var(--sj-red)">${l.overdue_followups} ${esc(__("overdue"))}</b>` : `${l.open_followups} ${esc(__("follow-ups"))}`}</span><span>${l.documents} ${esc(__("documents"))}</span></div></button>`).join("")}</div>${moreButton(q.rows.length, q.total)}`
				: `<div class="sj-panel">${empty(__("No lands found"), "land")}</div>`;
		};
		await load();
		el.querySelector("[data-search]").addEventListener("input", debounce((e) => { q.search = e.target.value; load(); }, 300));
		delegate(el, {
			status: (t) => {
				q.status = t.dataset.status;
				el.querySelectorAll("[data-action=status]").forEach((b) => b.classList.toggle("active", b === t));
				load();
			},
			open: (t) => go("land", t.dataset.name),
			more: () => load(true),
			new: () => landForm({ onDone: (r) => go("land", r.name) }),
		});
	},
};
