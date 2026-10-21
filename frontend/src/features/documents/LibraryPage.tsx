import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronDown, FileText, Folder, FolderInput, FolderPlus, Lock, MoreHorizontal, Pencil, Trash2, Upload } from "lucide-react";
import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { useBoot } from "@/app/boot";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ForwardIcon, PageHeader, Pager, SearchInput } from "@/components/common";
import { Field } from "@/components/fields";
import { EmptyState, ErrorState, LoadingRows } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Checkbox, Input, Select } from "@/components/ui/input";
import { Card } from "@/components/ui/layout";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/menu";
import { landKeys, landsApi } from "@/features/lands/api";
import { t, tv } from "@/i18n";
import { useApiMutation } from "@/lib/api/hooks";
import { formatDate, formatNumber } from "@/lib/format";
import { useUrlState } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { documentKeys, documentsApi, folderPaths, type DocumentRow, type Folder as FolderT, type Library } from "./api";
import { DocumentDialog } from "./DocumentDialog";
import { UploadDocumentDialog } from "./UploadDocumentDialog";

const PAGE = 24;

export function LibraryPage() {
	const { land = "" } = useParams();
	const { boot } = useBoot();
	const [s, update] = useUrlState({ folder: "", search: "", type: "", recursive: "", page: "0", doc: "" });
	const page = Number(s.page) || 0;
	const filters = {
		land,
		folder: s.folder || undefined,
		search: s.search,
		document_type: s.type,
		recursive: s.recursive === "1",
		start: page * PAGE,
		page_length: PAGE,
	};
	const query = useQuery({ queryKey: documentKeys.library(filters), queryFn: () => documentsApi.library(filters), placeholderData: keepPreviousData });
	const [uploading, setUploading] = React.useState(false);
	const [newFolder, setNewFolder] = React.useState(false);
	const [treeOpen, setTreeOpen] = React.useState(false);
	const lib = query.data;
	const landName = lib?.breadcrumbs[0]?.folder_name;
	const goFolder = (folder: string) => {
		update({ folder: folder === lib?.root ? "" : folder, search: "", type: "", recursive: "" });
		setTreeOpen(false);
	};

	return (
		<>
			<PageHeader
				back={{ to: "/documents", label: t("Document Library") }}
				title={landName ?? t("Document Library")}
				subtitle={
					<Link to={`/lands/${land}`} className="hover:text-primary">
						{t("Open land / project")}
					</Link>
				}
				actions={
					boot.can_create["Sijil Document"] && (
						<>
							<Button variant="outline" onClick={() => setNewFolder(true)}>
								<FolderPlus />
								{t("New folder")}
							</Button>
							<Button onClick={() => setUploading(true)}>
								<Upload />
								{t("Upload")}
							</Button>
						</>
					)
				}
			/>
			{query.error && !lib ? (
				<ErrorState error={query.error} onRetry={() => void query.refetch()} />
			) : !lib ? (
				<LoadingRows rows={6} />
			) : (
				<div className="grid gap-6 lg:grid-cols-4">
					<aside className={cn("lg:block", treeOpen ? "block" : "hidden")} aria-label={t("Folders")}>
						<Card className="p-2">
							<FolderTree lib={lib} onSelect={goFolder} />
						</Card>
					</aside>
					<div className="min-w-0 space-y-4 lg:col-span-3">
						<div className="flex flex-wrap items-center gap-2">
							<Button variant="outline" size="sm" className="lg:hidden" onClick={() => setTreeOpen((v) => !v)} aria-expanded={treeOpen}>
								<Folder />
								{t("Folders")}
								<ChevronDown className={cn("transition-transform", treeOpen && "rotate-180")} />
							</Button>
							<nav aria-label={t("Folder path")} className="flex min-w-0 flex-wrap items-center gap-1 text-sm">
								{lib.breadcrumbs.map((b, i) => (
									<React.Fragment key={b.name}>
										{i > 0 && <ForwardIcon className="size-3.5 text-muted-foreground" />}
										{i === lib.breadcrumbs.length - 1 ? (
											<span className="font-semibold" dir="auto">
												{b.folder_name}
											</span>
										) : (
											<button type="button" className="text-muted-foreground hover:text-primary" onClick={() => goFolder(b.name)} dir="auto">
												{b.folder_name}
											</button>
										)}
									</React.Fragment>
								))}
							</nav>
							{lib.folder !== lib.root && boot.can_create["Sijil Document"] && <FolderMenu lib={lib} onDeleted={() => goFolder(lib.root)} />}
						</div>
						<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
							<SearchInput value={s.search} onChange={(search) => update({ search })} placeholder={t("Search documents")} className="flex-1" />
							<Select value={s.type} onChange={(e) => update({ type: e.target.value })} className="sm:w-48" aria-label={t("Document Type")}>
								<option value="">{t("All types")}</option>
								{boot.options.document_type.map((o) => (
									<option key={o} value={o}>
										{tv(o)}
									</option>
								))}
							</Select>
							<label className="flex items-center gap-2 text-sm">
								<Checkbox checked={s.recursive === "1"} onChange={(e) => update({ recursive: e.target.checked ? "1" : "" })} />
								{t("Include subfolders")}
							</label>
						</div>
						{!lib.searching && lib.children.length > 0 && (
							<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
								{lib.children.map((f) => (
									<button
										key={f.name}
										type="button"
										onClick={() => goFolder(f.name)}
										className="flex items-center gap-2 rounded-lg border border-border bg-surface p-3 text-start text-sm hover:border-primary/40"
									>
										<Folder className="size-5 shrink-0 fill-primary-soft text-primary" aria-hidden />
										<span className="min-w-0">
											<span className="block truncate font-medium" dir="auto">
												{f.folder_name}
											</span>
											<span className="text-xs text-muted-foreground">{t("{0} documents", formatNumber(f.document_count))}</span>
										</span>
									</button>
								))}
							</div>
						)}
						<Card className="px-4">
							{lib.documents.rows.length === 0 ? (
								<EmptyState
									title={lib.searching ? t("No documents match") : t("This folder has no documents")}
									action={
										!lib.searching && boot.can_create["Sijil Document"] ? (
											<Button variant="outline" size="sm" onClick={() => setUploading(true)}>
												<Upload />
												{t("Upload")}
											</Button>
										) : undefined
									}
								/>
							) : (
								<DocumentList rows={lib.documents.rows} showFolder={lib.searching} onOpen={(doc) => update({ doc }, { resetPage: false })} />
							)}
						</Card>
						<Pager page={page} onPage={(p) => update({ page: String(p) }, { resetPage: false })} data={lib.documents} />
					</div>
				</div>
			)}
			<UploadDocumentDialog open={uploading} onOpenChange={setUploading} land={land} folder={lib?.folder} />
			{lib && <NewFolderDialog open={newFolder} onOpenChange={setNewFolder} land={land} parent={lib.folder} />}
			<DocumentDialog name={s.doc || null} open={Boolean(s.doc)} onOpenChange={(o) => !o && update({ doc: "" }, { resetPage: false })} />
		</>
	);
}

