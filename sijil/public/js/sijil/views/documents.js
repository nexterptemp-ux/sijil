import { call, debounce, delegate, esc, fileSize, fmtDate, fmtDateTime, go, href, icon, pill, state, upload } from "../core.js";
import { docFile } from "../components.js";
import { confirmDialog, empty, heading, loading, moreButton, openForm, overlay, toast } from "../ui.js";

/** Upload dialog (new document or new version). */
async function uploadForm({ land, folder, document, onDone }) {
	const opts = state.boot.options;
	const fields = [
		{ name: "file", label: __("File"), type: "file", required: true },
		...(document ? [{ name: "notes", label: __("Version Notes"), type: "textarea" }] : [
			{ name: "title", label: __("Title"), hint: __("Leave empty to use the file name.") },
			{ name: "document_type", label: __("Document Type"), type: "select", options: opts.document_type, row: "half" },
			{ name: "reference_no", label: __("Reference Number"), row: "half" },
			{ name: "document_date", label: __("Document Date"), type: "date", row: "half" },
			{ name: "is_confidential", label: __("Confidential"), type: "check", row: "half" },
			{ name: "description", label: __("Description"), type: "textarea" },
		]),
	];
	await openForm({
		title: document ? __("Upload New Version") : __("Upload Document"),
		note: document ? __("Records linked to earlier versions keep pointing at the version they were linked to.") : __("The file is stored once in the library and can be linked to cases, events and tasks."),
		fields,
		submitLabel: __("Upload"),
		onSubmit: async (v) => {
			if (!v.file) throw new Error(__("Choose a file."));
			const form = new FormData();
			form.append("file", v.file, v.file.name);
			if (document) {
				form.append("document", document);
				form.append("notes", v.notes || "");
				await upload("documents.upload_version", form);
			} else {
				form.append("land", land);
				if (folder) form.append("folder", folder);
				["title", "document_type", "reference_no", "document_date", "description"].forEach((k) => v[k] && form.append(k, v[k]));
				form.append("is_confidential", v.is_confidential ? 1 : 0);
				await upload("documents.upload_document", form);
			}
			toast(__("Uploaded"));
			onDone && onDone();
		},
	});
}

export async function documentDrawer(name, { onChange }) {
	const d = await call("documents.get_document", { name });
	const o = overlay({
		kind: "drawer",
		title: d.title,
		body: `<div class="sj-row" style="margin-bottom:8px">${d.document_type ? pill(d.document_type, "blue") : ""}${d.is_confidential ? pill("Confidential", "red") : ""}${d.archived ? pill("Archived", "grey") : ""}</div>
			<div class="sj-muted" style="margin-bottom:10px">${d.breadcrumbs.map((b) => esc(b.folder_name)).join(" / ")}</div>
			${d.reference_no ? `<div class="sj-kv"><div><strong>${esc(__("Reference Number"))}</strong><small>${esc(d.reference_no)}</small></div></div>` : ""}
			${d.document_date ? `<div class="sj-kv"><div><strong>${esc(__("Document Date"))}</strong><small>${esc(fmtDate(d.document_date))}</small></div></div>` : ""}
			${d.description ? `<p style="white-space:pre-wrap">${esc(d.description)}</p>` : ""}
			<h4 style="margin:14px 0 6px">${esc(__("Versions"))}</h4>
			${d.versions.map((v) => `<div class="sj-kv"><span class="sj-fileicon">${icon("file")}</span><div style="flex:1"><a class="sj-link" href="${esc(v.file)}" target="_blank" rel="noopener">v${v.version_no} — ${esc(v.file_name)}</a> ${v.is_current ? pill("Current", "green") : ""}<br><small>${esc(v.uploaded_by_name || "")} · ${esc(fmtDateTime(v.creation))} · ${esc(fileSize(v.file_size))}${v.notes ? " · " + esc(v.notes) : ""}</small></div></div>`).join("")}
			<h4 style="margin:14px 0 6px">${esc(__("Used In"))}</h4>
			${d.links.length ? d.links.map((l) => `<div class="sj-kv"><span class="sj-fileicon">${icon("link")}</span><div><strong>${esc(l.title || l.linked_name)}</strong><small>${esc(__(l.linked_doctype))} · ${l.follow_latest ? esc(__("Always the latest version")) : "v" + (l.version_no || "?")}</small></div></div>`).join("") : `<div class="sj-muted">${esc(__("Not linked to any record yet."))}</div>`}`,
		footer: d.can_write ? `<button type="button" class="sj-btn" data-act="rename">${icon("edit")} ${esc(__("Edit Details"))}</button><button type="button" class="sj-btn primary" data-act="version">${icon("upload")} ${esc(__("Upload New Version"))}</button>` : "",
	});
	o.root.addEventListener("click", async (e) => {
		const b = e.target.closest("[data-act]");
		if (!b) return;
		if (b.dataset.act === "version") { o.root.remove(); uploadForm({ land: d.land, document: d.name, onDone: onChange }); }
		if (b.dataset.act === "rename") {
			o.root.remove();
			openForm({
				title: __("Edit Details"),
				fields: [
					{ name: "title", label: __("Title"), value: d.title, required: true },
					{ name: "document_type", label: __("Document Type"), type: "select", options: state.boot.options.document_type, value: d.document_type || "", row: "half" },
					{ name: "reference_no", label: __("Reference Number"), value: d.reference_no || "", row: "half" },
					{ name: "description", label: __("Description"), type: "textarea", value: d.description || "" },
					{ name: "is_confidential", label: __("Confidential"), type: "check", value: d.is_confidential, row: "half" },
					{ name: "archived", label: __("Archived"), type: "check", value: d.archived, row: "half" },
				],
				onSubmit: async (v) => { await call("documents.update_document", { name: d.name, data: JSON.stringify(v) }); onChange && onChange(); },
			});
		}
	});
}

