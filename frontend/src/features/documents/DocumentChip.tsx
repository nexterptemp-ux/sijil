import { FileText, Lock } from "lucide-react";
import type * as React from "react";
import { t } from "@/i18n";
import type { LinkedDocument } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/**
 * A document linked to a record, showing the exact version the link points to. The file URL is
 * private: the browser sends the session cookie and Frappe checks permission on download.
 */
export function DocumentChip({
	doc,
	action,
	className,
}: {
	doc: LinkedDocument;
	action?: React.ReactNode;
	className?: string;
}) {
	const v = doc.version;
	return (
		<span
			className={cn(
				"inline-flex max-w-full items-center gap-2 rounded-md border border-border bg-surface px-2 py-1 text-xs",
				className,
			)}
		>
			{doc.is_confidential ? (
				<Lock className="size-3.5 shrink-0 text-warning" aria-label={t("Confidential")} />
			) : (
				<FileText className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
			)}
			{v ? (
				<a
					href={v.file}
					target="_blank"
					rel="noreferrer"
					className="truncate font-medium hover:text-primary"
					dir="auto"
					title={v.file_name}
				>
					{doc.title}
				</a>
			) : (
				<span className="truncate font-medium" dir="auto">
					{doc.title}
				</span>
			)}
			{v && <span className="shrink-0 text-muted-foreground">{t("v{0}", v.version_no)}</span>}
			{doc.has_newer_version && (
				<span
					className="shrink-0 rounded bg-warning-soft px-1 text-[10px] font-semibold text-warning"
					title={t("A newer version (v{0}) exists", doc.current_version_no)}
				>
					{t("Newer version available")}
				</span>
			)}
			{action}
		</span>
	);
}
