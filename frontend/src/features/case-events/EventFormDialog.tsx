import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useBoot } from "@/app/boot";
import { Field, LookupSelect } from "@/components/fields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/input";
import { casesApi, type CaseDetail, type CaseEvent, type EventInput } from "@/features/cases/api";
import { AttachDocuments, type AttachedDocument } from "@/features/documents/AttachDocuments";
import { t, tv } from "@/i18n";
import { useApiMutation } from "@/lib/api/hooks";
import { DOMAIN } from "@/lib/api/keys";

const schema = z.object({
	event_date: z.string().min(1),
	event_time: z.string().optional(),
	title: z.string().trim().min(1),
	event_type: z.string(),
	communication_method: z.string().optional(),
	external_organization: z.string().nullable(),
	description: z.string().optional(),
	outcome: z.string().optional(),
	is_milestone: z.boolean(),
	change_situation: z.boolean(),
	situation_update: z.string().optional(),
	status_after: z.string().optional(),
	reason: z.string().optional(),
});
type Values = z.infer<typeof schema>;

function stripHtml(html?: string | null) {
	if (!html) return "";
	const div = document.createElement("div");
	div.innerHTML = html;
	return div.textContent ?? "";
}

/**
 * Record a new development, or correct an existing one. A correction never edits the original:
 * the backend creates a new entry that supersedes it, so a reason is required.
 */
