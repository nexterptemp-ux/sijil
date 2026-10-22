// Mock implementation of sijil.api.* with the same arguments and response shapes as the backend
// (docs/architecture/api.md). Business rules are mirrored only as far as the UI needs them —
// the real rules live in the Frappe app and are verified there (roadmap E1/E2).

/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiError } from "@/lib/api/client";
import {
	addVersion,
	createLandFolders,
	DEMO,
	isoDate,
	link,
	ME,
	nextName,
	nowStamp,
	type MockDb,
	type Row,
} from "./db";

type Args = Record<string, any>;
type Handler = (db: MockDb, args: Args) => unknown;

const CLOSED = ["Completed", "Cancelled"];
const KEY_TYPES = ["Title Deed", "Organizational Sketch", "Approved Master Plan"];
const OPEN_TASK = ["Open", "In Progress"];

const fail = (message: string, status = 417, exc = "ValidationError"): never => {
	throw new ApiError(message, status, exc);
};
const today = () => isoDate(0);
const parse = (v: any, fallback: any = undefined) => {
	if (v === undefined || v === null || v === "") return fallback;
	if (typeof v === "string") {
		try {
			return JSON.parse(v);
		} catch {
			return v;
		}
	}
	return v;
};
const int = (v: any) => Number.parseInt(String(v ?? 0), 10) || 0;
const paging = (a: Args, def = 20) =>
	[Math.max(int(a.start), 0), Math.min(Math.max(int(a.page_length) || def, 1), 100)] as const;
const page = (rows: Row[], start: number, len: number) => ({
	total: rows.length,
	rows: rows.slice(start, start + len),
	start,
	page_length: len,
	has_more: start + len < rows.length,
});
const like = (q: any, ...values: any[]) => {
	const s = String(q ?? "")
		.trim()
		.toLowerCase();
	return (
		!s ||
		values.some((v) =>
			String(v ?? "")
				.toLowerCase()
				.includes(s),
		)
	);
};
const byDesc = (key: string) => (a: Row, b: Row) => String(b[key] ?? "").localeCompare(String(a[key] ?? ""));
const byAsc = (key: string) => (a: Row, b: Row) => String(a[key] ?? "￿").localeCompare(String(b[key] ?? "￿"));

function get(rows: Row[], name: string, what = "Record"): Row {
	const row = rows.find((r) => r.name === name);
	if (!row) fail(`${what} ${name} not found`, 404, "DoesNotExistError");
	return row as Row;
}
const userName = (db: MockDb, u?: string | null) => db.users.find((x) => x.name === u)?.full_name ?? u ?? null;
const landName = (db: MockDb, l?: string | null) => db.lands.find((x) => x.name === l)?.land_name ?? null;
const caseTitle = (db: MockDb, c?: string | null) => db.cases.find((x) => x.name === c)?.title ?? null;

export function followupState(status: string, due: string) {
	if (CLOSED.includes(status)) return status;
	if (due < today()) return "Overdue";
	if (due === today()) return "Due Today";
	return "Upcoming";
}

const FOLLOWUP_FIELDS = [
	"name",
	"title",
	"case",
	"land",
	"assigned_to",
	"due_date",
	"priority",
	"status",
	"completion_date",
];
const pick = (row: Row, fields: string[]) => Object.fromEntries(fields.map((f) => [f, row[f] ?? null]));

function decorateFollowup(db: MockDb, f: Row, extra: string[] = []) {
	return {
		...pick(f, [...FOLLOWUP_FIELDS, ...extra]),
		state: followupState(f.status, f.due_date),
		case_title: caseTitle(db, f.case),
		land_name: landName(db, f.land),
		assigned_to_name: userName(db, f.assigned_to),
	};
}

function refreshNextFollowup(db: MockDb, caseName?: string | null) {
	const c = db.cases.find((x) => x.name === caseName);
	if (!c) return;
	const open = db.followups
		.filter((f) => f.case === c.name && f.status === "Open")
		.map((f) => f.due_date)
		.sort();
	c.next_followup_date = open[0] ?? null;
}

function describeLink(db: MockDb, l: Row) {
	const doc = db.documents.find((d) => d.name === l.document);
	if (!doc) return null;
	const versionName = l.follow_latest ? doc.current_version : l.document_version || doc.current_version;
	const v = db.versions.find((x) => x.name === versionName);
	return {
		link: l.name,
		document: l.document,
		title: doc.title,
		document_type: doc.document_type,
		land: doc.land,
		is_confidential: doc.is_confidential,
		follow_latest: l.follow_latest,
		note: l.note,
		linked_by: l.linked_by,
		linked_on: l.creation,
		version: v
			? pick(v, ["name", "version_no", "file", "file_name", "file_size", "creation", "uploaded_by"])
			: null,
		has_newer_version: Boolean(v && doc.current_version && v.name !== doc.current_version),
		current_version_no: doc.version_count,
	};
}
const linksFor = (db: MockDb, doctype: string, name: string) =>
	db.links
		.filter((l) => l.linked_doctype === doctype && l.linked_name === name)
		.sort(byDesc("creation"))
		.map((l) => describeLink(db, l))
		.filter(Boolean);

function linkDocument(db: MockDb, a: Args) {
	const doc = get(db.documents, a.document, "Document");
	const table: Record<string, Row[]> = {
		"Sijil Land": db.lands,
		"Sijil Case": db.cases,
		"Sijil Case Event": db.events,
		"Sijil Task": db.tasks,
		"Sijil Follow Up": db.followups,
	};
	const rows = table[a.linked_doctype];
	if (!rows) fail(`Documents cannot be linked to ${a.linked_doctype}.`);
	const target = get(rows as Row[], a.linked_name);
	const targetLand = a.linked_doctype === "Sijil Land" ? target.name : target.land;
	if (targetLand && targetLand !== doc.land)
		fail("The document and the record it is linked to must belong to the same land.");
	if (
		db.links.some(
			(l) => l.document === doc.name && l.linked_doctype === a.linked_doctype && l.linked_name === a.linked_name,
		)
	)
		fail(`This document is already linked to ${a.linked_doctype} ${a.linked_name}.`);
	return link(db, doc, a.linked_doctype, a.linked_name, a.document_version, int(a.follow_latest), a.note ?? null)
		.name;
}

const EVENT_FIELDS = [
	"event_date",
	"event_time",
	"title",
	"description",
	"event_type",
	"communication_method",
	"external_organization",
	"outcome",
	"situation_update",
	"status_after",
	"is_milestone",
];

