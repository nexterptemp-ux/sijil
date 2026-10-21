// sijil.api.documents
import { call, upload } from "@/lib/api/client";
import type { DocumentVersionRef, LinkableDoctype, LinkedDocument, Page } from "@/lib/api/types";
import { compact } from "@/lib/utils";

export interface Folder {
	name: string;
	folder_name: string;
	parent_folder?: string | null;
	is_root: number;
	folder_path: string;
	document_count: number;
	child_count: number;
}

export interface DocumentRow {
	name: string;
	title: string;
	land: string;
	folder?: string | null;
	folder_name?: string | null;
	document_type?: string | null;
	reference_no?: string | null;
	document_date?: string | null;
	is_confidential: number;
	archived: number;
	current_version?: string | null;
	version_count: number;
	owner: string;
	owner_name?: string | null;
	creation: string;
	modified: string;
	version: DocumentVersionRef | null;
	links: number;
}

export interface Library {
	root: string;
	folder: string;
	breadcrumbs: { name: string; folder_name: string; is_root: number }[];
	tree: Folder[];
	children: Folder[];
	documents: Page<DocumentRow>;
	searching: boolean;
}

export interface DocumentDetail extends Omit<DocumentRow, "version" | "links" | "folder_name" | "owner_name"> {
	description?: string | null;
	land_name?: string | null;
	breadcrumbs: Library["breadcrumbs"];
	versions: (DocumentVersionRef & { notes?: string | null; uploaded_by_name?: string | null; is_current: number })[];
	links: {
		name: string;
		linked_doctype: LinkableDoctype;
		linked_name: string;
		title?: string | null;
		document_version?: string | null;
		version_no?: number | null;
		follow_latest: number;
		linked_by?: string;
		creation: string;
	}[];
	can_write: boolean;
}

export interface UploadInput {
	file: File;
	land: string;
	folder?: string | null;
	title?: string;
	document_type?: string;
	reference_no?: string;
	document_date?: string;
	description?: string;
	is_confidential?: boolean;
	notes?: string;
	link_doctype?: LinkableDoctype;
	link_name?: string;
}

export interface LibraryFilters {
	land: string;
	folder?: string;
	search?: string;
	document_type?: string;
	recursive?: boolean;
	start?: number;
	page_length?: number;
}

export const documentsApi = {
	library: (f: LibraryFilters) =>
		call<Library>("documents.library", compact({ ...f, recursive: f.recursive ? 1 : undefined })),
	get: (name: string) => call<DocumentDetail>("documents.get_document", { name }),
	update: (name: string, data: Record<string, unknown>) =>
		call<{ name: string }>("documents.update_document", { name, data }),
	createFolder: (land: string, folder_name: string, parent?: string | null) =>
		call<{ name: string }>("documents.create_folder", compact({ land, folder_name, parent })),
	renameFolder: (name: string, folder_name: string) =>
		call<{ name: string }>("documents.rename_folder", { name, folder_name }),
	moveFolder: (name: string, parent: string) => call<{ name: string }>("documents.move_folder", { name, parent }),
	deleteFolder: (name: string) => call<{ name: string }>("documents.delete_folder", { name }),
	moveDocument: (name: string, folder: string) => call<{ name: string }>("documents.move_document", { name, folder }),
	upload: (input: UploadInput) => {
		const form = new FormData();
		form.append("file", input.file, input.file.name);
		for (const [k, v] of Object.entries(input)) {
			if (k === "file" || v === undefined || v === null || v === "") continue;
			form.append(k, typeof v === "boolean" ? (v ? "1" : "0") : String(v));
		}
		return upload<{ document: string; version: string }>("documents.upload_document", form);
	},
	uploadVersion: (document: string, file: File, notes?: string) => {
		const form = new FormData();
		form.append("file", file, file.name);
		form.append("document", document);
		if (notes) form.append("notes", notes);
		return upload<{ version: string }>("documents.upload_version", form);
	},
	link: (
		document: string,
		linked_doctype: LinkableDoctype,
		linked_name: string,
		opts: { document_version?: string; follow_latest?: boolean; note?: string } = {},
	) =>
		call<{ name: string }>(
			"documents.link_document",
			compact({
				document,
				linked_doctype,
				linked_name,
				document_version: opts.document_version,
				follow_latest: opts.follow_latest ? 1 : 0,
				note: opts.note,
			}),
		),
	unlink: (link: string) => call<{ name: string }>("documents.unlink_document", { link }),
	linked: (linked_doctype: LinkableDoctype, linked_name: string) =>
		call<LinkedDocument[]>("documents.linked_documents", { linked_doctype, linked_name }),
	search: (land: string, query?: string, limit = 20) =>
		call<
			{
				name: string;
				title: string;
				document_type?: string | null;
				version_count: number;
				current_version?: string | null;
			}[]
		>("documents.search_documents", compact({ land, query, limit })),
};

export const documentKeys = {
	all: ["documents"] as const,
	library: (f: LibraryFilters) => ["documents", "library", f] as const,
	detail: (name: string) => ["documents", "detail", name] as const,
	search: (land: string, q: string) => ["documents", "search", land, q] as const,
	tree: (land: string) => ["documents", "tree", land] as const,
};

/** "Ownership Documents / Title Deeds" for every folder of a land. */
export function folderPaths(tree: Folder[]): { name: string; path: string; depth: number }[] {
	const byName = new Map(tree.map((f) => [f.name, f]));
	const label = (f: Folder): string[] => {
		const parent = f.parent_folder ? byName.get(f.parent_folder) : undefined;
		return parent ? [...label(parent), f.folder_name] : [f.folder_name];
	};
	return tree
		.map((f) => {
			const parts = label(f);
			return { name: f.name, path: parts.join(" / "), depth: parts.length - 1 };
		})
		.sort((a, b) => a.path.localeCompare(b.path));
}
