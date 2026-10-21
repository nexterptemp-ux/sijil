// Presentational building blocks shared between screens (return HTML strings).

import { esc, eventIcon, fmtDate, fmtDateTime, icon, pill, plain, relativeDue, href, fileSize } from "./core.js";

export function followupRow(f, { showCase = true, actions = true } = {}) {
	const cls = { Overdue: "overdue", "Due Today": "today", Completed: "done", Cancelled: "cancelled" }[f.state] || "";
	const where = showCase && f.case ? `<a class="sj-link" href="${href("case", f.case)}">${esc(f.case_title || f.case)}</a>${f.land_name ? " · " + esc(f.land_name) : ""} · ` : "";
	const done = f.status === "Completed";
	return `<div class="sj-fu ${cls}"><div class="sj-fubar"></div>
		<div><span class="sj-fu-title">${esc(f.title)}</span>
			<div class="sj-fu-meta">${where}${icon("user")} ${esc(f.assigned_to_name || f.assigned_to)} · ${done ? esc(__("Completed")) + " " + esc(fmtDate(f.completion_date)) : esc(fmtDate(f.due_date)) + " — " + esc(relativeDue(f.due_date))}</div>
			${done && f.outcome ? `<div class="sj-outcome">${esc(plain(f.outcome))}</div>` : ""}</div>
		<div class="sj-actions">${pill(f.state)}${actions && f.status === "Open" ? `<button type="button" class="sj-btn small primary" data-action="complete" data-name="${esc(f.name)}">${icon("check")} ${esc(__("Complete"))}</button><button type="button" class="sj-btn small" data-action="reschedule" data-name="${esc(f.name)}">${esc(__("Reschedule"))}</button><button type="button" class="sj-btn small danger" data-action="cancel-fu" data-name="${esc(f.name)}">${esc(__("Cancel"))}</button>` : ""}</div></div>`;
}

export function caseTable(rows, { showLand = true } = {}) {
	if (!rows.length) return `<div class="sj-empty">${icon("case")}<div>${esc(__("No cases found"))}</div></div>`;
	return `<div class="sj-tablewrap"><table class="sj-table"><thead><tr><th>${esc(__("Case"))}</th>${showLand ? `<th>${esc(__("Land / Project"))}</th>` : ""}<th>${esc(__("Current Situation"))}</th><th>${esc(__("Internal Owner"))}</th><th>${esc(__("Status"))}</th><th>${esc(__("Next Follow-up"))}</th></tr></thead><tbody>
	${rows.map((c) => `<tr data-open="${esc(c.name)}"><td class="name">${esc(c.title)}<div class="sj-muted" style="font-weight:400;font-size:11px">${esc(c.reference_no || c.name)}</div></td>${showLand ? `<td>${esc(c.land_name || "")}</td>` : ""}<td class="clip">${esc((c.current_situation || "—").slice(0, 120))}</td><td>${esc(c.owner_name || c.owner_user)}</td><td>${pill(c.status)}</td><td>${c.next_followup_date ? esc(fmtDate(c.next_followup_date)) : "—"}</td></tr>`).join("")}
	</tbody></table></div>`;
}

export function docChip(d) {
	const v = d.version;
	const label = esc(d.title) + (v ? ` · v${v.version_no}` : "");
	const newer = d.has_newer_version ? ` <span class="sj-pill amber" title="${esc(__("A newer version exists; this record keeps the version it was linked to."))}">${esc(__("Newer version exists"))}</span>` : "";
	return v && v.file
		? `<a class="sj-attach" href="${esc(v.file)}" target="_blank" rel="noopener">${icon("file")} ${label}</a>${newer}`
		: `<span class="sj-attach">${icon("file")} ${label}</span>`;
}