function addEvent(db: MockDb, data: Row): Row {
	const c = get(db.cases, data.case, "Case");
	if (!data.title?.trim()) fail("Title is required.");
	if (!data.event_date) fail("Event Date is required.");
	if (data.event_date > today())
		fail("An event records something that already happened. Use a follow-up for future actions.");
	const values = Object.fromEntries(
		EVENT_FIELDS.filter((f) => data[f] !== undefined && data[f] !== "").map((f) => [f, data[f]]),
	);
	const event: Row = {
		name: nextName(db, "EVT", 7),
		case: c.name,
		land: c.land,
		event_type: "Update",
		communication_method: null,
		external_organization: null,
		outcome: null,
		situation_update: null,
		status_after: null,
		description: "",
		event_time: null,
		...values,
		is_milestone: int(data.is_milestone),
		recorded_by: ME,
		recorded_on: nowStamp(),
		creation: nowStamp(),
		source_followup: data.source_followup ?? null,
		entry_status: "Active",
		corrects: data.corrects ?? null,
		superseded_by: null,
		correction_reason: data.correction_reason ?? null,
	};
	const latest = db.events
		.filter((e) => e.case === c.name && e.entry_status === "Active")
		.map((e) => e.event_date)
		.sort()
		.pop();
	db.events.push(event);
	if (!c.last_update_date || event.event_date > c.last_update_date) c.last_update_date = event.event_date;
	if (!latest || event.event_date >= latest) {
		if (event.situation_update) {
			c.current_situation = event.situation_update;
			c.situation_updated_on = nowStamp();
		}
		if (event.status_after) c.status = event.status_after;
	}
	c.modified = nowStamp();
	for (const item of data.documents ?? []) {
		const d = typeof item === "string" ? { document: item } : item;
		linkDocument(db, {
			document: d.document,
			linked_doctype: "Sijil Case Event",
			linked_name: event.name,
			document_version: d.version,
			follow_latest: d.follow_latest,
		});
	}
	return event;
}

function createFollowup(db: MockDb, data: Row): Row {
	if (!data.title?.trim()) fail("Title is required.");
	if (!data.due_date) fail("Due Date is required.");
	if (!data.case && !data.land) fail("A follow-up must belong to a case or a land / project.");
	const c = data.case ? get(db.cases, data.case, "Case") : null;
	const row: Row = {
		name: nextName(db, "FUP", 5),
		title: data.title,
		description: data.description ?? "",
		case: c?.name ?? null,
		land: c?.land ?? data.land,
		originating_event: data.originating_event ?? null,
		assigned_to: data.assigned_to || ME,
		due_date: data.due_date,
		priority: data.priority || "Medium",
		status: "Open",
		reminder_days_before: data.reminder_days_before ?? db.settings.default_reminder_days,
		completion_date: null,
		outcome: null,
		result_event: null,
		next_followup: null,
		owner: ME,
		modified: nowStamp(),
	};
	db.followups.push(row);
	refreshNextFollowup(db, row.case);
	return row;
}

const lookupTables = (db: MockDb): Record<string, [Row[], string, string[]]> => ({
	"Sijil Land": [db.lands, "land_name", ["land_code", "city"]],
	"Sijil Case": [db.cases, "title", ["reference_no"]],
	"Sijil Case Event": [db.events, "title", []],
	"Sijil External Organization": [db.organizations, "organization_name", []],
	"Sijil Case Type": [CASE_TYPES.map((n) => ({ name: n, type_name: n })), "type_name", []],
	Contact: [
		[
			{ name: "م. فهد الغامدي", full_name: "م. فهد الغامدي" },
			{ name: "أ. ريم السبيعي", full_name: "أ. ريم السبيعي" },
		],
		"full_name",
		[],
	],
	Project: [[{ name: "PROJ-0001", project_name: DEMO.konooz }], "project_name", []],
	Company: [[{ name: "شركة سجل للتطوير العقاري" }], "name", []],
});

const CASE_TYPES = [
	"Master Plan Approval",
	"Municipality Approval",
	"Organizational Sketch Approval",
	"Building Permit",
	"Land Subdivision",
	"Utility Connections",
	"Consultant Coordination",
	"Government Correspondence",
];

function breadcrumbs(db: MockDb, folder?: string | null) {
	const out: Row[] = [];
	let f = db.folders.find((x) => x.name === folder);
	while (f) {
		out.unshift({ name: f.name, folder_name: f.folder_name, is_root: f.is_root });
		f = db.folders.find((x) => x.name === f!.parent_folder);
	}
	return out;
}

function decorateDocuments(db: MockDb, rows: Row[]) {
	return rows.map((r) => ({
		...r,
		version: (() => {
			const v = db.versions.find((x) => x.name === r.current_version);
			return v ? pick(v, ["name", "version_no", "file", "file_name", "file_size", "creation"]) : null;
		})(),
		owner_name: userName(db, r.owner),
		links: db.links.filter((l) => l.document === r.name).length,
	}));
}

function reportRows(db: MockDb, key: string, f: Args) {
	const col = (fieldname: string, label: string, fieldtype = "Data", options: string | null = null, width = 130) => ({
		fieldname,
		label,
		fieldtype,
		options,
		width,
	});
	const openF = db.followups.filter(
		(x) =>
			x.status === "Open" &&
			(!f.land || x.land === f.land) &&
			(!f.assigned_to || x.assigned_to === f.assigned_to),
	);
	const fuCols = [
		col("name", "Follow-up", "Link", "Sijil Follow Up"),
		col("title", "Title", "Data", null, 240),
		col("land", "Land / Project", "Link", "Sijil Land"),
		col("case", "Case", "Link", "Sijil Case"),
		col("assigned_to", "Assigned To", "Link", "User"),
		col("due_date", "Due Date", "Date"),
	];
	const diff = (a: string, b: string) => Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86_400_000);
	switch (key) {
		case "overdue_followups":
			return [
				[...fuCols, col("days_overdue", "Days Overdue", "Int")],
				openF
					.filter((x) => x.due_date < today())
					.map((x) => ({ ...x, days_overdue: diff(today(), x.due_date) })),
			];
		case "upcoming_followups":
			return [
				[...fuCols, col("days_left", "Days Left", "Int")],
				openF.filter((x) => x.due_date >= today()).map((x) => ({ ...x, days_left: diff(x.due_date, today()) })),
			];
		case "outstanding_tasks":
			return [
				[
					col("name", "Task", "Link", "Sijil Task"),
					col("title", "Title", "Data", null, 240),
					col("land", "Land / Project", "Link", "Sijil Land"),
					col("assigned_to", "Assigned To", "Link", "User"),
					col("status", "Status"),
					col("due_date", "Due Date", "Date"),
				],
				db.tasks.filter(
					(x) =>
						OPEN_TASK.includes(x.status) &&
						(!f.land || x.land === f.land) &&
						(!f.assigned_to || x.assigned_to === f.assigned_to),
				),
			];
		case "stale_cases": {
			const days = int(f.days) || db.settings.stale_case_days;
			const before = isoDate(-days);
			return [
				[
					col("name", "Case", "Link", "Sijil Case"),
					col("title", "Case Title", "Data", null, 240),
					col("land", "Land / Project", "Link", "Sijil Land"),
					col("status", "Status"),
					col("owner_user", "Internal Owner", "Link", "User"),
					col("last_update_date", "Last Meaningful Update", "Date"),
				],
				db.cases.filter(
					(c) =>
						!CLOSED.includes(c.status) &&
						(c.last_update_date ?? "") < before &&
						(!f.land || c.land === f.land),
				),
			];
		}
		case "open_cases_by_employee": {
			const by: Record<string, Row> = {};
			for (const c of db.cases.filter((x) => !CLOSED.includes(x.status) && (!f.land || x.land === f.land))) {
				const r = (by[c.owner_user] ??= {
					owner_user: c.owner_user,
					total: 0,
					not_started: 0,
					in_progress: 0,
					awaiting_action: 0,
					on_hold: 0,
				});
				r.total++;
				r[c.status.toLowerCase().replace(/ /g, "_")]++;
			}
			return [
				[
					col("owner_user", "Internal Owner", "Link", "User", 200),
					col("total", "Open Cases", "Int"),
					col("not_started", "Not Started", "Int"),
					col("in_progress", "In Progress", "Int"),
					col("awaiting_action", "Awaiting Action", "Int"),
					col("on_hold", "On Hold", "Int"),
				],
				Object.values(by).sort((a, b) => b.total - a.total),
			];
		}
		case "case_status_by_project": {
			const by: Record<string, Row> = {};
			for (const c of db.cases.filter((x) => !f.land || x.land === f.land)) {
				const r = (by[c.land] ??= { land: c.land, total: 0, open: 0, completed: 0 });
				r.total++;
				if (c.status === "Completed") r.completed++;
				else if (!CLOSED.includes(c.status)) r.open++;
			}
			return [
				[
					col("land", "Land / Project", "Link", "Sijil Land", 200),
					col("total", "Total Cases", "Int"),
					col("open", "Open", "Int"),
					col("completed", "Completed", "Int"),
				],
				Object.values(by),
			];
		}
	}
	return fail(`Unknown report ${key}`);
}

