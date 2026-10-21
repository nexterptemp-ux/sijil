// Reusable UI pieces: modal / drawer, form builder, link combobox, toast, small widgets.

import { call, debounce, esc, icon, state, users } from "./core.js";

let toastTimer;
export function toast(message) {
	document.querySelectorAll(".sj-toast").forEach((n) => n.remove());
	const el = document.createElement("div");
	el.className = "sj-toast";
	el.textContent = message;
	el.setAttribute("role", "status");
	document.body.appendChild(el);
	clearTimeout(toastTimer);
	toastTimer = setTimeout(() => el.remove(), 3200);
}

// ------------------------------------------------------------------ small widgets
export const loading = () => '<div class="sj-panel" style="padding:12px 0"><div class="sj-skeleton"></div><div class="sj-skeleton" style="width:70%"></div><div class="sj-skeleton" style="width:85%"></div></div>';

export const empty = (text, ico = "case") => `<div class="sj-empty">${icon(ico)}<div>${esc(text)}</div></div>`;

export function heading({ eyebrow, title, sub, actions = "" }) {
	return `<div class="sj-heading"><div>${eyebrow ? `<p class="sj-eyebrow">${esc(eyebrow)}</p>` : ""}<h1>${esc(title)}</h1>${sub ? `<div class="sj-sub">${esc(sub)}</div>` : ""}</div><div class="sj-actions">${actions}</div></div>`;
}

export const btn = (label, action, { kind = "", ico = "", data = {} } = {}) =>
	`<button type="button" class="sj-btn ${kind}" data-action="${esc(action)}" ${Object.entries(data).map(([k, v]) => `data-${k}="${esc(v)}"`).join(" ")}>${ico ? icon(ico) : ""}${esc(label)}</button>`;

export const moreButton = (loaded, total, action = "more") =>
	loaded < total
		? `<div class="sj-more"><button type="button" class="sj-btn small" data-action="${action}">${esc(__("Show more"))} (${total - loaded})</button></div>`
		: "";

export function stat(label, value, { tone = "", action = "", sub = "", data = {} } = {}) {
	const tag = action ? "button" : "div";
	const attrs = action ? `type="button" data-action="${action}" ${Object.entries(data).map(([k, v]) => `data-${k}="${esc(v)}"`).join(" ")}` : "";
	return `<${tag} class="sj-stat ${tone}" ${attrs}><span>${esc(label)}</span><strong>${esc(value)}</strong>${sub ? `<small>${esc(sub)}</small>` : ""}</${tag}>`;
}

// ------------------------------------------------------------------ overlay (modal / drawer)
export function overlay({ title, body, footer = "", kind = "modal", wide = false, onClose }) {
	const root = document.createElement("div");
	root.className = "sj-shade" + (kind === "drawer" ? " drawer" : "");
	root.innerHTML = `<div class="${kind === "drawer" ? "sj-drawer" : "sj-modal" + (wide ? " wide" : "")}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
		<div class="sj-modalhead"><h2>${esc(title)}</h2><button type="button" class="sj-btn small" data-close aria-label="${esc(__("Close"))}">${icon("x")}</button></div>
		<div class="sj-modalbody">${body}</div>${footer ? `<div class="sj-modalfoot">${footer}</div>` : ""}</div>`;
	document.body.appendChild(root);
	const close = () => {
		document.removeEventListener("keydown", onKey);
		root.remove();
		onClose && onClose();
	};
	const onKey = (e) => e.key === "Escape" && close();
	document.addEventListener("keydown", onKey);
	root.addEventListener("mousedown", (e) => e.target === root && close());
	root.addEventListener("click", (e) => e.target.closest("[data-close]") && close());
	return { root, close, body: root.querySelector(".sj-modalbody"), footer: root.querySelector(".sj-modalfoot") };
}

