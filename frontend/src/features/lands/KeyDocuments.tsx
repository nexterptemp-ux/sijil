// The three documents every land must have: صك الملكية، الكروكي التنظيمي، المخطط المعتمد.
import { CheckCircle2, CircleDashed, FileCheck2, Upload } from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardBody, CardHeader } from "@/components/ui/layout";
import { UploadDocumentDialog } from "@/features/documents/UploadDocumentDialog";
import { t, tv } from "@/i18n";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { KEY_DOCUMENT_TYPES, type KeyDocument, type Land } from "./api";

function shortLabel(type: string): string {
	return (
		{
			"Title Deed": t("Deed"),
			"Organizational Sketch": t("Sketch"),
			"Approved Master Plan": t("Approved plan"),
		}[type] ?? tv(type)
	);
}

/** Compact "have / missing" chips for a land card. */
export function KeyDocumentsIndicator({ have }: { have: string[] }) {
	const count = KEY_DOCUMENT_TYPES.filter((ty) => have.includes(ty)).length;
	const complete = count === KEY_DOCUMENT_TYPES.length;
	return (
		<div
			className="flex flex-wrap items-center gap-1.5"
			aria-label={t("Key documents: {0} of {1}", count, KEY_DOCUMENT_TYPES.length)}
		>
			{KEY_DOCUMENT_TYPES.map((ty) => {
				const ok = have.includes(ty);
				return (
					<span
						key={ty}
						title={`${tv(ty)} — ${ok ? t("Available") : t("Missing")}`}
						className={cn(
							"inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
							ok
								? "bg-success-soft text-success ring-success/15"
								: "bg-muted text-muted-foreground ring-border",
						)}
					>
						{ok ? (
							<CheckCircle2 className="size-3" aria-hidden />
						) : (
							<CircleDashed className="size-3" aria-hidden />
						)}
						{shortLabel(ty)}
					</span>
				);
			})}
			<span className={cn("tabular ms-auto text-[11px] font-bold", complete ? "text-success" : "text-warning")}>
				{count}/{KEY_DOCUMENT_TYPES.length}
			</span>
		</div>
	);
}

/** Land page card: which key documents exist, each linked to the library; upload the missing ones. */
export function KeyDocumentsCard({ land }: { land: Land }) {
	const [uploadType, setUploadType] = React.useState<string | null>(null);
	const rows: KeyDocument[] = land.key_documents ?? [];
	const count = rows.filter((r) => r.document).length;
	return (
		<Card>
			<CardHeader
				icon={<FileCheck2 />}
				title={t("Key documents")}
				description={t("{0} of {1} available", count, KEY_DOCUMENT_TYPES.length)}
				action={
					<Badge tone={count === KEY_DOCUMENT_TYPES.length ? "success" : "warning"} dot>
						{count === KEY_DOCUMENT_TYPES.length ? t("All available") : t("Incomplete")}
					</Badge>
				}
			/>
			<CardBody className="py-1">
				<ul className="divide-y divide-border/70">
					{rows.map((r) => (
						<li key={r.document_type} className="flex items-center gap-3 py-3">
							<span
								className={cn(
									"flex size-9 shrink-0 items-center justify-center rounded-xl",
									r.document ? "bg-success-soft text-success" : "bg-warning-soft text-warning",
								)}
								aria-hidden
							>
								{r.document ? (
									<CheckCircle2 className="size-[18px]" />
								) : (
									<CircleDashed className="size-[18px]" />
								)}
							</span>
							<div className="min-w-0 flex-1">
								<div className="text-sm font-bold">{tv(r.document_type)}</div>
								{r.document ? (
									<Link
										to={`/documents/${land.name}?doc=${r.document.name}`}
										className="block truncate text-xs font-medium text-primary hover:underline"
										dir="auto"
									>
										{r.document.title}
										{r.document.reference_no && (
											<span className="text-muted-foreground"> · {r.document.reference_no}</span>
										)}
										{r.document.document_date && (
											<span className="text-muted-foreground">
												{" "}
												· {formatDate(r.document.document_date)}
											</span>
										)}
									</Link>
								) : (
									<div className="text-xs text-muted-foreground">{t("Not in the library yet")}</div>
								)}
							</div>
							{!r.document && land.can_write && (
								<Button size="sm" variant="outline" onClick={() => setUploadType(r.document_type)}>
									<Upload />
									{t("Upload")}
								</Button>
							)}
						</li>
					))}
				</ul>
			</CardBody>
			<UploadDocumentDialog
				open={uploadType !== null}
				onOpenChange={(o) => !o && setUploadType(null)}
				land={land.name}
				defaultType={uploadType ?? undefined}
				linkTo={{ doctype: "Sijil Land", name: land.name }}
			/>
		</Card>
	);
}
