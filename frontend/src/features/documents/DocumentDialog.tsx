import { useQuery } from "@tanstack/react-query";
import { Archive, Download, Lock, Upload } from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";
import { useBoot } from "@/app/boot";
import { Field } from "@/components/fields";
import { ErrorState, LoadingRows } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/layout";
import { t, tv } from "@/i18n";
import { useApiMutation } from "@/lib/api/hooks";
import { DOMAIN } from "@/lib/api/keys";
import { formatDate, formatDateTime, formatFileSize } from "@/lib/format";
import { documentKeys, documentsApi, folderPaths, type DocumentDetail } from "./api";

const RECORD_PATH: Record<string, string> = {
	"Sijil Land": "/lands/",
	"Sijil Case": "/cases/",
	"Sijil Task": "/tasks/",
};

function linkedLabel(doctype: string): string {
	return (
		{
			"Sijil Land": t("Land / Project"),
			"Sijil Case": t("Case"),
			"Sijil Case Event": t("Development"),
			"Sijil Task": t("Task"),
			"Sijil Follow Up": t("Follow-up"),
		}[doctype] ?? doctype
	);
}

/** Document detail: metadata, immutable versions (upload a new one), and where it is linked. */
export function DocumentDialog({
	name,
	open,
	onOpenChange,
}: {
	name: string | null;
	open: boolean;
	onOpenChange: (o: boolean) => void;
}) {
	const query = useQuery({
		queryKey: documentKeys.detail(name ?? ""),
		queryFn: () => documentsApi.get(name!),
		enabled: Boolean(name) && open,
	});
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="lg">
				{query.isLoading || !query.data ? (
					<>
						<DialogHeader title={t("Document")} />
						<DialogBody>
							{query.error ? <ErrorState error={query.error} /> : <LoadingRows rows={3} />}
						</DialogBody>
					</>
				) : (
					<DocumentBody doc={query.data} onClose={() => onOpenChange(false)} />
				)}
			</DialogContent>
		</Dialog>
	);
}

