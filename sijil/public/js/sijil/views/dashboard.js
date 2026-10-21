import { call, delegate, esc, fmtDate, go, href, icon, pill, state } from "../core.js";
import { followupRow } from "../components.js";
import { completeFollowup, recordEventAnywhere, rescheduleFollowup } from "../forms.js";
import { empty, heading, stat } from "../ui.js";

export default {
	async mount(el, params, app) {
		app.setCrumbs([{ label: __("Home") }]);
		const d = await call("dashboard.get_dashboard");
		const c = d.counts;
		const first = state.boot.user.full_name.split(" ")[0];
		el.innerHTML = `
		${heading({
			eyebrow: __("Operations Overview"),
			title: __("Welcome, {0}", [first]),
			sub: __("What needs your attention across all lands and cases."),
			actions: `<button type="button" class="sj-btn primary" data-action="record">${icon("plus")} ${esc(__("Record a Development"))}</button>`,
		})}
		<div class="sj-stats">
			${stat(__("Overdue Follow-ups"), c.overdue_followups, { tone: c.overdue_followups ? "warn" : "", action: "go", data: { to: "followups/overdue" } })}
			${stat(__("Due Today"), c.due_today_followups, { tone: c.due_today_followups ? "attn" : "", action: "go", data: { to: "followups/today" } })}
			${stat(__("Upcoming (7 days)"), c.upcoming_followups, { action: "go", data: { to: "followups/week" } })}
			${stat(__("Open Cases"), c.open_cases, { action: "go", data: { to: "cases/open" }, sub: `${c.awaiting_action} ${__("awaiting action")}` })}
			${stat(__("Cases Without Recent Update"), c.stale_cases, { tone: c.stale_cases ? "attn" : "", action: "go", data: { to: "cases/stale" }, sub: __("No update for {0} days", [d.stale_days]) })}
			${stat(__("Open Tasks"), c.open_tasks, { action: "go", data: { to: "tasks/open" } })}
			${stat(__("Overdue Tasks"), c.overdue_tasks, { tone: c.overdue_tasks ? "warn" : "", action: "go", data: { to: "tasks/overdue" } })}
			${stat(__("Active Lands and Projects"), c.active_lands, { action: "go", data: { to: "lands" } })}
		</div>
		<div class="sj-twocol">
			<div class="sj-stack">
				<section class="sj-panel"><div class="sj-panelhead"><h2>${esc(__("Needs Attention Now"))}</h2><button type="button" class="sj-link" data-action="go" data-to="followups/overdue">${esc(__("View all"))}</button></div>
					${d.attention_followups.length ? d.attention_followups.map((f) => followupRow(f)).join("") : empty(__("Nothing is overdue or due today."), "check")}</section>
				<section class="sj-panel"><div class="sj-panelhead"><h2>${esc(__("Recent Developments"))}</h2></div>
					${d.recent_events.length ? d.recent_events.map((e) => `<a class="sj-item" href="${href("case", e.case)}"><div><h3>${esc(e.title)}</h3><p>${esc(e.case_title || "")} · ${esc(e.land_name || "")} · ${esc(e.recorded_by_name || "")}</p></div><span class="sj-muted">${esc(fmtDate(e.event_date))}</span></a>`).join("") : empty(__("No developments recorded yet."), "history")}</section>
			</div>
			<div class="sj-stack">
				<section class="sj-panel"><div class="sj-panelhead"><h2>${esc(__("Upcoming Follow-ups"))}</h2><button type="button" class="sj-link" data-action="go" data-to="followups/upcoming">${esc(__("View all"))}</button></div>
					${d.upcoming_followups.length ? d.upcoming_followups.map((f) => followupRow(f, { actions: false })).join("") : empty(__("No upcoming follow-ups."), "clock")}</section>
				<section class="sj-panel"><div class="sj-panelhead"><h2>${esc(__("Cases Without Recent Update"))}</h2></div>
					${d.stale_cases.length ? d.stale_cases.map((s) => `<a class="sj-item" href="${href("case", s.name)}"><div><h3>${esc(s.title)}</h3><p>${esc(s.land_name || "")} · ${esc(s.owner_name || "")}</p></div><span class="sj-muted">${esc(fmtDate(s.last_update_date))}</span></a>`).join("") : empty(__("Every open case has a recent update."), "check")}</section>
				<section class="sj-panel"><div class="sj-panelhead"><h2>${esc(__("Recent Documents"))}</h2><button type="button" class="sj-link" data-action="go" data-to="documents">${esc(__("Open library"))}</button></div>
					${d.recent_documents.length ? d.recent_documents.map((x) => `<a class="sj-item" href="${href("documents", x.land)}"><div><h3>${esc(x.title)}</h3><p>${esc(x.land_name || "")} · ${esc(x.document_type ? __(x.document_type) : "")}</p></div><span class="sj-muted">v${x.version_count || 1}</span></a>`).join("") : empty(__("No documents yet."), "file")}</section>
			</div>
		</div>`;
		delegate(el, {
			go: (t) => go(...t.dataset.to.split("/")),
			record: () => recordEventAnywhere({ onDone: () => app.refresh() }),
			complete: (t) => completeFollowup({ fu: d.attention_followups.find((f) => f.name === t.dataset.name), onDone: () => app.refresh() }),
			reschedule: (t) => rescheduleFollowup({ fu: d.attention_followups.find((f) => f.name === t.dataset.name), onDone: () => app.refresh() }),
			"cancel-fu": async (t) => {
				await call("followups.cancel", { name: t.dataset.name });
				app.refresh();
			},
		});
	},
};