function FolderTree({ lib, onSelect }: { lib: Library; onSelect: (folder: string) => void }) {
	const children = React.useMemo(() => {
		const map = new Map<string, FolderT[]>();
		for (const f of lib.tree) {
			const key = f.parent_folder ?? "";
			map.set(key, [...(map.get(key) ?? []), f]);
		}
		return map;
	}, [lib.tree]);
	const openPath = new Set(lib.breadcrumbs.map((b) => b.name));
	const render = (f: FolderT, depth: number): React.ReactNode => {
		const kids = children.get(f.name) ?? [];
		const active = f.name === lib.folder;
		return (
			<li key={f.name}>
				<button
					type="button"
					onClick={() => onSelect(f.name)}
					className={cn("flex w-full items-center gap-2 rounded px-2 py-1.5 text-start text-sm hover:bg-muted", active && "bg-primary-soft font-semibold text-primary")}
					style={{ paddingInlineStart: `${0.5 + depth * 0.9}rem` }}
					aria-current={active ? "true" : undefined}
				>
					<Folder className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} aria-hidden />
					<span className="min-w-0 flex-1 truncate" dir="auto">
						{f.folder_name}
					</span>
					{f.document_count > 0 && <span className="text-[11px] text-muted-foreground">{f.document_count}</span>}
				</button>
				{kids.length > 0 && (openPath.has(f.name) || depth === 0) && <ul>{kids.map((k) => render(k, depth + 1))}</ul>}
			</li>
		);
	};
	const roots = lib.tree.filter((f) => f.is_root);
	return <ul>{roots.map((r) => render(r, 0))}</ul>;
}

