import type { CaseDetail } from "@/features/cases/api";
import { t } from "@/i18n";
import { LinkedDocuments } from "./LinkedDocuments";

/** Documents linked to the case itself (documents on its developments are shown in the history). */
export function CaseDocuments({ caseDoc }: { caseDoc: CaseDetail }) {
	return (
		<LinkedDocuments
			land={caseDoc.land}
			doctype="Sijil Case"
			name={caseDoc.name}
			documents={caseDoc.documents}
			canWrite={caseDoc.can_write}
			title={t("Case documents")}
		/>
	);
}
