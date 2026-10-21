// SIJIL single-page application shell: layout, navigation, routing, global search.

import { boot, call, debounce, esc, go, icon, initials, state } from "./core.js";
import { loading } from "./ui.js";
import dashboard from "./views/dashboard.js";
import lands from "./views/lands.js";
import land from "./views/land.js";
import cases from "./views/cases.js";
import caseView from "./views/case.js";
import followups from "./views/followups.js";
import tasks from "./views/tasks.js";
import documents from "./views/documents.js";
import reports from "./views/reports.js";
import integrations from "./views/integrations.js";

const VIEWS = { "": dashboard, home: dashboard, lands, land, cases, case: caseView, followups, tasks, documents, reports, integrations };

const NAV = [
	{ id: "home", label: __("Home"), icon: "home" },
	{ id: "lands", label: __("Lands and Projects"), icon: "land" },
	{ id: "cases", label: __("Cases"), icon: "case" },
	{ id: "followups", label: __("Follow-ups"), icon: "clock", badge: true },
	{ id: "tasks", label: __("Tasks"), icon: "task" },
	{ id: "documents", label: __("Document Library"), icon: "folder" },
	{ id: "reports", label: __("Reports"), icon: "report" },
	{ id: "integrations", label: __("Integrations"), icon: "plug" },
];

class App {
	constructor(wrapper, page) {
		this.wrapper = wrapper;
		this.page = page;
		this.token = 0;
		this.init();
	}

	async init() {
		const root = this.page.main[0];
		root.innerHTML = `<div class="sijil-app" id="sijil-root">${loading()}</div>`;
		this.root = root.querySelector("#sijil-root");
		try {
			await boot();
		} catch (e) {
			this.root.innerHTML = `<div class="sj-empty">${esc(__("Could not load SIJIL. Please reload the page."))}</div>`;
			return;
		}
		this.build();
		this.route();
	}

	build() {
		const b = state.boot;
		this.root.innerHTML = `
		<aside class="sj-sidebar">
			<div class="sj-brand"><div class="sj-brandmark">${esc(__("Sijil").slice(0, 1))}</div><span><strong>${esc(__("Sijil"))}</strong><small>${esc(__("Land and case follow-up"))}</small></span></div>
			<div><div class="sj-navtitle">${esc(__("Workspace"))}</div>
			${NAV.map((n) => `<button type="button" class="sj-nav" data-nav="${n.id}">${icon(n.icon)}<span class="lbl">${esc(n.label)}</span>${n.badge ? '<span class="sj-badge" data-badge hidden></span>' : ""}</button>`).join("")}</div>
			<div class="sj-sidebottom"><div class="sj-person"><div class="sj-avatar">${b.user.image ? `<img src="${esc(b.user.image)}" alt="">` : esc(initials(b.user.full_name))}</div>
			<span><b>${esc(b.user.full_name)}</b><small>${esc(b.user.is_manager ? __("Manager") : __("User"))}</small></span></div>
			<button type="button" class="sj-nav" data-desk>${icon("building")}<span class="lbl">${esc(__("Open Desk"))}</span></button></div>
		</aside>
		<main class="sj-main">
			<header class="sj-topbar"><div class="sj-crumbs" id="sj-crumbs"></div>
				<div class="sj-searchbox"><input class="sj-search" id="sj-search" type="search" autocomplete="off" placeholder="${esc(__("Search lands, cases, tasks, documents..."))}" aria-label="${esc(__("Search"))}"><div class="sj-results" id="sj-results" hidden></div></div></header>
			<div class="sj-workspace" id="sj-view"></div>
		</main>`;
		this.viewEl = this.root.querySelector("#sj-view");

		this.root.querySelector(".sj-sidebar").addEventListener("click", (e) => {
			const n = e.target.closest("[data-nav]");
			if (n) go(n.dataset.nav === "home" ? "" : n.dataset.nav);
			if (e.target.closest("[data-desk]")) frappe.set_route("");
		});

		const input = this.root.querySelector("#sj-search");
		const results = this.root.querySelector("#sj-results");
		const run = debounce(async () => {
			const q = input.value.trim();
			if (q.length < 2) { results.hidden = true; return; }
			const r = await call("meta.search", { query: q });
			results.innerHTML = this.searchHtml(r);
			results.hidden = false;
		}, 300);
		input.addEventListener("input", run);
		input.addEventListener("keydown", (e) => e.key === "Escape" && (results.hidden = true));
		results.addEventListener("click", (e) => {
			const b = e.target.closest("[data-go]");
			if (!b) return;
			results.hidden = true;
			input.value = "";
			go(...b.dataset.go.split("/"));
		});
		document.addEventListener("click", (e) => { if (!e.target.closest(".sj-searchbox")) results.hidden = true; });
	}

