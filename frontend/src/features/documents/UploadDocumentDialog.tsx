import { useQuery } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import * as React from "react";
import { useBoot } from "@/app/boot";
import { Field } from "@/components/fields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/input";
import { t, tv } from "@/i18n";
import { useApiMutation } from "@/lib/api/hooks";
import { DOMAIN } from "@/lib/api/keys";
import type { LinkableDoctype } from "@/lib/api/types";
import { formatFileSize } from "@/lib/format";
import { documentKeys, documentsApi, folderPaths } from "./api";

/** Upload a new document into a land's library (one file, stored once, as version 1). */
export function UploadDocumentDialog({
	open,
	onOpenChange,
	land,
	folder,
	linkTo,
	onUploaded,
	defaultType,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	land: string;
	folder?: string | null;
	linkTo?: { doctype: LinkableDoctype; name: string };
	onUploaded?: (result: { document: string; version: string; title: string }) => void;
	/** Pre-selected document type (e.g. a missing key document). */
	defaultType?: string;
}) {
	const { boot } = useBoot();
	const [file, setFile] = React.useState<File | null>(null);
	const [title, setTitle] = React.useState("");
	const [type, setType] = React.useState("");
	const [reference, setReference] = React.useState("");
	const [date, setDate] = React.useState("");
	const [target, setTarget] = React.useState<string>("");
	const [confidential, setConfidential] = React.useState(false);
	const [description, setDescription] = React.useState("");
	const [touched, setTouched] = React.useState(false);

	const tree = useQuery({
		queryKey: documentKeys.tree(land),
		queryFn: () => documentsApi.library({ land, page_length: 1 }),
		enabled: open,
		select: (lib) => ({ root: lib.root, folders: folderPaths(lib.tree) }),
	});

	React.useEffect(() => {
		if (!open) return;
		setFile(null);
		setTitle("");
		setType(defaultType ?? "");
		setReference("");
		setDate("");
		setConfidential(false);
		setDescription("");
		setTouched(false);
		setTarget(folder ?? "");
	}, [open, folder, defaultType]);

	const save = useApiMutation(documentsApi.upload, {
		invalidate: DOMAIN,
		success: t("Document uploaded"),
		onSuccess: (r) => {
			onUploaded?.({ ...r, title: title.trim() || file?.name || "" });
			onOpenChange(false);
		},
	});

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		setTouched(true);
		if (!file || save.isPending) return;
		save.mutate({
			file,
			land,
			folder: target || tree.data?.root,
			title: title.trim() || undefined,
			document_type: type,
			reference_no: reference,
			document_date: date,
			description,
			is_confidential: confidential,
			link_doctype: linkTo?.doctype,
			link_name: linkTo?.name,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader
					title={t("Upload document")}
					description={t("The file is stored once in the land's library and can be linked to any record.")}
				/>
				<form onSubmit={submit} className="contents" noValidate>
					<DialogBody>
						<Field
							label={t("File")}
							required
							htmlFor="doc_file"
							error={touched && !file ? t("Choose a file to upload.") : undefined}
						>
							<label
								htmlFor="doc_file"
								className="flex cursor-pointer flex-col items-center gap-1 rounded-md border-2 border-dashed border-input px-4 py-6 text-center text-sm hover:border-primary/50"
							>
								<Upload className="size-5 text-muted-foreground" aria-hidden />
								{file ? (
									<span className="font-medium" dir="auto">
										{file.name}{" "}
										<span className="text-muted-foreground">({formatFileSize(file.size)})</span>
									</span>
								) : (
									<span className="text-muted-foreground">{t("Tap to choose a file")}</span>
								)}
							</label>
							<input
								id="doc_file"
								type="file"
								className="sr-only"
								onChange={(e) => {
									const f = e.target.files?.[0] ?? null;
									setFile(f);
									if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
								}}
							/>
						</Field>
						<Field label={t("Title")} htmlFor="doc_title">
							<Input id="doc_title" dir="auto" value={title} onChange={(e) => setTitle(e.target.value)} />
						</Field>
						<div className="grid gap-4 sm:grid-cols-2">
							<Field label={t("Folder")} htmlFor="doc_folder">
								<Select id="doc_folder" value={target} onChange={(e) => setTarget(e.target.value)}>
									<option value="">{t("Library root")}</option>
									{(tree.data?.folders ?? [])
										.filter((f) => f.depth > 0)
										.map((f) => (
											<option key={f.name} value={f.name}>
												{f.path.split(" / ").slice(1).join(" / ")}
											</option>
										))}
								</Select>
							</Field>
							<Field label={t("Document Type")} htmlFor="doc_type">
								<Select id="doc_type" value={type} onChange={(e) => setType(e.target.value)}>
									<option value="">—</option>
									{boot.options.document_type.map((o) => (
										<option key={o} value={o}>
											{tv(o)}
										</option>
									))}
								</Select>
							</Field>
							<Field label={t("Reference No")} htmlFor="doc_ref">
								<Input
									id="doc_ref"
									dir="auto"
									value={reference}
									onChange={(e) => setReference(e.target.value)}
								/>
							</Field>
							<Field label={t("Document Date")} htmlFor="doc_date">
								<Input
									id="doc_date"
									type="date"
									value={date}
									onChange={(e) => setDate(e.target.value)}
								/>
							</Field>
						</div>
						<Field label={t("Description")} htmlFor="doc_desc">
							<Textarea
								id="doc_desc"
								rows={2}
								value={description}
								onChange={(e) => setDescription(e.target.value)}
							/>
						</Field>
						<label className="flex items-center gap-2 text-sm">
							<Checkbox checked={confidential} onChange={(e) => setConfidential(e.target.checked)} />
							{t(
								"Confidential — only managers, the uploader and the land's responsible employees can see it",
							)}
						</label>
					</DialogBody>
					<DialogFooter>
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							{t("Cancel")}
						</Button>
						<Button type="submit" disabled={save.isPending}>
							{save.isPending ? t("Uploading...") : t("Upload")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
