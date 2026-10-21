// Core helpers: state, API access, formatting, icons. No DOM rendering of screens here.

export const state = {
	boot: null,
	users: null,
};

// ------------------------------------------------------------------ API
export function call(method, args = {}) {
	return frappe.xcall("sijil.api." + method, args);
}

export async function upload(method, form) {
	const res = await fetch("/api/method/sijil.api." + method, {
		method: "POST",
		headers: { "X-Frappe-CSRF-Token": frappe.csrf_token, Accept: "application/json" },
		body: form,
		credentials: "same-origin",
	});
	let body = {};
	try {
		body = await res.json();
	} catch (e) {
		/* non-JSON error page */
	}
	if (!res.ok) {
		let message = __("Upload failed");
		try {
			const msgs = JSON.parse(body._server_messages || "[]");
			if (msgs.length) message = JSON.parse(msgs[0]).message || message;
		} catch (e) {
			/* keep default */
		}
		throw new Error(message.replace(/<[^>]+>/g, ""));
	}
	return body.message;
}

export async function boot() {
	if (!state.boot) state.boot = await call("meta.bootstrap");
	return state.boot;
}

export async function users() {
	if (!state.users) state.users = await call("meta.users");
	return state.users;
}

// ------------------------------------------------------------------ text
const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ESC[c]);

/** Plain text of stored descriptions (they may contain HTML from the Desk editor). */
export function plain(s) {
	if (!s) return "";
	if (!/<[a-z][\s\S]*>/i.test(s)) return s;
	const text = s.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li)>/gi, "\n");
	return (new DOMParser().parseFromString(text, "text/html").body.textContent || "").trim();
}

/** Plain textarea text -> HTML stored in Text Editor fields (escaped, line breaks kept). */
export const toHtml = (s) => esc(s || "").replace(/\n/g, "<br>");

export const isRtl = () => document.documentElement.dir === "rtl" || frappe.utils.is_rtl?.();
export const locale = () => {
	const lang = (frappe.boot && frappe.boot.lang) || state.boot?.lang || "en";
	return lang.startsWith("ar") ? "ar-SA-u-ca-gregory-nu-latn" : lang;
};

function parseDate(s) {
	if (!s) return null;
	if (s instanceof Date) return s;
	const str = String(s);
	return new Date(str.length <= 10 ? str + "T12:00:00" : str.replace(" ", "T"));
}

export function fmtDate(s) {
	const d = parseDate(s);
	if (!d || isNaN(d)) return "—";
	return d.toLocaleDateString(locale(), { day: "numeric", month: "long", year: "numeric" });
}

export function fmtDateTime(s) {
	const d = parseDate(s);
	if (!d || isNaN(d)) return "—";
	return d.toLocaleString(locale(), { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function daysBetween(from, to) {
	const a = parseDate(from), b = parseDate(to);
	return Math.round((b - a) / 86400000);
}

export function relativeDue(due) {
	const today = state.boot?.today || frappe.datetime.get_today();
	const d = daysBetween(today, due);
	if (d === 0) return __("Due Today");
	if (d < 0) return __("Overdue") + " · " + Math.abs(d) + " " + __("days");
	return __("In {0} days", [d]);
}

export function fileSize(n) {
	n = Number(n) || 0;
	if (n < 1024) return n + " B";
	if (n < 1048576) return (n / 1024).toFixed(0) + " KB";
	return (n / 1048576).toFixed(1) + " MB";
}

export const debounce = (fn, ms = 250) => {
	let t;
	return (...a) => {
		clearTimeout(t);
		t = setTimeout(() => fn(...a), ms);
	};
};

export function initials(name) {
	return (name || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

// ------------------------------------------------------------------ routing
export function go(...parts) {
	frappe.set_route("sijil-app", ...parts.filter((p) => p !== undefined && p !== null && p !== ""));
}

export const href = (...parts) => "/app/sijil-app/" + parts.map(encodeURIComponent).join("/");

// ------------------------------------------------------------------ pills
const PILL = {
	// case status
	"Not Started": "grey", "In Progress": "amber", "Awaiting Action": "blue", "On Hold": "grey", Completed: "green", Cancelled: "grey",
	// follow-up state
	Upcoming: "blue", "Due Today": "amber", Overdue: "red", Open: "blue",
	// land status
	Active: "green", Archived: "grey",
	// priority
	Low: "grey", Medium: "blue", High: "amber", Urgent: "red",
};

export function pill(value, tone) {
	if (!value) return "";
	return `<span class="sj-pill ${tone || PILL[value] || "grey"}">${esc(__(value))}</span>`;
}

// ------------------------------------------------------------------ icons (stroke icons, 24x24)
const ICONS = {
	home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
	land: '<path d="M3 20l5-9 4 6 3-4 6 7z"/><circle cx="17" cy="6" r="2"/>',
	case: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
	task: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12l3 3 5-6"/>',
	clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
	folder: '<path d="M3 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
	file: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/>',
	report: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
	plug: '<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 01-12 0zM12 17v4"/>',
	plus: '<path d="M12 5v14M5 12h14"/>',
	check: '<path d="M5 12l4 4 10-10"/>',
	chevron: '<path d="M9 6l6 6-6 6"/>',
	back: '<path d="M15 6l-6 6 6 6"/>',
	print: '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z"/>',
	upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
	link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
	alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
	user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
	users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0114 0M16 4.5a3.5 3.5 0 010 7M22 20a7 7 0 00-5-6.7"/>',
	bell: '<path d="M6 17V11a6 6 0 0112 0v6l2 2H4zM10 21h4"/>',
	mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
	calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
	project: '<path d="M3 7h18v13H3zM8 7V4h8v3"/>',
	building: '<path d="M4 21V5l8-2v18M12 9h8v12M7 9h2M7 13h2M7 17h2M15 13h2M15 17h2"/>',
	todo: '<path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
	edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
	search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
	star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
	circle: '<circle cx="12" cy="12" r="4"/>',
	x: '<path d="M6 6l12 12M18 6L6 18"/>',
	history: '<path d="M3 12a9 9 0 109-9 9 9 0 00-7 3.3M3 4v4h4M12 7v5l3 2"/>',
};

export function icon(name, { flip = false } = {}) {
	return `<span class="sj-ico ${flip ? "sj-flip" : ""}" aria-hidden="true"><svg viewBox="0 0 24 24">${ICONS[name] || ICONS.circle}</svg></span>`;
}

export function eventIcon(ev) {
	if (ev.entry_status === "Superseded") return ["history", ""];
	if (ev.is_milestone) return ["star", "milestone"];
	switch (ev.event_type) {
		case "No Progress": return ["clock", "noprogress"];
		case "Rejection": return ["alert", "rejected"];
		case "Approval": return ["check", "milestone"];
		case "Document Received": return ["file", ""];
		case "Meeting": return ["users", ""];
		case "Submission": return ["upload", ""];
		default: return ["check", ""];
	}
}

/** Event delegation helper: handlers keyed by data-action. */
export function delegate(el, handlers) {
	el.addEventListener("click", (e) => {
		const t = e.target.closest("[data-action]");
		if (!t || !el.contains(t)) return;
		const fn = handlers[t.dataset.action];
		if (fn) {
			e.preventDefault();
			fn(t, e);
		}
	});
}