const REPORTS: Record<string, string> = {
	overdue_followups: "Sijil Overdue Follow Ups",
	upcoming_followups: "Sijil Upcoming Follow Ups",
	open_cases_by_employee: "Sijil Open Cases by Employee",
	case_status_by_project: "Sijil Case Status by Project",
	outstanding_tasks: "Sijil Outstanding Tasks",
	stale_cases: "Sijil Stale Cases",
};

function historyHtml(db: MockDb, title: string, cases: Row[]) {
	const esc = (v: any) =>
		String(v ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);
	const body = cases
		.map((c) => {
			const events = db.events.filter((e) => e.case === c.name).sort(byAsc("event_date"));
			return `<section><h2>${esc(c.title)}</h2><p class="meta">الحالة: ${esc(c.status)} · المسؤول: ${esc(userName(db, c.owner_user))} · الجهة: ${esc(c.external_organization)}</p><div class="sit"><b>الموقف الحالي:</b> ${esc(c.current_situation)}</div><table><thead><tr><th>التاريخ</th><th>التطور</th><th>سجّله</th></tr></thead><tbody>${events
				.map(
					(e) =>
						`<tr${e.entry_status === "Superseded" ? ' class="old"' : ""}><td>${esc(e.event_date)}</td><td><b>${esc(e.title)}</b>${e.entry_status === "Superseded" ? " (مصحَّح)" : ""}<br><span>${esc(String(e.description || "").replace(/<[^>]+>/g, ""))}</span></td><td>${esc(userName(db, e.recorded_by))}</td></tr>`,
				)
				.join("")}</tbody></table></section>`;
		})
		.join("");
	return `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><style>body{font-family:Cairo,Tahoma,sans-serif;padding:32px;font-size:13px;color:#1b2942}h1{font-size:20px;margin:0 0 4px}h2{font-size:16px;margin:28px 0 6px}.meta{color:#6b7280;margin:0 0 8px}.sit{background:#eef2ff;padding:10px 12px;border-radius:8px;margin-bottom:10px}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #e5e7eb;padding:8px;text-align:start;vertical-align:top}th{background:#f8fafc;font-size:12px;color:#6b7280}td span{color:#4b5563}.old{color:#9ca3af;text-decoration:line-through}</style></head><body><h1>${esc(title)}</h1><p class="meta">تقرير تجريبي (بيانات وهمية) · ${esc(nowStamp())}</p>${body}</body></html>`;
}