/** Document library for one land.  Used as a screen and embedded in the land page. */
export async function mountLibrary(el, landId, folderId, { app, embedded = false } = {}) {
	const q = { folder: folderId || null, search: "", type: "", recursive: 0, docs: [], total: 0, data: null };
	el.innerHTML = `<div class="sj-panelbody sj-toolbar" style="margin:0">
		<div class="sj-row"><button type="button" class="sj-btn primary small" data-action="upload">${icon("upload")} ${esc(__("Upload Document"))}</button>
		<button type="button" class="sj-btn small" data-action="new-folder">${icon("folder")} ${esc(__("New Folder"))}</button></div>
		<div class="sj-row"><select class="sj-select" data-type><option value="">${esc(__("All types"))}</option>${state.boot.options.document_type.map((t) => `<option value="${esc(t)}">${esc(__(t))}</option>`).join("")}</select>
		<label class="sj-checklabel"><input type="checkbox" data-recursive> ${esc(__("Include subfolders"))}</label>
		<input class="sj-input" type="search" data-search placeholder="${esc(__("Search documents..."))}"></div></div>
		<div class="sj-library" style="padding:0 14px 14px"><div class="sj-panel sj-tree" data-tree></div><div class="sj-panel" data-main></div></div>`;
	const tree = el.querySelector("[data-tree]");
	const main = el.querySelector("[data-main]");

	const drawTree = () => {
		const by = {};
		q.data.tree.forEach((f) => (by[f.parent_folder || "__root"] = (by[f.parent_folder || "__root"] || []).concat(f)));
		const node = (f, depth) => `<button type="button" class="sj-node ${f.name === q.data.folder ? "selected" : ""}" style="padding-inline-start:${8 + depth * 14}px" data-action="folder" data-name="${esc(f.name)}">${icon("folder")}<span>${esc(f.folder_name)}</span><small>${f.document_count || ""}</small></button>${(by[f.name] || []).map((c) => node(c, depth + 1)).join("")}`;
		tree.innerHTML = (by.__root || []).map((f) => node(f, 0)).join("");
	};
	const drawMain = () => {
		const d = q.data;
		const crumbs = d.breadcrumbs.map((b, i) => (i < d.breadcrumbs.length - 1 ? `<button type="button" data-action="folder" data-name="${esc(b.name)}">${esc(b.folder_name)}</button>${icon("chevron", { flip: true })}` : `<b>${esc(b.folder_name)}</b>`)).join("");
		const folders = d.searching ? "" : d.children.map((f) => `<button type="button" class="sj-tile" data-action="folder" data-name="${esc(f.name)}"><span class="sj-glyph folder">${icon("folder")}</span><strong>${esc(f.folder_name)}</strong><small>${f.document_count} ${esc(__("documents"))} · ${f.child_count} ${esc(__("folders"))}</small></button>`).join("");
		const docs = q.docs.map(docFile).join("");
		main.innerHTML = `<div class="sj-crumbbar">${crumbs}${d.searching ? ` <span class="sj-pill blue">${esc(__("Search results"))}: ${q.total}</span>` : ""}
			<span style="margin-inline-start:auto"><button type="button" data-action="rename-folder">${esc(__("Rename"))}</button> · <button type="button" data-action="delete-folder" style="color:var(--sj-red)">${esc(__("Delete Folder"))}</button></span></div>
			${folders || docs ? `<div class="sj-filegrid">${folders}${docs}</div>` : empty(__("This folder is empty."), "folder")}${moreButton(q.docs.length, q.total)}`;
		const isRoot = d.folder === d.root;
		main.querySelectorAll('[data-action="rename-folder"],[data-action="delete-folder"]').forEach((b) => (b.style.display = isRoot ? "none" : ""));
	};
	const load = async (append = false) => {
		if (!append) { q.docs = []; main.innerHTML = loading(); }
		const r = await call("documents.library", { land: landId, folder: q.folder, search: q.search, document_type: q.type, recursive: q.recursive, start: q.docs.length, page_length: 24 });
		q.data = r;
		q.folder = r.folder;
		q.docs = q.docs.concat(r.documents.rows);
		q.total = r.documents.total;
		drawTree();
		drawMain();
	};
	await load();

	el.querySelector("[data-search]").addEventListener("input", debounce((e) => { q.search = e.target.value; load(); }, 300));
	el.querySelector("[data-type]").addEventListener("change", (e) => { q.type = e.target.value; load(); });
	el.querySelector("[data-recursive]").addEventListener("change", (e) => { q.recursive = e.target.checked ? 1 : 0; load(); });
	delegate(el, {
		folder: (t) => { q.folder = t.dataset.name; q.search = ""; el.querySelector("[data-search]").value = ""; q.type = ""; el.querySelector("[data-type]").value = ""; load(); },
		more: () => load(true),
		"open-doc": (t) => documentDrawer(t.dataset.name, { onChange: () => load() }),
		upload: () => uploadForm({ land: landId, folder: q.folder, onDone: () => load() }),
		"new-folder": () => openForm({
			title: __("New Folder"),
			note: q.data.breadcrumbs.map((b) => b.folder_name).join(" / "),
			fields: [{ name: "folder_name", label: __("Folder Name"), required: true }],
			onSubmit: async (v) => { await call("documents.create_folder", { land: landId, folder_name: v.folder_name, parent: q.folder }); toast(__("Folder created")); load(); },
		}),
		"rename-folder": () => openForm({
			title: __("Rename Folder"),
			fields: [{ name: "folder_name", label: __("Folder Name"), required: true, value: q.data.breadcrumbs.at(-1).folder_name }],
			onSubmit: async (v) => { await call("documents.rename_folder", { name: q.folder, folder_name: v.folder_name }); load(); },
		}),
		"delete-folder": async () => {
			if (!(await confirmDialog({ title: __("Delete Folder"), message: __("Delete this empty folder?"), danger: true }))) return;
			const parent = q.data.breadcrumbs.at(-2);
			await call("documents.delete_folder", { name: q.folder });
			q.folder = parent ? parent.name : null;
			load();
		},
	});
}

