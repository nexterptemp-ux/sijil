import { CalendarPlus } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import type { CaseDetail } from "@/features/cases/api";
import { t } from "@/i18n";
import { FollowUpFormDialog } from "./FollowUpFormDialog";

/** "Plan follow-up" for a case; the new follow-up starts from the case's latest development. */
export function PlanFollowUpButton({ caseDoc, variant = "default" }: { caseDoc: CaseDetail; variant?: "default" | "outline" }) {
	const [open, setOpen] = React.useState(false);
	return (
		<>
			<Button size="sm" variant={variant} onClick={() => setOpen(true)}>
				<CalendarPlus />
				{t("Plan follow-up")}
			</Button>
			<FollowUpFormDialog
				open={open}
				onOpenChange={setOpen}
				prefill={{
					case: caseDoc.name,
					case_title: caseDoc.title,
					land: caseDoc.land,
					land_name: caseDoc.land_name,
					originating_event: caseDoc.last_event?.name,
				}}
			/>
		</>
	);
}