export function EventFormDialog({
	open,
	onOpenChange,
	caseDoc,
	correcting,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	caseDoc: Pick<CaseDetail, "name" | "land" | "external_organization" | "status" | "current_situation">;
	correcting?: CaseEvent | null;
}) {
	const { boot } = useBoot();
	const initial = React.useCallback(
		(): Values => ({
			event_date: correcting?.event_date ?? boot.today,
			event_time: correcting?.event_time?.slice(0, 5) ?? "",
			title: correcting?.title ?? "",
			event_type: correcting?.event_type ?? "Update",
			communication_method: correcting?.communication_method ?? "",
			external_organization: correcting ? (correcting.external_organization ?? null) : (caseDoc.external_organization ?? null),
			description: stripHtml(correcting?.description),
			outcome: correcting?.outcome ?? "",
			is_milestone: Boolean(correcting?.is_milestone),
			change_situation: false,
			situation_update: caseDoc.current_situation ?? "",
			status_after: "",
			reason: "",
		}),
		[correcting, caseDoc, boot.today],
	);
	const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: initial() });
	const [documents, setDocuments] = React.useState<AttachedDocument[]>([]);
	React.useEffect(() => {
		if (open) {
			form.reset(initial());
			setDocuments([]);
		}
	}, [open, initial, form]);

	const close = () => onOpenChange(false);
	const record = useApiMutation(casesApi.recordEvent, { invalidate: DOMAIN, success: t("Development recorded"), onSuccess: close });
	const correct = useApiMutation(
		({ name, data, reason }: { name: string; data: Partial<EventInput>; reason: string }) => casesApi.correctEvent(name, data, reason),
		{ invalidate: DOMAIN, success: t("Correction recorded"), onSuccess: close },
	);
	const pending = record.isPending || correct.isPending;
	const changeSituation = form.watch("change_situation");

	const submit = form.handleSubmit((v) => {
		if (v.event_date > boot.today) {
			form.setError("event_date", { message: "future" });
			return;
		}
		const data: EventInput = {
			case: caseDoc.name,
			event_date: v.event_date,
			event_time: v.event_time || undefined,
			title: v.title.trim(),
			event_type: v.event_type,
			communication_method: v.communication_method || undefined,
			external_organization: v.external_organization,
			description: v.description,
			outcome: v.outcome,
			is_milestone: v.is_milestone ? 1 : 0,
			situation_update: v.change_situation ? v.situation_update?.trim() : undefined,
			status_after: v.change_situation ? v.status_after || undefined : undefined,
			documents: documents.map((d) => ({ document: d.document, version: d.version })),
		};
		if (correcting) {
			const reason = (v.reason ?? "").trim();
			if (!reason) {
				form.setError("reason", { message: "required" });
				return;
			}
			const { case: _c, documents: _d, ...changes } = data;
			correct.mutate({ name: correcting.name, data: changes, reason });
		} else record.mutate(data);
	});

	const err = form.formState.errors;
	const required = t("This field is required.");
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="lg">
				<DialogHeader
					title={correcting ? t("Correct a development") : t("Record a development")}
					description={
						correcting
							? t("The original entry stays in the history, marked as corrected. Explain why it is being corrected.")
							: t("Record what actually happened. Use a follow-up for things that still need to happen.")
					}
				/>
				<form onSubmit={submit} className="contents" noValidate>
					<DialogBody>
						{correcting && (
							<Field label={t("Reason for correction")} required htmlFor="ev_reason" error={err.reason && required}>
								<Textarea id="ev_reason" rows={2} aria-invalid={Boolean(err.reason)} {...form.register("reason")} />
							</Field>
						)}
						<div className="grid gap-4 sm:grid-cols-2">
							<Field
								label={t("Actual date")}
								required
								htmlFor="ev_date"
								error={err.event_date && (err.event_date.message === "future" ? t("An event records something that already happened. Use a follow-up for future actions.") : required)}
							>
								<Input id="ev_date" type="date" max={boot.today} aria-invalid={Boolean(err.event_date)} {...form.register("event_date")} />
							</Field>
							<Field label={t("Time")} htmlFor="ev_time">
								<Input id="ev_time" type="time" {...form.register("event_time")} />
							</Field>
							<Field label={t("Title")} required htmlFor="ev_title" error={err.title && required} className="sm:col-span-2">
								<Input id="ev_title" dir="auto" aria-invalid={Boolean(err.title)} placeholder={t("e.g. The approval reached the Mayor's office")} {...form.register("title")} />
							</Field>
							<Field label={t("Type")} htmlFor="ev_type">
								<Select id="ev_type" {...form.register("event_type")}>
									{boot.options.event_type.map((o) => (
										<option key={o} value={o}>
											{tv(o)}
										</option>
									))}
								</Select>
							</Field>
							<Field label={t("Communication Method")} htmlFor="ev_method">
								<Select id="ev_method" {...form.register("communication_method")}>
									<option value="">—</option>
									{boot.options.communication_method.map((o) => (
										<option key={o} value={o}>
											{tv(o)}
										</option>
									))}
								</Select>
							</Field>
							<Field label={t("External Organization")} htmlFor="ev_org" className="sm:col-span-2">
								<Controller
									control={form.control}
									name="external_organization"
									render={({ field }) => <LookupSelect id="ev_org" doctype="Sijil External Organization" value={field.value} onChange={field.onChange} />}
								/>
							</Field>
							<Field label={t("Details")} htmlFor="ev_desc" className="sm:col-span-2">
								<Textarea id="ev_desc" rows={4} {...form.register("description")} />
							</Field>
							<Field label={t("Outcome")} htmlFor="ev_outcome" className="sm:col-span-2">
								<Input id="ev_outcome" dir="auto" {...form.register("outcome")} />
							</Field>
						</div>
						{!correcting && <AttachDocuments land={caseDoc.land} value={documents} onChange={setDocuments} />}
						{correcting && correcting.documents.length > 0 && (
							<p className="text-xs text-muted-foreground">{t("Documents linked to the original entry are carried over to the correction.")}</p>
						)}
						<label className="flex items-center gap-2 text-sm">
							<Checkbox {...form.register("is_milestone")} />
							{t("This is an important milestone")}
						</label>
						<div className="rounded-md border border-border p-3">
							<label className="flex items-center gap-2 text-sm font-semibold">
								<Checkbox {...form.register("change_situation")} />
								{t("Update the current situation of the case")}
							</label>
							{changeSituation && (
								<div className="mt-3 grid gap-3 sm:grid-cols-3">
									<Field label={t("New current situation")} htmlFor="ev_situation" className="sm:col-span-2">
										<Textarea id="ev_situation" rows={3} {...form.register("situation_update")} />
									</Field>
									<Field label={t("New status")} htmlFor="ev_status">
										<Select id="ev_status" {...form.register("status_after")}>
											<option value="">{t("Keep {0}", tv(caseDoc.status))}</option>
											{boot.options.case_status.map((o) => (
												<option key={o} value={o}>
													{tv(o)}
												</option>
											))}
										</Select>
									</Field>
								</div>
							)}
						</div>
					</DialogBody>
					<DialogFooter>
						<Button variant="outline" onClick={close}>
							{t("Cancel")}
						</Button>
						<Button type="submit" disabled={pending}>
							{pending ? t("Saving...") : correcting ? t("Record correction") : t("Record development")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