export const handlers: Record<string, Handler> = {
	// ----------------------------------------------------------- meta
	"meta.bootstrap": (db) => ({
		today: today(),
		user: { name: ME, full_name: DEMO.me, is_manager: db.manager, image: null },
		lang: "ar",
		settings: { ...db.settings },
		options: {
			case_status: ["Not Started", "In Progress", "Awaiting Action", "On Hold", "Completed", "Cancelled"],
			priority: ["Low", "Medium", "High", "Urgent"],
			land_status: ["Active", "On Hold", "Completed", "Archived"],
			event_type: [
				"Update",
				"Contact",
				"Milestone",
				"Submission",
				"Approval",
				"Rejection",
				"Meeting",
				"Document Received",
				"No Progress",
				"Correspondence",
				"Other",
			],
			communication_method: [
				"Phone",
				"Email",
				"Meeting",
				"WhatsApp",
				"Official Letter",
				"Government Portal",
				"Site Visit",
				"Other",
			],
			task_status: ["Open", "In Progress", "Completed", "Cancelled"],
			document_type: [
				"Title Deed",
				"Organizational Sketch",
				"Approved Master Plan",
				"Survey",
				"Master Plan",
				"Approved Plan",
				"Government Approval",
				"Permit",
				"Official Letter",
				"Contract",
				"Consultant Document",
				"Report",
				"Other",
			],
			organization_type: [
				"Consultant",
				"Government Entity",
				"Municipality",
				"Utility Provider",
				"Contractor",
				"Legal Office",
				"Other",
			],
		},
		case_types: CASE_TYPES,
		can_create: {
			"Sijil Land": db.manager,
			"Sijil Case": true,
			"Sijil Task": true,
			"Sijil Follow Up": true,
			"Sijil Document": true,
		},
	}),
	"meta.users": (db, a) => db.users.filter((u) => like(a.search, u.full_name, u.name)),
	"meta.search": (db, a) => {
		const q = String(a.query ?? "").trim();
		if (q.length < 2) return {};
		return {
			lands: db.lands
				.filter((l) => like(q, l.land_name, l.land_code, l.city))
				.slice(0, 5)
				.map((l) => pick(l, ["name", "land_name", "land_code", "city"])),
			cases: db.cases
				.filter((c) => like(q, c.title, c.reference_no, c.name))
				.slice(0, 6)
				.map((c) => ({ ...pick(c, ["name", "title", "land", "status"]), land_name: landName(db, c.land) })),
			tasks: db.tasks
				.filter((t) => like(q, t.title))
				.slice(0, 5)
				.map((t) => pick(t, ["name", "title", "status"])),
			followups: db.followups
				.filter((f) => like(q, f.title))
				.slice(0, 5)
				.map((f) => pick(f, ["name", "title", "due_date", "status"])),
			documents: db.documents
				.filter((d) => like(q, d.title, d.reference_no))
				.slice(0, 5)
				.map((d) => pick(d, ["name", "title", "land", "folder"])),
		};
	},
	"meta.lookup": (db, a) => {
		const entry = lookupTables(db)[a.doctype];
		if (!entry) return fail(`Lookup is not available for ${a.doctype}`);
		const [rows, title, extra] = entry;
		const filters = parse(a.filters, {}) ?? {};
		return rows
			.filter((r) => Object.entries(filters).every(([k, v]) => r[k] === v))
			.filter((r) => like(a.txt, r[title], r.name, ...extra.map((e) => r[e])))
			.slice(0, 12)
			.map((r) => ({ value: r.name, label: r[title] || r.name }));
	},
	"meta.label_for": (db, a) => {
		const entry = lookupTables(db)[a.doctype];
		if (!entry || !a.name) return null;
		return entry[0].find((r) => r.name === a.name)?.[entry[1]] ?? null;
	},

	// ----------------------------------------------------------- dashboard
	"dashboard.get_dashboard": (db) => {
		const t = today();
		const staleBefore = isoDate(-db.settings.stale_case_days);
		const open = db.cases.filter((c) => !CLOSED.includes(c.status));
		const openF = db.followups.filter((f) => f.status === "Open");
		const openT = db.tasks.filter((x) => OPEN_TASK.includes(x.status));
		const stale = open.filter((c) => (c.last_update_date ?? "") < staleBefore);
		return {
			today: t,
			stale_days: db.settings.stale_case_days,
			counts: {
				active_lands: db.lands.filter((l) => l.status === "Active").length,
				open_cases: open.length,
				awaiting_action: db.cases.filter((c) => c.status === "Awaiting Action").length,
				overdue_followups: openF.filter((f) => f.due_date < t).length,
				due_today_followups: openF.filter((f) => f.due_date === t).length,
				upcoming_followups: openF.filter((f) => f.due_date > t && f.due_date <= isoDate(7)).length,
				open_tasks: openT.length,
				overdue_tasks: openT.filter((x) => x.due_date && x.due_date < t).length,
				stale_cases: stale.length,
			},
			attention_followups: openF
				.filter((f) => f.due_date <= t)
				.sort(byAsc("due_date"))
				.slice(0, 8)
				.map((f) => decorateFollowup(db, f)),
			upcoming_followups: openF
				.filter((f) => f.due_date > t)
				.sort(byAsc("due_date"))
				.slice(0, 6)
				.map((f) => decorateFollowup(db, f)),
			recent_events: db.events
				.filter((e) => e.entry_status === "Active")
				.sort((x, y) => byDesc("event_date")(x, y) || byDesc("creation")(x, y))
				.slice(0, 8)
				.map((e) => ({
					...pick(e, [
						"name",
						"title",
						"case",
						"land",
						"event_date",
						"event_type",
						"recorded_by",
						"is_milestone",
					]),
					case_title: caseTitle(db, e.case),
					land_name: landName(db, e.land),
					recorded_by_name: userName(db, e.recorded_by),
				})),
			recent_documents: [...db.documents]
				.sort(byDesc("modified"))
				.slice(0, 6)
				.map((d) => ({
					...pick(d, ["name", "title", "land", "document_type", "creation", "version_count"]),
					land_name: landName(db, d.land),
				})),
			stale_cases: stale
				.sort(byAsc("last_update_date"))
				.slice(0, 6)
				.map((c) => ({
					...pick(c, ["name", "title", "land", "owner_user", "last_update_date", "status"]),
					land_name: landName(db, c.land),
					owner_name: userName(db, c.owner_user),
				})),
		};
	},

	// ----------------------------------------------------------- lands
	"lands.list_lands": (db, a) => {
		const [start, len] = paging(a, 24);
		const rows = db.lands
			.filter((l) => (!a.status || l.status === a.status) && like(a.search, l.land_name, l.land_code, l.city))
			.sort(byAsc("land_name"))
			.map((l) => ({
				...pick(l, ["name", "land_name", "land_code", "status", "city", "company", "project", "modified"]),
				open_cases: db.cases.filter((c) => c.land === l.name && !CLOSED.includes(c.status)).length,
				total_cases: db.cases.filter((c) => c.land === l.name).length,
				open_followups: db.followups.filter((f) => f.land === l.name && f.status === "Open").length,
				overdue_followups: db.followups.filter(
					(f) => f.land === l.name && f.status === "Open" && f.due_date < today(),
				).length,
				documents: db.documents.filter((d) => d.land === l.name).length,
				key_documents: KEY_TYPES.filter((ty) =>
					db.documents.some((d) => d.land === l.name && d.document_type === ty && !d.archived),
				),
			}));
		return page(rows, start, len);
	},
	"lands.get_land": (db, a) => {
		const l = get(db.lands, a.name, "Land");
		const open = db.cases.filter((c) => c.land === l.name && !CLOSED.includes(c.status));
		return {
			...l,
			responsibles: l.responsibles.map((r: Row) => ({ ...r, full_name: userName(db, r.user) })),
			organizations: l.organizations.map((r: Row) => ({
				...r,
				organization_type: db.organizations.find((o) => o.name === r.organization)?.organization_type,
			})),
			stats: {
				cases_total: db.cases.filter((c) => c.land === l.name).length,
				cases_open: open.length,
				cases_stale: open.filter((c) => (c.last_update_date ?? "") < isoDate(-db.settings.stale_case_days))
					.length,
				followups_open: db.followups.filter((f) => f.land === l.name && f.status === "Open").length,
				followups_overdue: db.followups.filter(
					(f) => f.land === l.name && f.status === "Open" && f.due_date < today(),
				).length,
				tasks_open: db.tasks.filter((x) => x.land === l.name && OPEN_TASK.includes(x.status)).length,
				documents: db.documents.filter((d) => d.land === l.name).length,
				events: db.events.filter((e) => e.land === l.name && e.entry_status === "Active").length,
			},
			key_documents: KEY_TYPES.map((ty) => {
				const d = db.documents
					.filter((x) => x.land === l.name && x.document_type === ty && !x.archived)
					.sort(byDesc("modified"))[0];
				return {
					document_type: ty,
					document: d ? pick(d, ["name", "title", "document_date", "reference_no", "version_count"]) : null,
				};
			}),
			can_write: db.manager,
		};
	},
	"lands.land_activity": (db, a) => {
		const [start, len] = paging(a, 15);
		const rows = db.events
			.filter((e) => e.land === a.land && e.entry_status === "Active")
			.sort((x, y) => byDesc("event_date")(x, y) || byDesc("creation")(x, y))
			.map((e) => ({
				...pick(e, ["name", "title", "case", "event_date", "event_type", "recorded_by", "is_milestone"]),
				case_title: caseTitle(db, e.case),
				recorded_by_name: userName(db, e.recorded_by),
			}));
		return page(rows, start, len);
	},
	"lands.save_land": (db, a) => {
		if (!db.manager) fail("Not permitted", 403, "PermissionError");
		const data = parse(a.data, {});
		if (!data.land_name?.trim()) fail("Land / Project Name is required.");
		let land: Row;
		if (data.name) land = get(db.lands, data.name, "Land");
		else {
			land = {
				name: nextName(db, "LAND", 5),
				status: "Active",
				responsibles: [],
				organizations: [],
				owner: ME,
				project: null,
			};
			db.lands.push(land);
			createLandFolders(db, { ...land, land_name: data.land_name });
			land.root_folder = db.folders.find((f) => f.land === land.name && f.is_root)?.name;
		}
		for (const f of [
			"land_name",
			"land_code",
			"status",
			"city",
			"company",
			"location",
			"description",
			"notes",
			"project",
		])
			if (f in data) land[f] = data[f] || null;
		if (data.responsibles) land.responsibles = data.responsibles.filter((r: Row) => r.user);
		if (data.organizations) land.organizations = data.organizations.filter((r: Row) => r.organization);
		if (int(data.create_project) && !land.project)
			land.project = `PROJ-${String(db.lands.length).padStart(4, "0")}`;
		land.modified = nowStamp();
		return { name: land.name };
	},
	"lands.create_project": (db, a) => {
		const land = get(db.lands, a.land, "Land");
		land.project ||= `PROJ-${land.name.slice(-4)}`;
		return { project: land.project };
	},

	// ----------------------------------------------------------- cases
	"cases.list_cases": (db, a) => {
		const [start, len] = paging(a);
		const scope = a.scope || (a.status === "open" || a.status === "closed" ? a.status : null);
		const staleBefore = isoDate(-db.settings.stale_case_days);
		const orders: Record<string, (x: Row, y: Row) => number> = {
			updated: byDesc("last_update_date"),
			stale: byAsc("last_update_date"),
			followup: byAsc("next_followup_date"),
			title: byAsc("title"),
		};
		const rows = db.cases
			.filter(
				(c) =>
					(!a.land || c.land === a.land) &&
					(!a.status || ["open", "closed"].includes(a.status) || c.status === a.status) &&
					(scope !== "open" || !CLOSED.includes(c.status)) &&
					(scope !== "closed" || CLOSED.includes(c.status)) &&
					(!a.priority || c.priority === a.priority) &&
					(int(a.mine) ? c.owner_user === ME : !a.owner || c.owner_user === a.owner) &&
					(!int(a.stale) || (!CLOSED.includes(c.status) && (c.last_update_date ?? "") < staleBefore)) &&
					like(a.search, c.title, c.reference_no, c.name),
			)
			.sort(orders[a.order] ?? orders.updated)
			.map((c) => ({
				...pick(c, [
					"name",
					"title",
					"reference_no",
					"land",
					"case_type",
					"status",
					"priority",
					"owner_user",
					"current_situation",
					"external_organization",
					"last_update_date",
					"next_followup_date",
					"start_date",
					"target_date",
					"modified",
				]),
				land_name: landName(db, c.land),
				owner_name: userName(db, c.owner_user),
			}));
		return page(rows, start, len);
	},
	"cases.get_case": (db, a) => {
		const c = get(db.cases, a.name, "Case");
		const tasks = db.tasks
			.filter((x) => x.case === c.name && OPEN_TASK.includes(x.status))
			.sort(byAsc("due_date"))
			.map((x) => ({
				...pick(x, ["name", "title", "status", "priority", "due_date", "assigned_to"]),
				assigned_to_name: userName(db, x.assigned_to),
			}));
		const active = db.events.filter((e) => e.case === c.name && e.entry_status === "Active");
		const last = [...active].sort((x, y) => byDesc("event_date")(x, y) || byDesc("creation")(x, y))[0];
		return {
			...c,
			land_name: landName(db, c.land),
			owner_name: userName(db, c.owner_user),
			external_organization_name: c.external_organization,
			external_contact_name: c.external_contact,
			relations: c.relations.map((r: Row) => ({
				...r,
				title: caseTitle(db, r.related_case),
				status: db.cases.find((x) => x.name === r.related_case)?.status,
			})),
			open_followups: db.followups
				.filter((f) => f.case === c.name && f.status === "Open")
				.sort(byAsc("due_date"))
				.map((f) => decorateFollowup(db, f, ["description"])),
			tasks,
			documents: linksFor(db, "Sijil Case", c.name),
			stats: {
				events: active.length,
				followups_total: db.followups.filter((f) => f.case === c.name).length,
				followups_done: db.followups.filter((f) => f.case === c.name && f.status === "Completed").length,
				tasks_open: tasks.length,
				documents: db.links.filter(
					(l) =>
						l.linked_doctype === "Sijil Case Event" &&
						db.events.some((e) => e.name === l.linked_name && e.case === c.name),
				).length,
			},
			last_event: last ? pick(last, ["name", "title", "event_date", "recorded_by"]) : null,
			can_write: true,
		};
	},
	"cases.list_events": (db, a) => {
		const [start, len] = paging(a, 15);
		const rows = db.events
			.filter((e) => e.case === a.case && (int(a.include_superseded ?? 1) || e.entry_status === "Active"))
			.sort((x, y) => byDesc("event_date")(x, y) || byDesc("creation")(x, y))
			.map((e) => ({
				...e,
				recorded_by_name: userName(db, e.recorded_by),
				documents: linksFor(db, "Sijil Case Event", e.name),
			}));
		return page(rows, start, len);
	},
	"cases.save_case": (db, a) => {
		const data = parse(a.data, {});
		let c: Row;
		if (data.name) {
			c = get(db.cases, data.name, "Case");
			if (data.land && data.land !== c.land) fail("A case cannot be moved to another land.");
		} else {
			if (!data.title?.trim()) fail("Title is required.");
			if (!data.land) fail("Land / Project is required.");
			if (db.lands.find((l) => l.name === data.land)?.status === "Archived")
				fail("Cannot add a case to an archived land.");
			c = {
				name: nextName(db, "CASE", 5),
				status: "Not Started",
				priority: "Medium",
				relations: [],
				owner: ME,
				last_update_date: null,
				next_followup_date: null,
				project: null,
				situation_updated_on: null,
			};
			db.cases.push(c);
		}
		for (const f of [
			"title",
			"reference_no",
			"land",
			"case_type",
			"status",
			"priority",
			"owner_user",
			"external_organization",
			"external_contact",
			"start_date",
			"target_date",
			"description",
			"current_situation",
		])
			if (f in data) c[f] = data[f] || null;
		if (data.start_date && data.target_date && data.target_date < data.start_date)
			fail("Target Date cannot be before Start Date.");
		c.owner_user ||= ME;
		c.status ||= "Not Started";
		c.priority ||= "Medium";
		if ("relations" in data)
			c.relations = (data.relations ?? [])
				.filter((r: Row) => r.related_case)
				.map((r: Row) => ({ related_case: r.related_case, relation_type: r.relation_type || "Related" }));
		c.modified = nowStamp();
		return { name: c.name };
	},
	"cases.record_event": (db, a) => ({ name: addEvent(db, parse(a.data, {})).name }),
	"cases.correct_event": (db, a) => {
		const reason = String(a.reason ?? "").trim();
		if (!reason) fail("A reason is required to correct a recorded event.");
		const old = get(db.events, a.name, "Event");
		if (old.entry_status === "Superseded") fail("This event has already been corrected.");
		const data = parse(a.data, {});
		const merged = {
			...Object.fromEntries(EVENT_FIELDS.map((f) => [f, old[f]])),
			situation_update: null,
			status_after: null,
			...data,
		};
		const created = addEvent(db, {
			...merged,
			case: old.case,
			corrects: old.name,
			correction_reason: reason,
			source_followup: old.source_followup,
		});
		old.entry_status = "Superseded";
		old.superseded_by = created.name;
		for (const l of db.links.filter((x) => x.linked_doctype === "Sijil Case Event" && x.linked_name === old.name))
			link(
				db,
				db.documents.find((d) => d.name === l.document)!,
				"Sijil Case Event",
				created.name,
				l.document_version,
				l.follow_latest,
			);
		return { name: created.name };
	},
	"cases.update_situation": (db, a) => ({
		name: addEvent(db, {
			case: a.case,
			title: a.title || "تحديث الموقف الحالي",
			description: a.situation,
			event_type: "Update",
			event_date: today(),
			situation_update: a.situation,
			status_after: a.status,
		}).name,
	}),

	// ----------------------------------------------------------- follow-ups
	"followups.list_followups": (db, a) => {
		const [start, len] = paging(a);
		const t = today();
		const scope = a.scope || "open";
		const inScope = (f: Row) =>
			({
				open: f.status === "Open",
				overdue: f.status === "Open" && f.due_date < t,
				today: f.status === "Open" && f.due_date === t,
				upcoming: f.status === "Open" && f.due_date > t,
				week: f.status === "Open" && f.due_date >= t && f.due_date <= isoDate(7),
				completed: f.status === "Completed",
				cancelled: f.status === "Cancelled",
				all: true,
			})[scope as string] ?? f.status === "Open";
		const rows = db.followups
			.filter(
				(f) =>
					inScope(f) &&
					(!a.case || f.case === a.case) &&
					(!a.land || f.land === a.land) &&
					(int(a.mine) ? f.assigned_to === ME : !a.assigned_to || f.assigned_to === a.assigned_to) &&
					like(a.search, f.title),
			)
			.sort(
				["completed", "cancelled"].includes(scope)
					? (x, y) => byDesc("completion_date")(x, y) || byDesc("modified")(x, y)
					: byAsc("due_date"),
			)
			.map((f) => decorateFollowup(db, f, ["description", "outcome", "result_event", "next_followup"]));
		return page(rows, start, len);
	},
	"followups.followup_counts": (db, a) => {
		const t = today();
		const mine = (f: Row) => !int(a.mine) || f.assigned_to === ME;
		const open = db.followups.filter((f) => f.status === "Open" && mine(f));
		return {
			open: open.length,
			overdue: open.filter((f) => f.due_date < t).length,
			today: open.filter((f) => f.due_date === t).length,
			upcoming: open.filter((f) => f.due_date > t).length,
			completed: db.followups.filter((f) => f.status === "Completed" && mine(f)).length,
		};
	},
	"followups.save_followup": (db, a) => {
		const data = parse(a.data, {});
		if (data.name) {
			const f = get(db.followups, data.name, "Follow-up");
			if (f.status !== "Open") fail("A completed follow-up cannot be changed.");
			for (const k of ["title", "description", "due_date", "assigned_to", "priority"])
				if (k in data) f[k] = data[k];
			refreshNextFollowup(db, f.case);
			return { name: f.name };
		}
		return { name: createFollowup(db, data).name };
	},
	"followups.complete": (db, a) => {
		const outcome = String(a.outcome ?? "").trim();
		if (!outcome) fail("Please describe the actual outcome of this follow-up.");
		const f = get(db.followups, a.name, "Follow-up");
		if (f.status !== "Open") fail(`This follow-up is already ${f.status}.`);
		let event: Row | null = null;
		if (f.case) {
			const e = parse(a.event, {}) ?? {};
			event = addEvent(db, {
				title: `نتيجة المتابعة: ${f.title}`,
				description: outcome,
				event_date: today(),
				event_type: "Contact",
				...e,
				outcome,
				case: f.case,
				source_followup: f.name,
				documents: parse(a.documents, []),
			});
		}
		const n = parse(a.next_followup, null);
		let nextRow: Row | null = null;
		if (n?.due_date)
			nextRow = createFollowup(db, {
				title: n.title || f.title,
				description: n.description,
				case: f.case,
				land: f.land,
				assigned_to: n.assigned_to || f.assigned_to,
				due_date: n.due_date,
				priority: n.priority || f.priority,
				originating_event: event?.name ?? f.originating_event,
			});
		Object.assign(f, {
			status: "Completed",
			completion_date: today(),
			outcome,
			result_event: event?.name ?? null,
			next_followup: nextRow?.name ?? null,
			modified: nowStamp(),
		});
		refreshNextFollowup(db, f.case);
		return { followup: f.name, event: event?.name ?? null, next_followup: nextRow?.name ?? null };
	},
	"followups.cancel": (db, a) => {
		const f = get(db.followups, a.name, "Follow-up");
		if (f.status !== "Open") fail(`This follow-up is already ${f.status}.`);
		Object.assign(f, { status: "Cancelled", outcome: a.reason || f.outcome, modified: nowStamp() });
		refreshNextFollowup(db, f.case);
		return { name: f.name };
	},
	"followups.reschedule": (db, a) => {
		const f = get(db.followups, a.name, "Follow-up");
		if (f.status !== "Open") fail("Only open follow-ups can be rescheduled.");
		f.due_date = a.due_date;
		if (a.assigned_to) f.assigned_to = a.assigned_to;
		refreshNextFollowup(db, f.case);
		return { name: f.name };
	},

	// ----------------------------------------------------------- tasks
	"tasks.list_tasks": (db, a) => {
		const [start, len] = paging(a);
		const t = today();
		const scope = a.scope || "open";
		const inScope = (x: Row) =>
			({
				open: OPEN_TASK.includes(x.status),
				overdue: OPEN_TASK.includes(x.status) && x.due_date && x.due_date < t,
				completed: x.status === "Completed",
				cancelled: x.status === "Cancelled",
				all: true,
			})[scope as string] ?? OPEN_TASK.includes(x.status);
		const rows = db.tasks
			.filter(
				(x) =>
					inScope(x) &&
					(!a.land || x.land === a.land) &&
					(!a.case || x.case === a.case) &&
					(int(a.mine) ? x.assigned_to === ME : !a.assigned_to || x.assigned_to === a.assigned_to) &&
					like(a.search, x.title),
			)
			.sort(["open", "overdue"].includes(scope) ? byAsc("due_date") : byDesc("modified"))
			.map((x) => ({
				...pick(x, [
					"name",
					"title",
					"status",
					"priority",
					"assigned_to",
					"land",
					"case",
					"due_date",
					"start_date",
					"completed_on",
					"erpnext_task",
					"project",
				]),
				land_name: landName(db, x.land),
				case_title: caseTitle(db, x.case),
				assigned_to_name: userName(db, x.assigned_to),
				overdue: Boolean(x.due_date && x.due_date < t && OPEN_TASK.includes(x.status)),
			}));
		return page(rows, start, len);
	},
	"tasks.task_counts": (db, a) => {
		const mine = (x: Row) => !int(a.mine) || x.assigned_to === ME;
		const open = db.tasks.filter((x) => OPEN_TASK.includes(x.status) && mine(x));
		return {
			open: open.length,
			overdue: open.filter((x) => x.due_date && x.due_date < today()).length,
			completed: db.tasks.filter((x) => x.status === "Completed" && mine(x)).length,
		};
	},
	"tasks.get_task": (db, a) => {
		const x = get(db.tasks, a.name, "Task");
		return {
			...x,
			land_name: landName(db, x.land),
			case_title: caseTitle(db, x.case),
			assigned_to_name: userName(db, x.assigned_to),
			updates: x.updates.map((u: Row) => ({ ...u, user_name: userName(db, u.user) })),
			documents: linksFor(db, "Sijil Task", x.name),
			can_write: true,
		};
	},
	"tasks.save_task": (db, a) => {
		const data = parse(a.data, {});
		let x: Row;
		if (data.name) x = get(db.tasks, data.name, "Task");
		else {
			if (!data.title?.trim()) fail("Title is required.");
			x = {
				name: nextName(db, "STK", 5),
				status: "Open",
				priority: "Medium",
				updates: [],
				owner: ME,
				completed_on: null,
				erpnext_task: null,
				project: null,
			};
			db.tasks.push(x);
		}
		for (const f of [
			"title",
			"description",
			"land",
			"case",
			"case_event",
			"status",
			"priority",
			"assigned_to",
			"start_date",
			"due_date",
			"completion_notes",
		])
			if (f in data) x[f] = data[f] || null;
		if (x.case) {
			const c = get(db.cases, x.case, "Case");
			if (x.land && x.land !== c.land) fail("The case does not belong to the selected land.");
			x.land = c.land;
		}
		if (x.start_date && x.due_date && x.due_date < x.start_date) fail("Due Date cannot be before Start Date.");
		x.assigned_to ||= ME;
		x.status ||= "Open";
		x.completed_on = x.status === "Completed" ? x.completed_on || today() : null;
		x.modified = nowStamp();
		return { name: x.name };
	},
	"tasks.set_status": (db, a) => {
		const x = get(db.tasks, a.name, "Task");
		if (x.status !== a.status)
			x.updates.push({ update_on: nowStamp(), user: ME, note: `Status changed from ${x.status} to ${a.status}` });
		x.status = a.status;
		if (a.completion_notes) x.completion_notes = a.completion_notes;
		x.completed_on = x.status === "Completed" ? today() : null;
		x.modified = nowStamp();
		return { name: x.name, status: x.status };
	},
	"tasks.add_update": (db, a) => {
		const note = String(a.note ?? "").trim();
		if (!note) fail("Please write a note.");
		const x = get(db.tasks, a.name, "Task");
		x.updates.push({ update_on: nowStamp(), user: ME, note });
		x.modified = nowStamp();
		return { name: x.name };
	},

	// ----------------------------------------------------------- documents
	"documents.library": (db, a) => {
		const land = get(db.lands, a.land, "Land");
		const [start, len] = paging(a, 24);
		const folder = a.folder || land.root_folder;
		const all = db.folders.filter((f) => f.land === land.name).sort(byAsc("folder_name"));
		if (folder && !all.some((f) => f.name === folder))
			fail("This folder does not belong to the selected land.", 403, "PermissionError");
		const tree: Row[] = all.map((f) => ({
			...pick(f, ["name", "folder_name", "parent_folder", "is_root", "folder_path"]),
			document_count: db.documents.filter((d) => d.folder === f.name).length,
			child_count: all.filter((x) => x.parent_folder === f.name).length,
		}));
		const searching = Boolean(a.search || a.document_type || int(a.recursive));
		const current = all.find((f) => f.name === folder);
		const subtree = new Set(
			all
				.filter((f) => f.name === folder || (current && f.folder_path.includes(`/${folder}/`)))
				.map((f) => f.name),
		);
		const docs = db.documents
			.filter(
				(d) =>
					d.land === land.name &&
					(!a.document_type || d.document_type === a.document_type) &&
					like(a.search, d.title, d.reference_no, d.description),
			)
			.filter((d) => (!searching ? d.folder === folder : !int(a.recursive) || subtree.has(d.folder)))
			.sort(byAsc("title"))
			.map((d) => ({ ...d, folder_name: all.find((f) => f.name === d.folder)?.folder_name }));
		const p = page(docs, start, len);
		return {
			root: land.root_folder,
			folder,
			breadcrumbs: breadcrumbs(db, folder),
			tree,
			children: tree.filter((f) => f.parent_folder === folder),
			documents: { ...p, rows: decorateDocuments(db, p.rows) },
			searching,
		};
	},
	"documents.get_document": (db, a) => {
		const d = get(db.documents, a.name, "Document");
		const titles: Record<string, [Row[], string]> = {
			"Sijil Land": [db.lands, "land_name"],
			"Sijil Case": [db.cases, "title"],
			"Sijil Case Event": [db.events, "title"],
			"Sijil Task": [db.tasks, "title"],
			"Sijil Follow Up": [db.followups, "title"],
		};
		return {
			...d,
			land_name: landName(db, d.land),
			breadcrumbs: breadcrumbs(db, d.folder),
			versions: db.versions
				.filter((v) => v.document === d.name)
				.sort((x, y) => y.version_no - x.version_no)
				.map((v) => ({ ...v, uploaded_by_name: userName(db, v.uploaded_by) })),
			links: db.links
				.filter((l) => l.document === d.name)
				.map((l) => {
					const [rows, field] = titles[l.linked_doctype]!;
					return {
						...pick(l, [
							"name",
							"linked_doctype",
							"linked_name",
							"document_version",
							"follow_latest",
							"linked_by",
							"creation",
						]),
						title: rows.find((r) => r.name === l.linked_name)?.[field],
						version_no: db.versions.find((v) => v.name === l.document_version)?.version_no,
					};
				}),
			can_write: true,
		};
	},
	"documents.update_document": (db, a) => {
		const d = get(db.documents, a.name, "Document");
		const data = parse(a.data, {});
		if (data.folder && db.folders.find((f) => f.name === data.folder)?.land !== d.land)
			fail("The selected folder belongs to a different land.");
		for (const f of [
			"title",
			"document_type",
			"reference_no",
			"document_date",
			"description",
			"is_confidential",
			"archived",
			"folder",
		])
			if (f in data) d[f] = data[f] === "" ? null : data[f];
		d.modified = nowStamp();
		return { name: d.name };
	},
	"documents.create_folder": (db, a) => {
		const land = get(db.lands, a.land, "Land");
		const name = String(a.folder_name ?? "").trim();
		if (!name) fail("Folder Name is required.");
		if (name.includes("/")) fail("A folder name cannot contain slashes.");
		const parent = get(db.folders, a.parent || land.root_folder, "Folder");
		if (db.folders.some((f) => f.parent_folder === parent.name && f.folder_name === name))
			fail(`A folder named ${name} already exists here.`);
		const f: Row = {
			name: nextName(db, "FLD", 7),
			folder_name: name,
			land: land.name,
			parent_folder: parent.name,
			is_root: 0,
		};
		f.folder_path = `${parent.folder_path}${f.name}/`;
		db.folders.push(f);
		return { name: f.name };
	},
	"documents.rename_folder": (db, a) => {
		const f = get(db.folders, a.name, "Folder");
		if (f.is_root) fail("The root folder takes the name of the land.");
		f.folder_name = a.folder_name;
		return { name: f.name };
	},
	"documents.move_folder": (db, a) => {
		const f = get(db.folders, a.name, "Folder");
		if (f.is_root) fail("The root folder cannot be moved.");
		const parent = get(db.folders, a.parent, "Folder");
		if (parent.folder_path.includes(`/${f.name}/`))
			fail("A folder cannot be moved into itself or one of its subfolders.");
		const old = f.folder_path;
		f.parent_folder = parent.name;
		f.folder_path = `${parent.folder_path}${f.name}/`;
		for (const x of db.folders)
			if (x !== f && x.folder_path.startsWith(old))
				x.folder_path = f.folder_path + x.folder_path.slice(old.length);
		return { name: f.name };
	},
	"documents.delete_folder": (db, a) => {
		const f = get(db.folders, a.name, "Folder");
		if (f.is_root) fail("The root folder of a land cannot be deleted.");
		if (db.folders.some((x) => x.parent_folder === f.name))
			fail("This folder contains subfolders. Move or delete them first.");
		if (db.documents.some((d) => d.folder === f.name)) fail("This folder contains documents. Move them first.");
		db.folders.splice(db.folders.indexOf(f), 1);
		return { name: a.name };
	},
	"documents.move_document": (db, a) =>
		handlers["documents.update_document"]!(db, { name: a.name, data: { folder: a.folder } }),
	"documents.link_document": (db, a) => ({ name: linkDocument(db, a) }),
	"documents.unlink_document": (db, a) => {
		const l = get(db.links, a.link, "Link");
		if (l.linked_doctype === "Sijil Case Event" && !db.manager)
			fail("Documents linked to a recorded event can only be unlinked by a manager.", 403, "PermissionError");
		db.links.splice(db.links.indexOf(l), 1);
		return { name: a.link };
	},
	"documents.linked_documents": (db, a) => linksFor(db, a.linked_doctype, a.linked_name),
	"documents.search_documents": (db, a) =>
		db.documents
			.filter((d) => d.land === a.land && !d.archived && like(a.query, d.title, d.reference_no))
			.sort(byDesc("modified"))
			.slice(0, Math.min(int(a.limit) || 20, 50))
			.map((d) => pick(d, ["name", "title", "document_type", "version_count", "current_version"])),

	// ----------------------------------------------------------- reports
	"reports.available": () => Object.entries(REPORTS).map(([key, name]) => ({ key, name })),
	"reports.run": (db, a) => {
		const [columns, rows] = reportRows(db, a.report, parse(a.filters, {}) ?? {}) as [Row[], Row[]];
		return { key: a.report, name: REPORTS[a.report], columns, rows };
	},
	"reports.case_history": (db, a) => {
		const c = get(db.cases, a.case, "Case");
		const title = `تقرير سجل المعاملة - ${c.title}`;
		return { title, html: historyHtml(db, title, [c]) };
	},
	"reports.land_history": (db, a) => {
		const l = get(db.lands, a.land, "Land");
		const title = `تقرير سجل الأرض / المشروع - ${l.land_name}`;
		return {
			title,
			html: historyHtml(
				db,
				title,
				db.cases.filter((c) => c.land === l.name),
			),
		};
	},

	// ----------------------------------------------------------- integrations / settings
	"integrations.get_integrations": (db) => integrationStatus(db),
	"integrations.set_integration": (db, a) => {
		if (!db.manager) fail("Only managers can change integration settings.", 403, "PermissionError");
		db.settings[a.flag] = String(a.value) === "1" || String(a.value) === "true" ? 1 : 0;
		return integrationStatus(db);
	},
	"integrations.link_pending_tasks": (db) => {
		if (!db.manager) fail("Only managers can run this.", 403, "PermissionError");
		return { synced: 0 };
	},
};

