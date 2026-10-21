import { call, delegate, esc, fmtDate, go, href, icon, pill, relativeDue } from "../core.js";
import { docChip, eventItem, followupRow, taskRow } from "../components.js";
import { caseForm, completeFollowup, correctEvent, editSituation, newFollowup, recordEvent, rescheduleFollowup, taskForm } from "../forms.js";
import { empty, loading, moreButton, toast } from "../ui.js";
import { openReport } from "./reports.js";
import { taskDrawer } from "./tasks.js";

export default {
	async mount(el, params, app) {
		const c = await call("cases.get_case", { name: params.id });
		app.setCrumbs([{ label: __("Lands and Projects"), route: ["lands"] }, { label: c.land_name, route: ["land", c.land] }, { label: c.title }]);
		let tab = params.sub === "documents" ? "documents" : "history";
		const ev = { rows: [], total: 0, showSuperseded: true };
		const nextFu = c.open_followups[0];

		el.innerHTML = `
		<div class="sj-heading"><div><p class="sj-eyebrow">${esc(c.land_name)} · ${esc(c.reference_no || c.name)}${c.case_type ? " · " + esc(__(c.case_type)) : ""}</p>
			<h1>${esc(c.title)}</h1></div>
			<div class="sj-actions">${pill(c.status)} ${pill(c.priority)}
				<button type="button" class="sj-btn" data-action="report">${icon("print")} ${esc(__("History Report"))}</button>
				${c.can_write ? `<button type="button" class="sj-btn" data-action="edit">${icon("edit")} ${esc(__("Edit"))}</button>` : ""}
				${c.can_write ? `<button type="button" class="sj-btn primary" data-action="record">${icon("plus")} ${esc(__("Record a Development"))}</button>` : ""}</div></div>
		<div class="sj-twocol">
			<div class="sj-stack">
				<section class="sj-banner">
					<div class="sj-between"><h3>● ${esc(__("Current Situation"))}</h3>${c.can_write ? `<button type="button" class="sj-link" data-action="situation">${esc(__("Update"))}</button>` : ""}</div>
					<p>${esc(c.current_situation || __("No situation recorded yet."))}</p>
					<div class="sj-meta"><span>${esc(__("Internal Owner"))}: <b>${esc(c.owner_name || c.owner_user)}</b></span>
						<span>${esc(__("External Responsible Organization"))}: <b>${esc(c.external_organization || "—")}</b></span>
						<span>${esc(__("Last Meaningful Update"))}: <b>${esc(fmtDate(c.last_update_date))}</b></span>
						${c.target_date ? `<span>${esc(__("Target Date"))}: <b>${esc(fmtDate(c.target_date))}</b></span>` : ""}</div>
					<div class="sj-next">${icon("clock")} <b>${esc(__("Next Required Action"))}:</b>
						${nextFu ? `<span>${esc(nextFu.title)} — ${esc(nextFu.assigned_to_name || nextFu.assigned_to)} — ${esc(fmtDate(nextFu.due_date))} (${esc(relativeDue(nextFu.due_date))})</span>` : `<span class="sj-muted">${esc(__("No follow-up scheduled."))}</span>${c.can_write ? ` <button type="button" class="sj-link" data-action="new-fu">${esc(__("Schedule one"))}</button>` : ""}`}</div>
				</section>
				<section class="sj-panel">
					<div class="sj-between" style="padding:16px 20px 0"><h2 style="font-size:15px">${esc(__("Case History"))}</h2><span class="sj-pill blue">${c.stats.events} ${esc(__("developments"))}</span></div>
					<div class="sj-tabs"><button type="button" class="sj-tab active" data-action="tab" data-tab="history">${esc(__("Developments"))}</button><button type="button" class="sj-tab" data-action="tab" data-tab="documents">${esc(__("Documents"))} (${c.documents.length})</button></div>
					<div data-pane></div>
				</section>
			</div>
			<div class="sj-stack">
				<section class="sj-panel"><div class="sj-panelhead"><h2>${esc(__("Open Follow-ups"))}</h2>${c.can_write ? `<button type="button" class="sj-link" data-action="new-fu">+ ${esc(__("Add"))}</button>` : ""}</div>
					${c.open_followups.length ? c.open_followups.map((f) => followupRow(f, { showCase: false })).join("") : empty(__("No open follow-ups."), "clock")}
					<div class="sj-panelbody sj-muted" style="font-size:11px">${c.stats.followups_done} / ${c.stats.followups_total} ${esc(__("follow-ups completed"))}</div></section>
				<section class="sj-panel"><div class="sj-panelhead"><h2>${esc(__("Related Tasks"))}</h2><button type="button" class="sj-link" data-action="new-task">+ ${esc(__("Add"))}</button></div>
					${c.tasks.length ? c.tasks.map((t) => taskRow({ ...t, land_name: "" }, { showCase: false })).join("") : empty(__("No open tasks."), "task")}</section>
				<section class="sj-panel"><div class="sj-panelhead"><h2>${esc(__("Case File"))}</h2></div><div class="sj-panelbody">
					<div class="sj-kv"><span class="sj-fileicon">${icon("user")}</span><div><strong>${esc(__("Internal Owner"))}</strong><small>${esc(c.owner_name || c.owner_user)}</small></div></div>
					<div class="sj-kv"><span class="sj-fileicon">${icon("building")}</span><div><strong>${esc(__("External Responsible Organization"))}</strong><small>${esc(c.external_organization || "—")}</small></div></div>
					${c.external_contact_name ? `<div class="sj-kv"><span class="sj-fileicon">${icon("users")}</span><div><strong>${esc(__("External Contact"))}</strong><small>${esc(c.external_contact_name)}</small></div></div>` : ""}
					<div class="sj-kv"><span class="sj-fileicon">${icon("calendar")}</span><div><strong>${esc(__("Start Date"))}</strong><small>${esc(fmtDate(c.start_date))}</small></div></div>
					${c.project ? `<div class="sj-kv"><span class="sj-fileicon">${icon("project")}</span><div><strong>${esc(__("ERPNext Project"))}</strong><small><a class="sj-link" target="_blank" rel="noopener" href="/app/project/${encodeURIComponent(c.project)}">${esc(c.project)}</a></small></div></div>` : ""}
					${c.relations.length ? `<div style="margin-top:8px"><strong style="font-size:12px">${esc(__("Related Cases"))}</strong>${c.relations.map((r) => `<div class="sj-kv"><div><a class="sj-link" href="${href("case", r.related_case)}">${esc(r.title || r.related_case)}</a><br><small class="sj-muted">${esc(__(r.relation_type))} · ${esc(__(r.status || ""))}</small></div></div>`).join("")}</div>` : ""}
					${c.description ? `<div style="margin-top:8px"><strong style="font-size:12px">${esc(__("Description"))}</strong><p class="sj-muted" style="white-space:pre-wrap;margin:4px 0 0">${esc(c.description)}</p></div>` : ""}
				</div></section>
			</div>
		</div>`;

		const pane = el.querySelector("[data-pane]");
		const renderHistory = () => {
			const rows = ev.showSuperseded ? ev.rows : ev.rows.filter((e) => e.entry_status !== "Superseded");
			pane.innerHTML = `<div class="sj-feed">${rows.length ? rows.map((e) => eventItem(e, { canCorrect: c.can_write })).join("") : empty(__("No developments recorded yet."), "history")}</div>${moreButton(ev.rows.length, ev.total, "more-events")}`;
		};
		const loadEvents = async (append = false) => {
			if (!append) { ev.rows = []; pane.innerHTML = loading(); }
			const r = await call("cases.list_events", { case: c.name, start: ev.rows.length, page_length: 15 });
			ev.rows = ev.rows.concat(r.rows);
			ev.total = r.total;
			renderHistory();
		};
		const renderDocs = () => {
			pane.innerHTML = c.documents.length
				? `<div class="sj-panelbody">${c.documents.map((d) => `<div class="sj-kv"><span class="sj-fileicon">${icon("file")}</span><div style="flex:1">${docChip(d)}<small class="sj-muted" style="display:block">${esc(d.document_type ? __(d.document_type) : "")}</small></div></div>`).join("")}</div>`
				: empty(__("No documents are linked directly to this case. Documents attached to developments appear under each development."), "file");
		};
		const showTab = (name) => {
			tab = name;
			el.querySelectorAll(".sj-tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
			name === "history" ? (ev.rows.length ? renderHistory() : loadEvents()) : renderDocs();
		};
		showTab(tab);

		const refresh = () => app.refresh();
		const allFus = c.open_followups;
		delegate(el, {
			tab: (t) => showTab(t.dataset.tab),
			"more-events": () => loadEvents(true),
			record: () => recordEvent({ caseDoc: c, onDone: refresh }),
			edit: () => caseForm({ caseDoc: c, onDone: refresh }),
			situation: () => editSituation({ caseDoc: c, onDone: refresh }),
			report: () => openReport("case", c.name),
			"new-fu": () => newFollowup({ caseDoc: c, onDone: refresh }),
			"new-task": () => taskForm({ caseDoc: c, onDone: refresh }),
			correct: (t) => correctEvent({ event: ev.rows.find((e) => e.name === t.dataset.name), onDone: refresh }),
			complete: (t) => completeFollowup({ fu: allFus.find((f) => f.name === t.dataset.name), onDone: refresh }),
			reschedule: (t) => rescheduleFollowup({ fu: allFus.find((f) => f.name === t.dataset.name), onDone: refresh }),
			"cancel-fu": async (t) => { await call("followups.cancel", { name: t.dataset.name }); toast(__("Follow-up cancelled")); refresh(); },
			"toggle-task": async (t) => { await call("tasks.set_status", { name: t.dataset.name, status: t.checked ? "Completed" : "Open" }); refresh(); },
			"open-task": (t) => taskDrawer(t.dataset.name, { app, onChange: refresh }),
		});
	},
};