export function confirmDialog({ title, message, confirmLabel, danger = false }) {
	return new Promise((resolve) => {
		const o = overlay({
			title,
			body: `<p style="line-height:1.9">${esc(message)}</p>`,
			footer: `<button type="button" class="sj-btn" data-close>${esc(__("Cancel"))}</button><button type="button" class="sj-btn ${danger ? "danger" : "primary"}" data-ok>${esc(confirmLabel || __("Confirm"))}</button>`,
			onClose: () => resolve(false),
		});
		o.root.querySelector("[data-ok]").addEventListener("click", () => {
			resolve(true);
			o.root.remove();
		});
	});
}

// ------------------------------------------------------------------ form builder
/*
 field: {
   name, label, type: text|textarea|date|number|select|check|user|link|file|hidden|html,
   required, value, hint, options: [string | {value,label}], doctype (link), filters (link), valueLabel (link),
   placeholder, translate (select, default true), row: "half" to place two fields side by side
 }
*/
function optionHtml(opt, selected, translate) {
	const value = typeof opt === "object" ? opt.value : opt;
	const label = typeof opt === "object" ? opt.label : translate && value ? __(value) : value;
	return `<option value="${esc(value)}" ${String(value) === String(selected ?? "") ? "selected" : ""}>${esc(label)}</option>`;
}

function fieldHtml(f, userList) {
	const id = "sjf_" + f.name;
	const val = f.value ?? "";
	const req = f.required ? ' <span class="req">*</span>' : "";
	const label = f.label ? `<label for="${id}">${esc(f.label)}${req}</label>` : "";
	const hint = f.hint ? `<div class="hint">${esc(f.hint)}</div>` : "";
	let control = "";
	switch (f.type) {
		case "hidden":
			return `<input type="hidden" name="${f.name}" value="${esc(val)}">`;
		case "html":
			return `<div class="sj-field">${label}${f.html || ""}${hint}</div>`;
		case "textarea":
			control = `<textarea id="${id}" name="${f.name}" ${f.required ? "required" : ""} placeholder="${esc(f.placeholder || "")}">${esc(val)}</textarea>`;
			break;
		case "date":
			control = `<input id="${id}" type="date" name="${f.name}" value="${esc(val)}" ${f.required ? "required" : ""} ${f.max ? `max="${esc(f.max)}"` : ""} ${f.min ? `min="${esc(f.min)}"` : ""}>`;
			break;
		case "number":
			control = `<input id="${id}" type="number" name="${f.name}" value="${esc(val)}" min="0">`;
			break;
		case "check":
			return `<div class="sj-field"><label class="sj-checklabel"><input type="checkbox" name="${f.name}" ${val ? "checked" : ""}> ${esc(f.label)}</label>${hint}</div>`;
		case "select": {
			const opts = f.options || [];
			control = `<select id="${id}" name="${f.name}" ${f.required ? "required" : ""}>${f.blank !== false && !f.required ? '<option value=""></option>' : ""}${opts.map((o) => optionHtml(o, val, f.translate !== false)).join("")}</select>`;
			break;
		}
		case "user":
			control = `<select id="${id}" name="${f.name}" ${f.required ? "required" : ""}>${f.required ? "" : '<option value=""></option>'}${userList.map((u) => optionHtml({ value: u.name, label: u.full_name || u.name }, val, false)).join("")}</select>`;
			break;
		case "link":
			control = `<div class="sj-combo" data-doctype="${esc(f.doctype)}" data-filters="${esc(JSON.stringify(f.filters || {}))}">
				<input type="text" autocomplete="off" id="${id}" data-combo-input value="${esc(f.valueLabel || val)}" placeholder="${esc(f.placeholder || __("Type to search"))}" ${f.required ? "required" : ""}>
				<input type="hidden" name="${f.name}" value="${esc(val)}"><div class="sj-combo-list" hidden></div></div>`;
			break;
		case "file":
			control = `<input id="${id}" type="file" name="${f.name}" ${f.required ? "required" : ""}>`;
			break;
		default:
			control = `<input id="${id}" type="text" name="${f.name}" value="${esc(val)}" ${f.required ? "required" : ""} placeholder="${esc(f.placeholder || "")}" maxlength="${f.maxlength || 255}">`;
	}
	return `<div class="sj-field">${label}${control}${hint}</div>`;
}

