import { EmptyState } from "@/components/states";
import { Card, CardBody, CardHeader } from "@/components/ui/layout";
import type { CaseDetail } from "@/features/cases/api";
import { t } from "@/i18n";
import { DocumentChip } from "./DocumentChip";

/** Documents linked to the case itself (documents on its events are shown in the history). */
export function CaseDocuments({ caseDoc }: { caseDoc: CaseDetail }) {
	return (
		<Card>
			<CardHeader title={t("Case documents")} />
			<CardBody>
				{caseDoc.documents.length === 0 ? (
					<EmptyState title={t("No documents linked to this case")} />
				) : (
					<div className="flex flex-wrap gap-2">
						{caseDoc.documents.map((d) => (
							<DocumentChip key={d.link} doc={d} />
						))}
					</div>
				)}
			</CardBody>
		</Card>
	);
}
