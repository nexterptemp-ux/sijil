import { call, delegate, esc, fmtDate, href, icon } from "../core.js";
import { empty, heading, loading, openForm, toast } from "../ui.js";

const CATALOG = [
	{ key: "overdue_followups", title: __("Overdue Follow-ups"), sub: __("Open follow-ups past their due date"), filters: ["land", "assigned_to"] },
	{ key: "upcoming_followups", title: __("Upcoming Follow-ups"), sub: __("Open follow-ups due in the coming days"), filters: ["land", "assigned_to", "days"] },
	{ key: "open_cases_by_employee", title: __("Open Cases by Responsible Employee"), sub: __("Workload per internal owner"), filters: ["land"] },
	{ key: "case_status_by_project", title: __("Case Status by Project"), sub: __("Cases per land, grouped by status"), filters: ["land"] },
	{ key: "outstanding_tasks", title: __("Outstanding Tasks"), sub: __("Open and in-progress tasks"), filters: ["land", "assigned_to"] },
	{ key: "stale_cases", title: __("Cases With No Recent Updates"), sub: __("Open cases not updated for a configurable period"), filters: ["land", "days"] },
];

/** Open the printable HTML history report in a new window (and offer PDF). */
export async function openReport(kind, name) {
	const method = kind === "case" ? "reports.case_history" : "reports.land_history";
	const r = await call(method, kind === "case" ? { case: name } : { land: name });
	const w = window.open("", "_blank");
	if (!w) { frappe.msgprint(__("Please allow pop-ups to view the report.")); return; }
	const pdfUrl = `/api/method/sijil.api.reports.${kind === "case" ? "case_history_pdf" : "land_history_pdf"}?${kind === "case" ? "case" : "land"}=${encodeURIComponent(name)}`;
	const bar = `<div style="position:fixed;top:8px;inset-inline-end:8px;display:flex;gap:6px;font-family:sans-serif" class="noprint"><button onclick="window.print()">${esc(__("Print"))}</button><a href="${pdfUrl}" style="padding:2px 8px;border:1px solid #888;border-radius:3px;background:#efefef;color:#000;text-decoration:none;font-size:13px">PDF</a></div><style>@media print{.noprint{display:none}}</style>`;
	w.document.open();
	w.document.write(r.html.replace("</body>", bar + "</body>"));
	w.document.close();
}

function filterFields(keys, values) {
	const map = {
		land: { name: "land", label: __("Land / Project"), type: "link", doctype: "Sijil Land", value: values.land || "", valueLabel: values.land_label || "" },
		assigned_to: { name: "assigned_to", label: __("Assigned To"), type: "user", value: values.assigned_to || "" },
		days: { name: "days", label: __("Days"), type: "number", value: values.days || "" },
	};
	return keys.map((k) => map[k]);
}

const FMT = {
	Date: (v) => (v ? fmtDate(v) : "—"),
	Int: (v) => (v === null || v === undefined ? "—" : v),
};

function cell(col, row) {
	const v = row[col.fieldname];
	if (col.fieldtype === "Link" && v) {
		const route = { "Sijil Case": href("case", v), "Sijil Land": href("land", v), "Sijil Follow Up": href("followups"), "Sijil Task": href("tasks") }[col.options];
		return route ? `<a class="sj-link" href="${route}">${esc(v)}</a>` : esc(v);
	}
	if (FMT[col.fieldtype]) return esc(FMT[col.fieldtype](v));
	return esc(v ?? "");
}

export function tableHtml(result) {
	if (!result.rows.length) return empty(__("No data for these filters."), "report");
	return `<div class="sj-tablewrap"><table class="sj-table"><thead><tr>${result.columns.map((c) => `<th>${esc(c.label)}</th>`).join("")}</tr></thead><tbody>${result.rows.map((r) => `<tr>${result.columns.map((c) => `<td>${cell(c, r)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function toCsv(result) {
	const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
	return "﻿" + [result.columns.map((c) => q(c.label)).join(","), ...result.rows.map((r) => result.columns.map((c) => q(r[c.fieldname])).join(","))].join("\r\n");
}

export default {
	async mount(el, params, app) {
		app.setCrumbs([{ label: __("Reports") }]);
		const current = CATALOG.find((c) => c.key === params.id);
		const state = { filters: {}, result: null };
		el.innerHTML = `${heading({
			eyebrow: __("Reporting"),
			title: __("Reports"),
			sub: __("Operational reports. Open a case or a land to print its full history report (Arabic RTL, print and PDF)."),
		})}
		<div class="sj-grid cols3" data-catalog>${CATALOG.map((c) => `<button type="button" class="sj-landtile" data-action="pick" data-key="${c.key}"><div class="sj-row"><span class="sj-fileicon">${icon("report")}</span></div><h3>${esc(c.title)}</h3><p>${esc(c.sub)}</p></button>`).join("")}</div>
		<section class="sj-panel" data-result style="margin-top:16px" hidden></section>`;
		const box = el.querySelector("[data-result]");

		const run = async (cfg) => {
			box.hidden = false;
			box.innerHTML = loading();
			state.result = await call("reports.run", { report: cfg.key, filters: JSON.stringify(state.filters) });
			box.innerHTML = `<div class="sj-panelhead"><h2>${esc(cfg.title)} <span class="sj-muted">(${state.result.rows.length})</span></h2>
				<div class="sj-actions">${cfg.filters.length ? `<button type="button" class="sj-btn small" data-action="filters">${esc(__("Filters"))}</button>` : ""}
				<button type="button" class="sj-btn small" data-action="csv">${esc(__("Export CSV"))}</button>
				<button type="button" class="sj-btn small" data-action="print">${icon("print")} ${esc(__("Print"))}</button></div></div>${tableHtml(state.result)}`;
			box.scrollIntoView({ behavior: "smooth", block: "start" });
		};
		let cfg = current || null;
		if (cfg) await run(cfg);
		delegate(el, {
			pick: (t) => { cfg = CATALOG.find((c) => c.key === t.dataset.key); state.filters = {}; run(cfg); },
			filters: () => openForm({
				title: __("Filters"),
				fields: filterFields(cfg.filters, state.filters),
				onSubmit: async (v) => { state.filters = Object.fromEntries(Object.entries(v).filter(([, x]) => x)); await run(cfg); },
			}),
			csv: () => {
				const blob = new Blob([toCsv(state.result)], { type: "text/csv;charset=utf-8" });
				const a = document.createElement("a");
				a.href = URL.createObjectURL(blob);
				a.download = `${cfg.key}.csv`;
				a.click();
				toast(__("Exported"));
			},
			print: () => window.print(),
		});
	},
};