export function formHtml(fields, userList) {
	const out = [];
	for (let i = 0; i < fields.length; i++) {
		const f = fields[i];
		if (f.row === "half" && fields[i + 1] && fields[i + 1].row === "half") {
			out.push(`<div class="sj-grid2">${fieldHtml(f, userList)}${fieldHtml(fields[i + 1], userList)}</div>`);
			i++;
		} else out.push(fieldHtml(f, userList));
	}
	return out.join("");
}

export function bindCombos(root) {
	root.querySelectorAll(".sj-combo").forEach((combo) => {
		const input = combo.querySelector("[data-combo-input]");
		const hidden = combo.querySelector('input[type="hidden"]');
		const list = combo.querySelector(".sj-combo-list");
		const doctype = combo.dataset.doctype;
		const search = debounce(async () => {
			let filters = {};
			try { filters = JSON.parse(combo.dataset.filters || "{}"); } catch (e) { /* ignore */ }
			const rows = await call("meta.lookup", { doctype, txt: input.value, filters: JSON.stringify(filters) });
			list.innerHTML = rows.length
				? rows.map((r) => `<button type="button" data-value="${esc(r.value)}" data-label="${esc(r.label)}">${esc(r.label)}${r.label !== r.value ? `<small>${esc(r.value)}</small>` : ""}</button>`).join("")
				: `<div class="sj-muted" style="padding:8px 10px">${esc(__("No results"))}</div>`;
			list.hidden = false;
		}, 220);
		input.addEventListener("input", () => { hidden.value = ""; search(); });
		input.addEventListener("focus", search);
		list.addEventListener("mousedown", (e) => {
			const b = e.target.closest("button[data-value]");
			if (!b) return;
			e.preventDefault();
			hidden.value = b.dataset.value;
			input.value = b.dataset.label;
			list.hidden = true;
			hidden.dispatchEvent(new Event("change", { bubbles: true }));
		});
		input.addEventListener("blur", () => setTimeout(() => (list.hidden = true), 150));
	});
}

export function readForm(form) {
	const values = {};
	form.querySelectorAll("[name]").forEach((el) => {
		if (el.type === "checkbox") values[el.name] = el.checked ? 1 : 0;
		else if (el.type === "file") values[el.name] = el.files[0] || null;
		else values[el.name] = typeof el.value === "string" ? el.value.trim() : el.value;
	});
	return values;
}

/** Open a form in a modal. onSubmit(values, form) must return a promise; the modal closes when it resolves. */
export async function openForm({ title, fields, submitLabel, onSubmit, wide = false, note = "", extraHtml = "", afterOpen }) {
	const userList = fields.some((f) => f.type === "user") ? await users() : [];
	const o = overlay({
		title,
		wide,
		body: `<form novalidate>${note ? `<div class="sj-notice">${esc(note)}</div>` : ""}<div class="sj-error" hidden></div>${formHtml(fields, userList)}${extraHtml}</form>`,
		footer: `<button type="button" class="sj-btn" data-close>${esc(__("Cancel"))}</button><button type="button" class="sj-btn primary" data-submit>${esc(submitLabel || __("Save"))}</button>`,
	});
	const form = o.body.querySelector("form");
	bindCombos(form);
	afterOpen && afterOpen(form, o);
	const submit = o.footer.querySelector("[data-submit]");
	let busy = false;
	const run = async () => {
		if (busy) return;
		const err = form.querySelector(".sj-error");
		err.hidden = true;
		if (!form.reportValidity()) return;
		busy = true;
		submit.disabled = true;
		try {
			await onSubmit(readForm(form), form);
			o.root.remove();
		} catch (e) {
			err.textContent = (e && e.message) || __("Something went wrong");
			err.hidden = !(e && e.message);
		} finally {
			busy = false;
			submit.disabled = false;
		}
	};
	submit.addEventListener("click", run);
	form.addEventListener("submit", (e) => { e.preventDefault(); run(); });
	const first = form.querySelector("input:not([type=hidden]), textarea, select");
	first && first.focus();
	return o;
}

export const nameOf = (u) => (state.boot && u === state.boot.user.name ? state.boot.user.full_name : u);
