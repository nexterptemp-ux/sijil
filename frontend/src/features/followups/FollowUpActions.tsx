import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n";
import type { FollowUp } from "@/lib/api/types";

/** Actions on a follow-up. The completion flow is added with the follow-ups slice (F5). */
export function FollowUpActions({ followup }: { followup: FollowUp; compact?: boolean }) {
	if (!followup.case) return null;
	return (
		<Button asChild variant="outline" size="sm">
			<Link to={`/cases/${followup.case}`}>{t("Open case")}</Link>
		</Button>
	);
}
