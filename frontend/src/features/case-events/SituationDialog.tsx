import * as React from "react";
import { useBoot } from "@/app/boot";
import { Field } from "@/components/fields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Select, Textarea } from "@/components/ui/input";
import { casesApi, type CaseDetail } from "@/features/cases/api";
import { t, tv } from "@/i18n";
import { useApiMutation } from "@/lib/api/hooks";
import { DOMAIN } from "@/lib/api/keys";

/** Quick update of the current situation. It is still recorded as an "Update" development. */
export function SituationDialog({
	open,
	onOpenChange,
	caseDoc,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	caseDoc: CaseDetail;
}) {
	const { boot } = useBoot();
	const [text, setText] = React.useState("");
	const [status, setStatus] = React.useState("");
	React.useEffect(() => {
		if (open) {
			setText(caseDoc.current_situation ?? "");
			setStatus("");
		}
	}, [open, caseDoc.current_situation]);
	const save = useApiMutation(() => casesApi.updateSituation(caseDoc.name, text.trim(), status || undefined), {
		invalidate: DOMAIN,
		success: t("Current situation updated"),
		onSuccess: () => onOpenChange(false),
	});
	const unchanged = text.trim() === (caseDoc.current_situation ?? "").trim() && !status;
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader
					title={t("Update current situation")}
					description={t("The change is added to the case history as a development.")}
				/>
				<DialogBody>
					<Field label={t("Current Situation")} required htmlFor="sit_text">
						<Textarea id="sit_text" rows={5} value={text} onChange={(e) => setText(e.target.value)} />
					</Field>
					<Field label={t("Status")} htmlFor="sit_status">
						<Select id="sit_status" value={status} onChange={(e) => setStatus(e.target.value)}>
							<option value="">{t("Keep {0}", tv(caseDoc.status))}</option>
							{boot.options.case_status.map((o) => (
								<option key={o} value={o}>
									{tv(o)}
								</option>
							))}
						</Select>
					</Field>
				</DialogBody>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("Cancel")}
					</Button>
					<Button
						disabled={!text.trim() || unchanged || save.isPending}
						onClick={() => save.mutate(undefined)}
					>
						{save.isPending ? t("Saving...") : t("Save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