export function eventItem(e, { canCorrect = false } = {}) {
	const [ico, tone] = eventIcon(e);
	const superseded = e.entry_status === "Superseded";
	return `<div class="sj-event ${superseded ? "superseded" : ""}"><div class="sj-dot ${tone}">${icon(ico)}</div>
	<div class="sj-eventbody">
		<div class="sj-between"><h4>${esc(e.title)}</h4><span class="sj-eventdate">${esc(fmtDate(e.event_date))}</span></div>
		<div class="sj-row" style="gap:6px;margin:2px 0">${pill(e.event_type, "blue")}${e.communication_method ? pill(e.communication_method, "grey") : ""}${e.is_milestone ? pill("Milestone", "green") : ""}${superseded ? pill("Superseded", "grey") : ""}</div>
		<span class="sj-eventdate">${esc(__("Recorded By"))} ${esc(e.recorded_by_name || e.recorded_by)} · ${esc(fmtDateTime(e.recorded_on))}</span>
		${e.description ? `<div class="sj-text" style="white-space:pre-wrap">${esc(plain(e.description))}</div>` : ""}
		${e.outcome ? `<div class="sj-outcome"><b>${esc(__("Outcome"))}:</b> ${esc(e.outcome)}</div>` : ""}
		${e.situation_update ? `<div class="sj-outcome"><b>${esc(__("New Current Situation"))}:</b> ${esc(e.situation_update)}</div>` : ""}
		${e.corrects ? `<div class="sj-eventdate">${esc(__("Corrects Event"))} ${esc(e.corrects)} — ${esc(e.correction_reason || "")}</div>` : ""}
		${superseded && e.superseded_by ? `<div class="sj-eventdate">${esc(__("Superseded By"))} ${esc(e.superseded_by)}</div>` : ""}
		<div>${(e.documents || []).map(docChip).join("")}</div>
		${canCorrect && !superseded ? `<button type="button" class="sj-link" data-action="correct" data-name="${esc(e.name)}" style="font-size:11px">${esc(__("Correct this entry"))}</button>` : ""}
	</div></div>`;
}

export function taskRow(t, { showCase = true } = {}) {
	const finished = t.status === "Completed" || t.status === "Cancelled";
	return `<div class="sj-task ${finished ? "finished" : ""}">
		<input type="checkbox" data-action="toggle-task" data-name="${esc(t.name)}" ${t.status === "Completed" ? "checked" : ""} ${t.status === "Cancelled" ? "disabled" : ""} aria-label="${esc(__("Mark as completed"))}">
		<div class="sj-task-main"><button type="button" class="sj-task-title" data-action="open-task" data-name="${esc(t.name)}">${esc(t.title)}</button>
			<div class="sj-fu-meta">${t.land_name ? esc(t.land_name) : ""}${showCase && t.case_title ? " / " + esc(t.case_title) : ""} · ${icon("user")} ${esc(t.assigned_to_name || t.assigned_to)}${t.erpnext_task ? ` · <a class="sj-link" href="/app/task/${encodeURIComponent(t.erpnext_task)}" target="_blank" rel="noopener">${esc(__("ERPNext Task"))}</a>` : ""}</div></div>
		<div class="sj-task-side">${pill(t.status === "Open" || t.status === "In Progress" ? (t.overdue ? "Overdue" : t.status) : t.status, t.status === "In Progress" && !t.overdue ? "amber" : undefined)}<div>${t.due_date ? esc(fmtDate(t.due_date)) : ""}</div><div>${pill(t.priority)}</div></div></div>`;
}

export function docFile(d) {
	const v = d.version;
	return `<button type="button" class="sj-tile" data-action="open-doc" data-name="${esc(d.name)}"><span class="sj-glyph file">${icon("file")}</span>
		<strong>${esc(d.title)}</strong><small>${esc(d.document_type ? __(d.document_type) : "")}${d.is_confidential ? " · " + esc(__("Confidential")) : ""}</small>
		<small>${v ? "v" + v.version_no + " · " + esc(fileSize(v.file_size)) + " · " : ""}${esc(fmtDate(d.modified))}${d.links ? " · " + icon("link") + " " + d.links : ""}</small></button>`;
}
