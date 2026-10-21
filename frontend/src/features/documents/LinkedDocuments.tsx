import { Upload, X } from "lucide-react";
import * as React from "react";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/layout";
import { t } from "@/i18n";
import { useApiMutation } from "@/lib/api/hooks";
import { DOMAIN } from "@/lib/api/keys";
import type { LinkableDoctype, LinkedDocument } from "@/lib/api/types";
import { documentsApi } from "./api";
import { DocumentPicker } from "./AttachDocuments";
import { DocumentChip } from "./DocumentChip";
import { UploadDocumentDialog } from "./UploadDocumentDialog";

/** Documents linked to a land, case, task or follow-up, with link / upload / unlink. */
export function LinkedDocuments({
	land,
	doctype,
	name,
	documents,
	canWrite,
	title,
}: {
	land: string;
	doctype: LinkableDoctype;
	name: string;
	documents: LinkedDocument[];
	canWrite: boolean;
	title?: string;
}) {
	const [uploading, setUploading] = React.useState(false);
	const linkDoc = useApiMutation(
		(p: { document: string; version?: string }) =>
			documentsApi.link(p.document, doctype, name, { document_version: p.version }),
		{
			invalidate: DOMAIN,
			success: t("Document linked"),
		},
	);
	const unlink = useApiMutation(documentsApi.unlink, { invalidate: DOMAIN, success: t("Document unlinked") });
	return (
		<Card>
			<CardHeader
				title={title ?? t("Documents")}
				action={
					canWrite && (
						<span className="flex gap-2">
							<DocumentPicker
								land={land}
								exclude={documents.map((d) => d.document)}
								onPick={(d) => linkDoc.mutate({ document: d.document, version: d.version })}
								label={t("Link")}
							/>
							<Button variant="outline" size="sm" onClick={() => setUploading(true)}>
								<Upload />
								{t("Upload")}
							</Button>
						</span>
					)
				}
			/>
			<CardBody>
				{documents.length === 0 ? (
					<EmptyState title={t("No documents linked yet")} className="py-6" />
				) : (
					<div className="flex flex-wrap gap-2">
						{documents.map((d) => (
							<DocumentChip
								key={d.link}
								doc={d}
								action={
									canWrite && (
										<button
											type="button"
											className="text-muted-foreground hover:text-danger"
											aria-label={t("Unlink {0}", d.title)}
											onClick={() => unlink.mutate(d.link)}
										>
											<X className="size-3.5" />
										</button>
									)
								}
							/>
						))}
					</div>
				)}
			</CardBody>
			<UploadDocumentDialog open={uploading} onOpenChange={setUploading} land={land} linkTo={{ doctype, name }} />
		</Card>
	);
}