function DocumentList({ rows, showFolder, onOpen }: { rows: DocumentRow[]; showFolder: boolean; onOpen: (name: string) => void }) {
	return (
		<ul className="divide-y divide-border">
			{rows.map((d) => (
				<li key={d.name}>
					<button type="button" onClick={() => onOpen(d.name)} className="flex w-full items-start gap-3 py-3 text-start hover:bg-muted/40">
						<FileText className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
						<span className="min-w-0 flex-1">
							<span className="flex flex-wrap items-center gap-2">
								<span className={cn("font-medium", d.archived && "text-muted-foreground line-through")} dir="auto">
									{d.title}
								</span>
								{d.is_confidential ? <Lock className="size-3.5 text-warning" aria-label={t("Confidential")} /> : null}
							</span>
							<span className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
								{d.document_type && <span>{tv(d.document_type)}</span>}
								{d.reference_no && <span dir="auto">{d.reference_no}</span>}
								{d.document_date && <span>{formatDate(d.document_date)}</span>}
								{showFolder && d.folder_name && <span dir="auto">{d.folder_name}</span>}
								<span>{t("v{0}", d.version_count)}</span>
								{d.links > 0 && <span>{t("Linked to {0} records", d.links)}</span>}
							</span>
						</span>
					</button>
				</li>
			))}
		</ul>
	);
}

