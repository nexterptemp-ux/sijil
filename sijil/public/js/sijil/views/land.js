import { call, delegate, esc, fmtDate, go, href, icon, pill, state } from "../core.js";
import { caseTable, followupRow, taskRow } from "../components.js";
import { caseForm, completeFollowup, landForm, newFollowup, peopleForm, rescheduleFollowup, taskForm } from "../forms.js";
import { confirmDialog, empty, heading, loading, moreButton, stat, toast } from "../ui.js";
import { openReport } from "./reports.js";
import { mountLibrary } from "./documents.js";

const TABS = ["overview", "cases", "followups", "tasks", "documents", "details"];

export default {
	async mount(el, params, app) {
		const land = await call("lands.get_land", { name: params.id });
		const tab = TABS.includes(params.sub) ? params.sub : "overview";
		app.setCrumbs([{ label: __("Lands and Projects"), route: ["lands"] }, { label: land.land_name }]);
		const s = land.stats;
		const canWrite = land.can_write;
		el.innerHTML = `${heading({
			eyebrow: `${land.land_code || land.name}${land.city ? " · " + land.city : ""}`,
			title: land.land_name,
			sub: land.description || "",
			actions: `${pill(land.status)}
				<button type="button" class="sj-btn" data-action="history">${icon("print")} ${esc(__("History Report"))}</button>
				${state.boot.can_create["Sijil Case"] ? `<button type="button" class="sj-btn primary" data-action="new-case">${icon("plus")} ${esc(__("New Case"))}</button>` : ""}
				${canWrite ? `<button type="button" class="sj-btn" data-action="edit">${icon("edit")} ${esc(__("Edit"))}</button>` : ""}`,
		})}
		<div class="sj-stats">
			${stat(__("Open Cases"), s.cases_open, { sub: `${s.cases_total} ${__("total")}`, action: "tab", data: { tab: "cases" } })}
			${stat(__("Cases Without Recent Update"), s.cases_stale, { tone: s.cases_stale ? "attn" : "", action: "tab", data: { tab: "cases" } })}
			${stat(__("Open Follow-ups"), s.followups_open, { sub: s.followups_overdue ? `${s.followups_overdue} ${__("overdue")}` : "", tone: s.followups_overdue ? "warn" : "", action: "tab", data: { tab: "followups" } })}
			${stat(__("Open Tasks"), s.tasks_open, { action: "tab", data: { tab: "tasks" } })}
			${stat(__("Documents"), s.documents, { action: "tab", data: { tab: "documents" } })}
			${stat(__("Developments"), s.events)}
		</div>
		<section class="sj-panel"><div class="sj-tabs">${TABS.map((t) => `<button type="button" class="sj-tab ${t === tab ? "active" : ""}" data-action="tab" data-tab="${t}">${esc({ overview: __("Overview"), cases: __("Cases"), followups: __("Follow-ups"), tasks: __("Tasks"), documents: __("Document Library"), details: __("Details") }[t])}</button>`).join("")}</div>
		<div data-pane></div></section>`;
		const pane = el.querySelector("[data-pane]");

		const panes = {
			async overview() {
				pane.innerHTML = loading();
				const [cases, activity, fus] = await Promise.all([
					call("cases.list_cases", { land: land.name, scope: "open", page_length: 6 }),
					call("lands.land_activity", { land: land.name, page_length: 8 }),
					call("followups.list_followups", { land: land.name, scope: "open", page_length: 5 }),
				]);
				pane.innerHTML = `<div class="sj-panelbody sj-twocol">
					<div><div class="sj-between" style="margin-bottom:8px"><h2 style="font-size:14px">${esc(__("Open Cases"))}</h2><button type="button" class="sj-link" data-action="tab" data-tab="cases">${esc(__("View all"))}</button></div>
						<div class="sj-panel">${caseTable(cases.rows, { showLand: false })}</div></div>
					<div class="sj-stack"><div><h2 style="font-size:14px;margin-bottom:8px">${esc(__("Next Follow-ups"))}</h2><div class="sj-panel">${fus.rows.length ? fus.rows.map((f) => followupRow(f, { actions: false })).join("") : empty(__("No open follow-ups."), "clock")}</div></div>
					<div><h2 style="font-size:14px;margin-bottom:8px">${esc(__("Latest Developments Across Cases"))}</h2><div class="sj-panel">${activity.rows.length ? activity.rows.map((e) => `<a class="sj-item" href="${href("case", e.case)}"><div><h3>${esc(e.title)}</h3><p>${esc(e.case_title || "")} · ${esc(e.recorded_by_name || "")}</p></div><span class="sj-muted">${esc(fmtDate(e.event_date))}</span></a>`).join("") : empty(__("No developments recorded yet."), "history")}</div></div></div></div>`;
			},
			async cases() {
				pane.innerHTML = loading();
				const r = await call("cases.list_cases", { land: land.name, page_length: 100 });
				pane.innerHTML = caseTable(r.rows, { showLand: false }) + moreButton(r.rows.length, r.total);
			},
			async followups() {
				pane.innerHTML = loading();
				const r = await call("followups.list_followups", { land: land.name, scope: "all", page_length: 50 });
				pane.innerHTML = `<div class="sj-panelbody sj-between"><span class="sj-muted">${r.total}</span><button type="button" class="sj-btn small" data-action="new-fu">${icon("plus")} ${esc(__("New Follow-up"))}</button></div>${r.rows.length ? r.rows.map((f) => followupRow(f)).join("") : empty(__("No follow-ups."), "clock")}`;
				pane._fus = r.rows;
			},
			async tasks() {
				pane.innerHTML = loading();
				const r = await call("tasks.list_tasks", { land: land.name, scope: "all", page_length: 50 });
				pane.innerHTML = `<div class="sj-panelbody sj-between"><span class="sj-muted">${r.total}</span><button type="button" class="sj-btn small" data-action="new-task">${icon("plus")} ${esc(__("New Task"))}</button></div>${r.rows.length ? r.rows.map((t) => taskRow(t)).join("") : empty(__("No tasks."), "task")}`;
			},
			async documents() {
				pane.innerHTML = "";
				await mountLibrary(pane, land.name, null, { app, embedded: true });
			},
			async details() {
				const respHtml = land.responsibles.length ? land.responsibles.map((r) => `<div class="sj-kv"><span class="sj-fileicon">${icon("user")}</span><div><strong>${esc(r.full_name)}</strong><small>${esc(r.responsibility || "")}</small></div></div>`).join("") : `<div class="sj-muted">${esc(__("No responsible employees assigned."))}</div>`;
				const orgHtml = land.organizations.length ? land.organizations.map((r) => `<div class="sj-kv"><span class="sj-fileicon">${icon("building")}</span><div><strong>${esc(r.organization)}</strong><small>${esc([r.role, r.organization_type && __(r.organization_type)].filter(Boolean).join(" · "))}</small></div></div>`).join("") : `<div class="sj-muted">${esc(__("No external organizations."))}</div>`;
				const projectHtml = land.project
					? `<a class="sj-btn" href="/app/project/${encodeURIComponent(land.project)}" target="_blank" rel="noopener">${icon("project")} ${esc(land.project)}</a>`
					: canWrite && state.boot.settings ? `<button type="button" class="sj-btn" data-action="make-project">${icon("project")} ${esc(__("Create ERPNext Project"))}</button>` : `<span class="sj-muted">${esc(__("Not linked"))}</span>`;
				pane.innerHTML = `<div class="sj-panelbody sj-grid cols2">
					<div class="sj-stack"><div><h2 style="font-size:14px;margin-bottom:6px">${esc(__("Land Information"))}</h2>
						<div class="sj-kv"><div><strong>${esc(__("Location"))}</strong><small>${esc(land.location || "—")}</small></div></div>
						<div class="sj-kv"><div><strong>${esc(__("Company"))}</strong><small>${esc(land.company || "—")}</small></div></div>
						<div class="sj-kv"><div><strong>${esc(__("General Notes"))}</strong><small style="white-space:pre-wrap">${esc(land.notes || "—")}</small></div></div>
						<div class="sj-kv"><div><strong>${esc(__("ERPNext Project"))}</strong><div style="margin-top:6px">${projectHtml}</div></div></div></div></div>
					<div class="sj-stack"><div><div class="sj-between"><h2 style="font-size:14px">${esc(__("Responsible Employees"))}</h2>${canWrite ? `<button type="button" class="sj-link" data-action="people">${esc(__("Manage"))}</button>` : ""}</div>${respHtml}</div>
						<div><h2 style="font-size:14px;margin-bottom:6px">${esc(__("External Organizations"))}</h2>${orgHtml}</div></div></div>`;
			},
		};

		const show = async (name) => {
			el.querySelectorAll(".sj-tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
			history.replaceState(null, "", href("land", land.name, name));
			await panes[name]();
		};
		await panes[tab]();

		delegate(el, {
			tab: (t) => show(t.dataset.tab),
			edit: () => landForm({ land, onDone: () => app.refresh() }),
			people: () => peopleForm({ land, onDone: () => app.refresh() }),
			history: () => openReport("land", land.name),
			"new-case": () => caseForm({ land: land.name, landLabel: land.land_name, onDone: (r) => go("case", r.name) }),
			"new-fu": () => newFollowup({ land: land.name, onDone: () => show("followups") }),
			"new-task": () => taskForm({ land: land.name, onDone: () => show("tasks") }),
			open: () => {},
			more: () => go("cases"),
			"make-project": async () => {
				if (!(await confirmDialog({ title: __("Create ERPNext Project"), message: __("Create an ERPNext Project for {0} and link it to this land?", [land.land_name]) }))) return;
				await call("lands.create_project", { land: land.name });
				toast(__("Project created"));
				app.refresh();
			},
			complete: (t) => completeFollowup({ fu: pane._fus.find((f) => f.name === t.dataset.name), onDone: () => show("followups") }),
			reschedule: (t) => rescheduleFollowup({ fu: pane._fus.find((f) => f.name === t.dataset.name), onDone: () => show("followups") }),
			"cancel-fu": async (t) => { await call("followups.cancel", { name: t.dataset.name }); show("followups"); },
			"toggle-task": async (t) => { await call("tasks.set_status", { name: t.dataset.name, status: t.checked ? "Completed" : "Open" }); show("tasks"); },
		});
		// table rows open cases
		el.addEventListener("click", (e) => {
			const row = e.target.closest("tr[data-open]");
			if (row) go("case", row.dataset.open);
		});
	},
};
