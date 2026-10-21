import { useQuery } from "@tanstack/react-query";
import { FileText, Paperclip, Upload, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/menu";
import { Input } from "@/components/ui/input";
import { t, tv } from "@/i18n";
import { useDebounced } from "@/lib/hooks";
import { documentKeys, documentsApi } from "./api";
import { UploadDocumentDialog } from "./UploadDocumentDialog";

export interface AttachedDocument {
	document: string;
	title: string;
	/** Pinned version; the backend defaults to the current one. */
	version?: string;
}

/**
 * Attach evidence to a development: pick an existing document of the land, or upload a new one into
 * the library. Nothing is copied — the record links to the stored document.
 */
export function AttachDocuments({ land, value, onChange }: { land: string; value: AttachedDocument[]; onChange: (docs: AttachedDocument[]) => void }) {
	const [uploading, setUploading] = React.useState(false);
	const add = (doc: AttachedDocument) => {
		if (!value.some((d) => d.document === doc.document)) onChange([...value, doc]);
	};
	return (
		<div className="space-y-2">
			<div className="text-xs font-semibold text-muted-foreground">{t("Supporting documents")}</div>
			{value.length > 0 && (
				<ul className="flex flex-wrap gap-2">
					{value.map((d) => (
						<li key={d.document} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs">
							<FileText className="size-3.5 text-muted-foreground" aria-hidden />
							<span dir="auto">{d.title}</span>
							<button type="button" className="text-muted-foreground hover:text-danger" aria-label={t("Remove {0}", d.title)} onClick={() => onChange(value.filter((x) => x.document !== d.document))}>
								<X className="size-3.5" />
							</button>
						</li>
					))}
				</ul>
			)}
			<div className="flex flex-wrap gap-2">
				<DocumentPicker land={land} onPick={add} exclude={value.map((d) => d.document)} />
				<Button variant="outline" size="sm" onClick={() => setUploading(true)}>
					<Upload />
					{t("Upload new")}
				</Button>
			</div>
			<UploadDocumentDialog open={uploading} onOpenChange={setUploading} land={land} onUploaded={(r) => add({ document: r.document, title: r.title, version: r.version })} />
		</div>
	);
}

export function DocumentPicker({
	land,
	onPick,
	exclude = [],
	label,
}: {
	land: string;
	onPick: (doc: AttachedDocument) => void;
	exclude?: string[];
	label?: string;
}) {
	const [open, setOpen] = React.useState(false);
	const [text, setText] = React.useState("");
	const q = useDebounced(text.trim(), 250);
	const query = useQuery({ queryKey: documentKeys.search(land, q), queryFn: () => documentsApi.search(land, q), enabled: open });
	const rows = (query.data ?? []).filter((d) => !exclude.includes(d.name));
	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="outline" size="sm">
					<Paperclip />
					{label ?? t("Attach existing")}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80 max-w-[calc(100vw-2rem)] p-2">
				<Input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={t("Search the land's library")} dir="auto" aria-label={t("Search the land's library")} />
				<ul className="mt-2 max-h-64 overflow-y-auto" role="listbox">
					{query.isLoading && <li className="px-2 py-1.5 text-sm text-muted-foreground">{t("Loading...")}</li>}
					{!query.isLoading && rows.length === 0 && <li className="px-2 py-1.5 text-sm text-muted-foreground">{t("No results")}</li>}
					{rows.map((d) => (
						<li key={d.name}>
							<button
								type="button"
								role="option"
								aria-selected={false}
								className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-start text-sm hover:bg-muted"
								onClick={() => {
									onPick({ document: d.name, title: d.title, version: d.current_version ?? undefined });
									setOpen(false);
									setText("");
								}}
							>
								<FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
								<span className="min-w-0 flex-1">
									<span className="block truncate" dir="auto">
										{d.title}
									</span>
									<span className="text-xs text-muted-foreground">
										{[tv(d.document_type), t("v{0}", d.version_count)].filter(Boolean).join(" · ")}
									</span>
								</span>
							</button>
						</li>
					))}
				</ul>
			</PopoverContent>
		</Popover>
	);
}