function NewFolderDialog({ open, onOpenChange, land, parent }: { open: boolean; onOpenChange: (o: boolean) => void; land: string; parent: string }) {
	const [name, setName] = React.useState("");
	React.useEffect(() => {
		if (open) setName("");
	}, [open]);
	const create = useApiMutation(() => documentsApi.createFolder(land, name.trim(), parent), {
		invalidate: [documentKeys.all],
		success: t("Folder created"),
		onSuccess: () => onOpenChange(false),
	});
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="sm">
				<DialogHeader title={t("New folder")} description={t("Created inside the current folder.")} />
				<form
					className="contents"
					onSubmit={(e) => {
						e.preventDefault();
						if (name.trim()) create.mutate(undefined);
					}}
				>
					<DialogBody>
						<Field label={t("Folder Name")} required htmlFor="nf_name">
							<Input id="nf_name" dir="auto" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
						</Field>
					</DialogBody>
					<DialogFooter>
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							{t("Cancel")}
						</Button>
						<Button type="submit" disabled={!name.trim() || create.isPending}>
							{t("Create")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function FolderMenu({ lib, onDeleted }: { lib: Library; onDeleted: () => void }) {
	const current = lib.tree.find((f) => f.name === lib.folder);
	const [mode, setMode] = React.useState<"rename" | "move" | "delete" | null>(null);
	const [value, setValue] = React.useState("");
	const close = (o: boolean) => !o && setMode(null);
	const rename = useApiMutation(() => documentsApi.renameFolder(lib.folder, value.trim()), { invalidate: [documentKeys.all], success: t("Folder renamed"), onSuccess: () => setMode(null) });
	const move = useApiMutation(() => documentsApi.moveFolder(lib.folder, value), { invalidate: [documentKeys.all], success: t("Folder moved"), onSuccess: () => setMode(null) });
	const remove = useApiMutation(() => documentsApi.deleteFolder(lib.folder), {
		invalidate: [documentKeys.all],
		success: t("Folder deleted"),
		onSuccess: () => {
			setMode(null);
			onDeleted();
		},
	});
	if (!current) return null;
	// A folder cannot move into itself or its own subfolders.
	const targets = folderPaths(lib.tree).filter((f) => {
		const folder = lib.tree.find((x) => x.name === f.name);
		return folder && !folder.folder_path.includes(`/${current.name}/`) && f.name !== current.parent_folder;
	});
	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon" className="size-8" aria-label={t("Folder actions")}>
						<MoreHorizontal />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem
						onSelect={() => {
							setValue(current.folder_name);
							setMode("rename");
						}}
					>
						<Pencil />
						{t("Rename")}
					</DropdownMenuItem>
					<DropdownMenuItem
						onSelect={() => {
							setValue(targets[0]?.name ?? "");
							setMode("move");
						}}
					>
						<FolderInput />
						{t("Move")}
					</DropdownMenuItem>
					<DropdownMenuItem destructive onSelect={() => setMode("delete")}>
						<Trash2 />
						{t("Delete")}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<Dialog open={mode === "rename" || mode === "move"} onOpenChange={close}>
				<DialogContent size="sm">
					<DialogHeader title={mode === "rename" ? t("Rename folder") : t("Move folder")} description={current.folder_name} />
					<DialogBody>
						{mode === "rename" ? (
							<Field label={t("Folder Name")} htmlFor="rf_name">
								<Input id="rf_name" dir="auto" value={value} onChange={(e) => setValue(e.target.value)} />
							</Field>
						) : (
							<Field label={t("Move into")} htmlFor="mf_target">
								<Select id="mf_target" value={value} onChange={(e) => setValue(e.target.value)}>
									{targets.map((f) => (
										<option key={f.name} value={f.name}>
											{f.path}
										</option>
									))}
								</Select>
							</Field>
						)}
					</DialogBody>
					<DialogFooter>
						<Button variant="outline" onClick={() => setMode(null)}>
							{t("Cancel")}
						</Button>
						<Button disabled={!value.trim() || rename.isPending || move.isPending} onClick={() => (mode === "rename" ? rename.mutate(undefined) : move.mutate(undefined))}>
							{t("Save")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			<ConfirmDialog
				open={mode === "delete"}
				onOpenChange={close}
				title={t("Delete folder")}
				message={t("Only empty folders can be deleted. Move its documents and subfolders first.")}
				confirmLabel={t("Delete")}
				destructive
				pending={remove.isPending}
				onConfirm={() => remove.mutate(undefined)}
			/>
		</>
	);
}

/** /documents — choose a land's library. */
export function DocumentsHome() {
	const filters = { page_length: 100 };
	const query = useQuery({ queryKey: landKeys.list(filters), queryFn: () => landsApi.list(filters) });
	return (
		<>
			<PageHeader title={t("Document Library")} subtitle={t("Each land / project has its own library. Choose one to browse.")} />
			{query.isLoading ? (
				<LoadingRows rows={4} />
			) : query.error ? (
				<ErrorState error={query.error} onRetry={() => void query.refetch()} />
			) : !query.data?.rows.length ? (
				<EmptyState title={t("No lands found")} />
			) : (
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
					{query.data.rows.map((l) => (
						<Link key={l.name} to={`/documents/${l.name}`} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 hover:border-primary/40">
							<Folder className="size-6 shrink-0 fill-primary-soft text-primary" aria-hidden />
							<span className="min-w-0">
								<span className="block truncate font-semibold" dir="auto">
									{l.land_name}
								</span>
								<span className="text-xs text-muted-foreground">{t("{0} documents", formatNumber(l.documents))}</span>
							</span>
						</Link>
					))}
				</div>
			)}
		</>
	);
}