	searchHtml(r) {
		const sec = (title, rows, fn) => (rows && rows.length ? `<h6>${esc(title)}</h6>${rows.map(fn).join("")}` : "");
		const item = (to, main, sub) => `<button type="button" class="sj-result" data-go="${esc(to)}">${esc(main)}<small>${esc(sub || "")}</small></button>`;
		const html =
			sec(__("Lands and Projects"), r.lands, (x) => item(`land/${x.name}`, x.land_name, [x.land_code, x.city].filter(Boolean).join(" · "))) +
			sec(__("Cases"), r.cases, (x) => item(`case/${x.name}`, x.title, [x.land_name, __(x.status)].filter(Boolean).join(" · "))) +
			sec(__("Tasks"), r.tasks, (x) => item(`tasks`, x.title, __(x.status))) +
			sec(__("Follow-ups"), r.followups, (x) => item(`followups`, x.title, x.due_date)) +
			sec(__("Documents"), r.documents, (x) => item(`documents/${x.land}/${x.folder || ""}`, x.title, ""));
		return html || `<div class="sj-empty">${esc(__("No results"))}</div>`;
	}

	setCrumbs(items) {
		const el = this.root.querySelector("#sj-crumbs");
		const sep = icon("chevron", { flip: true });
		el.innerHTML = [{ label: __("Sijil"), route: [""] }, ...items]
			.map((c, i, a) => (c.route && i < a.length - 1 ? `<button type="button" data-crumb="${i}">${esc(c.label)}</button>` : `<span>${esc(c.label)}</span>`))
			.join(sep);
		el.onclick = (e) => {
			const b = e.target.closest("[data-crumb]");
			if (!b) return;
			const all = [{ label: __("Sijil"), route: [""] }, ...items];
			go(...all[Number(b.dataset.crumb)].route);
		};
	}

	setActive(id) {
		this.root.querySelectorAll("[data-nav]").forEach((n) => n.classList.toggle("active", n.dataset.nav === id));
	}

	async refreshBadge() {
		try {
			const c = await call("followups.followup_counts", { mine: 1 });
			const n = (c.overdue || 0) + (c.today || 0);
			const b = this.root.querySelector("[data-badge]");
			if (b) { b.hidden = !n; b.textContent = n; }
		} catch (e) { /* non-critical */ }
	}

	async route() {
		if (!this.viewEl) return;
		const [, view = "", id, sub, sub2] = frappe.get_route();
		const mod = VIEWS[view] || dashboard;
		const token = ++this.token;
		this.viewEl.innerHTML = loading();
		this.setCrumbs([]);
		this.setActive(view === "" ? "home" : { land: "lands", case: "cases" }[view] || view);
		const el = document.createElement("div");
		try {
			await mod.mount(el, { id, sub, sub2 }, this);
		} catch (e) {
			console.error(e);
			if (token === this.token) this.viewEl.innerHTML = `<div class="sj-panel"><div class="sj-empty">${esc(__("Could not load this screen."))}<br><button type="button" class="sj-btn small" data-retry style="margin-top:10px">${esc(__("Retry"))}</button></div></div>`;
			this.viewEl.querySelector("[data-retry]")?.addEventListener("click", () => this.route());
			return;
		}
		if (token !== this.token) return; // a newer navigation superseded this one
		this.viewEl.replaceChildren(el);
		window.scrollTo(0, 0);
		this.refreshBadge();
	}

	/** Re-render the current screen (after a change). Keeps scroll position. */
	refresh() {
		const y = window.scrollY;
		return this.route().then(() => window.scrollTo(0, y));
	}
}

window.sijil = { App };
export { App };
