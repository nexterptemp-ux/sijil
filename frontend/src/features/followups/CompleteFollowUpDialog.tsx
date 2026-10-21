import * as React from "react";
import { useBoot } from "@/app/boot";
import { Field, UserSelect } from "@/components/fields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/input";
import { AttachDocuments, type AttachedDocument } from "@/features/documents/AttachDocuments";
import { t, tv } from "@/i18n";
import { useApiMutation } from "@/lib/api/hooks";
import { DOMAIN } from "@/lib/api/keys";
import type { FollowUp } from "@/lib/api/types";
import { addDays } from "@/lib/format";
import { followupsApi, type CompleteFollowUpInput } from "./api";

/**
 * Complete a follow-up in one step: record the actual outcome (it becomes a development on the
 * case), optionally attach evidence, and optionally schedule the next follow-up. The backend does
 * this in one transaction and refuses a second completion, so a double click cannot duplicate it.
 */
export function CompleteFollowUpDialog({ open, onOpenChange, followup }: { open: boolean; onOpenChange: (o: boolean) => void; followup: FollowUp }) {
	const { boot } = useBoot();
	const [outcome, setOutcome] = React.useState("");
	const [eventType, setEventType] = React.useState("Contact");
	const [method, setMethod] = React.useState("");
	const [milestone, setMilestone] = React.useState(false);
	const [situation, setSituation] = React.useState("");
	const [scheduleNext, setScheduleNext] = React.useState(true);
	const [nextDate, setNextDate] = React.useState("");
	const [nextTitle, setNextTitle] = React.useState("");
	const [nextAssignee, setNextAssignee] = React.useState<string | null>(null);
	const [documents, setDocuments] = React.useState<AttachedDocument[]>([]);
	const [touched, setTouched] = React.useState(false);

	React.useEffect(() => {
		if (!open) return;
		setOutcome("");
		setEventType("Contact");
		setMethod("");
		setMilestone(false);
		setSituation("");
		setScheduleNext(true);
		setNextDate(addDays(boot.today, 7));
		setNextTitle(followup.title);
		setNextAssignee(followup.assigned_to);
		setDocuments([]);
		setTouched(false);
	}, [open, followup, boot.today]);

	const complete = useApiMutation((input: CompleteFollowUpInput) => followupsApi.complete(input), {
		invalidate: DOMAIN,
		success: (r) => (r.next_followup ? t("Follow-up completed and the next one is planned") : t("Follow-up completed")),
		onSuccess: () => onOpenChange(false),
	});

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		setTouched(true);
		if (!outcome.trim() || (scheduleNext && !nextDate) || complete.isPending) return;
		complete.mutate({
			name: followup.name,
			outcome: outcome.trim(),
			event: followup.case
				? {
						event_type: eventType,
						communication_method: method || undefined,
						is_milestone: milestone ? 1 : 0,
						situation_update: situation.trim() || undefined,
					}
				: undefined,
			next_followup: scheduleNext ? { due_date: nextDate, title: nextTitle.trim() || undefined, assigned_to: nextAssignee || undefined } : null,
			documents: documents.map((d) => ({ document: d.document, version: d.version })),
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="lg">
				<DialogHeader title={t("Complete follow-up")} description={followup.title} />
				<form onSubmit={submit} className="contents" noValidate>
					<DialogBody>
						<Field
							label={t("What actually happened?")}
							required
							htmlFor="fu_outcome"
							error={touched && !outcome.trim() ? t("Please describe the actual outcome — even if there was no progress.") : undefined}
							hint={followup.case ? t("This is recorded as a development in the case history.") : undefined}
						>
							<Textarea id="fu_outcome" rows={4} value={outcome} onChange={(e) => setOutcome(e.target.value)} aria-invalid={touched && !outcome.trim()} autoFocus />
						</Field>
						{followup.case && (
							<>
								<div className="grid gap-4 sm:grid-cols-2">
									<Field label={t("Type")} htmlFor="fu_ev_type">
										<Select id="fu_ev_type" value={eventType} onChange={(e) => setEventType(e.target.value)}>
											{boot.options.event_type.map((o) => (
												<option key={o} value={o}>
													{tv(o)}
												</option>
											))}
										</Select>
									</Field>
									<Field label={t("Communication Method")} htmlFor="fu_ev_method">
										<Select id="fu_ev_method" value={method} onChange={(e) => setMethod(e.target.value)}>
											<option value="">—</option>
											{boot.options.communication_method.map((o) => (
												<option key={o} value={o}>
													{tv(o)}
												</option>
											))}
										</Select>
									</Field>
								</div>
								<label className="flex items-center gap-2 text-sm">
									<Checkbox checked={milestone} onChange={(e) => setMilestone(e.target.checked)} />
									{t("This is an important milestone")}
								</label>
								<Field label={t("New current situation (optional)")} htmlFor="fu_situation">
									<Textarea id="fu_situation" rows={2} value={situation} onChange={(e) => setSituation(e.target.value)} />
								</Field>
								{followup.land && <AttachDocuments land={followup.land} value={documents} onChange={setDocuments} />}
							</>
						)}
						<div className="rounded-md border border-border p-3">
							<label className="flex items-center gap-2 text-sm font-semibold">
								<Checkbox checked={scheduleNext} onChange={(e) => setScheduleNext(e.target.checked)} />
								{t("Schedule the next follow-up")}
							</label>
							{scheduleNext && (
								<div className="mt-3 grid gap-3 sm:grid-cols-2">
									<Field label={t("Title")} htmlFor="fu_next_title" className="sm:col-span-2">
										<Input id="fu_next_title" dir="auto" value={nextTitle} onChange={(e) => setNextTitle(e.target.value)} />
									</Field>
									<Field label={t("Due Date")} required htmlFor="fu_next_date" error={touched && !nextDate ? t("This field is required.") : undefined}>
										<Input id="fu_next_date" type="date" min={boot.today} value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
									</Field>
									<Field label={t("Assigned To")} htmlFor="fu_next_assignee">
										<UserSelect id="fu_next_assignee" value={nextAssignee} onChange={setNextAssignee} clearable={false} />
									</Field>
								</div>
							)}
						</div>
					</DialogBody>
					<DialogFooter>
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							{t("Cancel")}
						</Button>
						<Button type="submit" disabled={complete.isPending}>
							{complete.isPending ? t("Saving...") : t("Complete follow-up")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