function integrationStatus(db: MockDb) {
	// Same shape as sijil.integrations.erpnext.integration_status(): a list of items.
	const item = (
		key: string,
		flag: string | null,
		doctype: string,
		icon: string,
		stats: Row = {},
		enabled?: boolean,
	) => ({
		key,
		flag,
		doctype,
		icon,
		enabled: enabled ?? Boolean(flag && db.settings[flag]),
		stats,
	});
	return [
		item("project", "enable_project_integration", "Project", "project", {
			linked_lands: db.lands.filter((l) => l.project).length,
			total_lands: db.lands.length,
		}),
		item("auto_project", "auto_create_project", "Project", "project"),
		item("task", "enable_task_sync", "Task", "task", {
			synced_tasks: db.tasks.filter((x) => x.erpnext_task).length,
			total_tasks: db.tasks.length,
		}),
		item("todo", "enable_todo", "ToDo", "todo", { open_todos: 0 }),
		item("calendar", "enable_calendar", "Event", "calendar", { events: 0 }),
		item("notifications", "enable_notifications", "Notification Log", "bell", { unread: 0 }),
		item("email", "enable_email_reminders", "Email Queue", "mail"),
		item(
			"parties",
			null,
			"Supplier",
			"users",
			{ organizations: db.organizations.length, with_supplier: 0, with_customer: 0, with_contact: 0 },
			true,
		),
		item("files", null, "File", "file", { versions: db.versions.length, documents: db.documents.length }, true),
		item("employees", null, "Employee", "user", { hrms: 0 }, true),
		item("company", null, "Company", "building", { default_company: db.settings.default_company }, true),
	];
}