function DocumentBody({ doc, onClose }: { doc: DocumentDetail; onClose: () => void }) {
	const { boot } = useBoot();
	const [title, setTitle] = React.useState(doc.title);
	const [type, setType] = React.useState(doc.document_type ?? "");
	const [reference, setReference] = React.useState(doc.reference_no ?? "");
	const [date, setDate] = React.useState(doc.document_date ?? "");
	const [description, setDescription] = React.useState(doc.description ?? "");
	const [confidential, setConfidential] = React.useState(Boolean(doc.is_confidential));
	const [folder, setFolder] = React.useState(doc.folder ?? "");
	const fileInput = React.useRef<HTMLInputElement>(null);

	const tree = useQuery({
		queryKey: documentKeys.tree(doc.land),
		queryFn: () => documentsApi.library({ land: doc.land, page_length: 1 }),
		select: (lib) => folderPaths(lib.tree),
	});
	const save = useApiMutation(
		() =>
			documentsApi.update(doc.name, {
				title: title.trim(),
				document_type: type,
				reference_no: reference,
				document_date: date,
				description,
				is_confidential: confidential ? 1 : 0,
				folder,
			}),
		{ invalidate: DOMAIN, success: t("Saved") },
	);
	const archive = useApiMutation(() => documentsApi.update(doc.name, { archived: doc.archived ? 0 : 1 }), {
		invalidate: DOMAIN,
		success: doc.archived ? t("Document restored") : t("Document archived"),
	});
	const newVersion = useApiMutation((file: File) => documentsApi.uploadVersion(doc.name, file), {
		invalidate: DOMAIN,
		success: t("New version uploaded"),
	});
	const current = doc.versions.find((v) => v.is_current) ?? doc.versions[0];

	return (
		<>
			<DialogHeader title={doc.title} description={doc.breadcrumbs.map((b) => b.folder_name).join(" / ")} />
			<DialogBody>
				<div className="flex flex-wrap items-center gap-2">
					{doc.is_confidential ? (
						<Badge tone="warning">
							<Lock className="size-3" />
							{t("Confidential")}
						</Badge>
					) : null}
					{doc.archived ? <Badge>{t("Archived")}</Badge> : null}
					{current && (
						<Button asChild size="sm">
							<a href={current.file} target="_blank" rel="noreferrer">
								<Download />
								{t("Open v{0}", current.version_no)}
							</a>
						</Button>
					)}
					{doc.can_write && (
						<>
							<Button
								size="sm"
								variant="outline"
								disabled={newVersion.isPending}
								onClick={() => fileInput.current?.click()}
							>
								<Upload />
								{newVersion.isPending ? t("Uploading...") : t("Upload new version")}
							</Button>
							<input
								ref={fileInput}
								type="file"
								className="sr-only"
								aria-label={t("Upload new version")}
								onChange={(e) => {
									const f = e.target.files?.[0];
									if (f) newVersion.mutate(f);
									e.target.value = "";
								}}
							/>
						</>
					)}
				</div>

				<section aria-label={t("Versions")}>
					<h3 className="mb-2 text-sm font-bold">{t("Versions")}</h3>
					<p className="mb-2 text-xs text-muted-foreground">
						{t(
							"Versions are never changed or deleted. Records keep pointing at the version they were linked to.",
						)}
					</p>
					<ul className="divide-y divide-border rounded-md border border-border">
						{doc.versions.map((v) => (
							<li key={v.name} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
								<span className="font-semibold">{t("v{0}", v.version_no)}</span>
								{v.is_current ? <Badge tone="success">{t("Current")}</Badge> : null}
								<a
									href={v.file}
									target="_blank"
									rel="noreferrer"
									className="min-w-0 flex-1 truncate text-primary hover:underline"
									dir="auto"
								>
									{v.file_name}
								</a>
								<span className="text-xs text-muted-foreground">
									{formatFileSize(v.file_size)} · <bdi>{v.uploaded_by_name || v.uploaded_by}</bdi> ·{" "}
									<bdi>{formatDateTime(v.creation)}</bdi>
								</span>
							</li>
						))}
					</ul>
				</section>

				<section aria-label={t("Linked to")}>
					<h3 className="mb-2 text-sm font-bold">{t("Linked to")}</h3>
					{doc.links.length === 0 ? (
						<p className="text-sm text-muted-foreground">{t("Not linked to any record yet.")}</p>
					) : (
						<ul className="space-y-1.5 text-sm">
							{doc.links.map((l) => {
								const base = RECORD_PATH[l.linked_doctype];
								const label = l.title || l.linked_name;
								return (
									<li key={l.name} className="flex flex-wrap items-center gap-2">
										<Badge>{linkedLabel(l.linked_doctype)}</Badge>
										{base ? (
											<Link
												to={`${base}${l.linked_name}`}
												onClick={onClose}
												className="hover:text-primary"
												dir="auto"
											>
												{label}
											</Link>
										) : (
											<span dir="auto">{label}</span>
										)}
										<span className="text-xs text-muted-foreground">
											{l.follow_latest
												? t("always the latest version")
												: t("pinned to v{0}", l.version_no ?? "?")}
										</span>
									</li>
								);
							})}
						</ul>
					)}
				</section>

				{doc.can_write ? (
					<section className="space-y-4 border-t border-border pt-4" aria-label={t("Details")}>
						<div className="grid gap-4 sm:grid-cols-2">
							<Field label={t("Title")} htmlFor="dd_title" className="sm:col-span-2">
								<Input
									id="dd_title"
									dir="auto"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
								/>
							</Field>
							<Field label={t("Document Type")} htmlFor="dd_type">
								<Select id="dd_type" value={type} onChange={(e) => setType(e.target.value)}>
									<option value="">—</option>
									{boot.options.document_type.map((o) => (
										<option key={o} value={o}>
											{tv(o)}
										</option>
									))}
								</Select>
							</Field>
							<Field label={t("Folder")} htmlFor="dd_folder">
								<Select id="dd_folder" value={folder} onChange={(e) => setFolder(e.target.value)}>
									{(tree.data ?? []).map((f) => (
										<option key={f.name} value={f.name}>
											{f.path}
										</option>
									))}
								</Select>
							</Field>
							<Field label={t("Reference No")} htmlFor="dd_ref">
								<Input
									id="dd_ref"
									dir="auto"
									value={reference}
									onChange={(e) => setReference(e.target.value)}
								/>
							</Field>
							<Field label={t("Document Date")} htmlFor="dd_date">
								<Input
									id="dd_date"
									type="date"
									value={date}
									onChange={(e) => setDate(e.target.value)}
								/>
							</Field>
						</div>
						<Field label={t("Description")} htmlFor="dd_desc">
							<Textarea
								id="dd_desc"
								rows={2}
								value={description}
								onChange={(e) => setDescription(e.target.value)}
							/>
						</Field>
						<label className="flex items-center gap-2 text-sm">
							<Checkbox checked={confidential} onChange={(e) => setConfidential(e.target.checked)} />
							{t("Confidential")}
						</label>
					</section>
				) : (
					<dl className="grid gap-2 border-t border-border pt-4 text-sm sm:grid-cols-2">
						<div>
							<dt className="text-xs text-muted-foreground">{t("Document Type")}</dt>
							<dd>{tv(doc.document_type) || "—"}</dd>
						</div>
						<div>
							<dt className="text-xs text-muted-foreground">{t("Document Date")}</dt>
							<dd>{formatDate(doc.document_date)}</dd>
						</div>
					</dl>
				)}
			</DialogBody>
			<DialogFooter className="justify-between">
				{doc.can_write ? (
					<Button variant="ghost" onClick={() => archive.mutate(undefined)} disabled={archive.isPending}>
						<Archive />
						{doc.archived ? t("Restore") : t("Archive")}
					</Button>
				) : (
					<span />
				)}
				<div className="flex gap-2">
					<Button variant="outline" onClick={onClose}>
						{t("Close")}
					</Button>
					{doc.can_write && (
						<Button disabled={!title.trim() || save.isPending} onClick={() => save.mutate(undefined)}>
							{t("Save")}
						</Button>
					)}
				</div>
			</DialogFooter>
		</>
	);
}