export default {
	async mount(el, params, app) {
		app.setCrumbs([{ label: __("Document Library") }]);
		if (!params.id) {
			// choose a land
			const lands = await call("lands.list_lands", { status: "", page_length: 100 });
			el.innerHTML = `${heading({ eyebrow: __("Documents"), title: __("Document Library"), sub: __("Choose a land to browse its folders and documents.") })}
				<div class="sj-grid cols3">${lands.rows.map((l) => `<a class="sj-landtile" href="${href("documents", l.name)}"><div class="sj-row"><span class="sj-fileicon">${icon("folder")}</span><span class="sj-pill blue">${esc(l.land_code || l.name)}</span></div><h3>${esc(l.land_name)}</h3><p>${l.documents} ${esc(__("documents"))}</p></a>`).join("") || `<div class="sj-panel">${empty(__("No lands found"), "land")}</div>`}</div>`;
			return;
		}
		const land = await call("lands.get_land", { name: params.id });
		app.setCrumbs([{ label: __("Document Library"), route: ["documents"] }, { label: land.land_name }]);
		el.innerHTML = `${heading({ eyebrow: land.land_code || land.name, title: `${__("Document Library")} — ${land.land_name}`, sub: __("Hierarchical folders. Each file is stored once and can be linked to many records.") })}<section class="sj-panel" data-lib></section>`;
		await mountLibrary(el.querySelector("[data-lib]"), params.id, params.sub, { app });
	},
};