export function uploadHandler(db: MockDb, method: string, form: FormData) {
	const file = form.get("file");
	if (!(file instanceof File) || !file.size) fail("No file was uploaded.");
	const f = file as File;
	if (method === "documents.upload_version") {
		const doc = get(db.documents, String(form.get("document")), "Document");
		return { version: addVersion(db, doc, f.name, f.size, (form.get("notes") as string) || null).name };
	}
	if (method === "documents.upload_document") {
		const land = get(db.lands, String(form.get("land")), "Land");
		const v = (k: string) => (form.get(k) as string | null) || null;
		const doc: Row = {
			name: nextName(db, "DOC", 7),
			title: (v("title") || f.name).trim(),
			land: land.name,
			folder: v("folder") || land.root_folder,
			document_type: v("document_type"),
			reference_no: v("reference_no"),
			document_date: v("document_date"),
			description: v("description"),
			is_confidential: int(v("is_confidential")),
			archived: 0,
			current_version: null,
			version_count: 0,
			owner: ME,
			creation: nowStamp(),
			modified: nowStamp(),
		};
		db.documents.push(doc);
		const version = addVersion(db, doc, f.name, f.size, v("notes"));
		if (v("link_doctype") && v("link_name"))
			linkDocument(db, { document: doc.name, linked_doctype: v("link_doctype"), linked_name: v("link_name") });
		return { document: doc.name, version: version.name };
	}
	return fail(`Unknown upload method ${method}`);
}
