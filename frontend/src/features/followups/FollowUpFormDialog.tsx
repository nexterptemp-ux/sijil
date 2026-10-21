import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useBoot } from "@/app/boot";
import { Field, LookupSelect, UserSelect } from "@/components/fields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Input, Select, Textarea } from "@/components/ui/input";
import { t, tv } from "@/i18n";
import { useApiMutation } from "@/lib/api/hooks";
import { addDays } from "@/lib/format";
import { DOMAIN } from "@/lib/api/keys";
import type { FollowUp } from "@/lib/api/types";
import { followupsApi } from "./api";

const schema = z
	.object({
		title: z.string().trim().min(1),
		description: z.string().optional(),
		case: z.string().nullable(),
		land: z.string().nullable(),
		assigned_to: z.string().nullable(),
		due_date: z.string().min(1),
		priority: z.string(),
		reminder_days_before: z.string().optional(),
	})
	.refine((v) => v.case || v.land, { path: ["land"] });
type Values = z.infer<typeof schema>;

export interface FollowUpPrefill {
	case?: string | null;
	case_title?: string | null;
	land?: string | null;
	land_name?: string | null;
	originating_event?: string | null;
	title?: string;
}

/** Plan a new follow-up (from a case, a land or the follow-ups centre) or edit an open one. */
export function FollowUpFormDialog({
	open,
	onOpenChange,
	followup,
	prefill,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	followup?: FollowUp;
	prefill?: FollowUpPrefill;
}) {
	const { boot } = useBoot();
	const initial = React.useCallback(
		(): Values => ({
			title: followup?.title ?? prefill?.title ?? "",
			description: followup?.description ?? "",
			case: followup?.case ?? prefill?.case ?? null,
			land: followup?.land ?? prefill?.land ?? null,
			assigned_to: followup?.assigned_to ?? boot.user.name,
			due_date: followup?.due_date ?? addDays(boot.today, 7),
			priority: followup?.priority ?? "Medium",
			reminder_days_before: String(boot.settings.default_reminder_days ?? 1),
		}),
		[followup, prefill, boot],
	);
	const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: initial() });
	React.useEffect(() => {
		if (open) form.reset(initial());
	}, [open, initial, form]);

	const save = useApiMutation(followupsApi.save, {
		invalidate: DOMAIN,
		success: followup ? t("Saved") : t("Follow-up planned"),
		onSuccess: () => onOpenChange(false),
	});
	const caseFixed = Boolean(prefill?.case || followup);
	const landValue = form.watch("land");

	const submit = form.handleSubmit((v) =>
		save.mutate({
			name: followup?.name,
			title: v.title.trim(),
			description: v.description,
			case: v.case,
			land: v.land,
			assigned_to: v.assigned_to,
			due_date: v.due_date,
			priority: v.priority as FollowUp["priority"],
			originating_event: prefill?.originating_event ?? undefined,
			reminder_days_before: v.reminder_days_before === "" ? null : Number(v.reminder_days_before),
		}),
	);
	const err = form.formState.errors;
	const required = t("This field is required.");
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader
					title={followup ? t("Edit follow-up") : t("Plan a follow-up")}
					description={t("Something that must be checked or progressed by a date.")}
				/>
				<form onSubmit={submit} className="contents" noValidate>
					<DialogBody>
						<Field label={t("Title")} required htmlFor="fu_title" error={err.title && required}>
							<Input
								id="fu_title"
								dir="auto"
								aria-invalid={Boolean(err.title)}
								placeholder={t("e.g. Follow up on obtaining the formal approval")}
								{...form.register("title")}
							/>
						</Field>
						{caseFixed ? (
							(prefill?.case_title || followup?.case_title) && (
								<p className="text-sm">
									<span className="text-muted-foreground">{t("Case")}: </span>
									<span className="font-medium" dir="auto">
										{prefill?.case_title || followup?.case_title}
									</span>
								</p>
							)
						) : (
							<div className="grid gap-4 sm:grid-cols-2">
								<Field
									label={t("Land / Project")}
									required
									htmlFor="fu_land"
									error={err.land && t("Choose a case or a land / project.")}
								>
									<Controller
										control={form.control}
										name="land"
										render={({ field }) => (
											<LookupSelect
												id="fu_land"
												doctype="Sijil Land"
												value={field.value}
												label={prefill?.land === field.value ? prefill?.land_name : undefined}
												onChange={(v) => {
													field.onChange(v);
													form.setValue("case", null);
												}}
											/>
										)}
									/>
								</Field>
								<Field label={t("Case")} htmlFor="fu_case">
									<Controller
										control={form.control}
										name="case"
										render={({ field }) => (
											<LookupSelect
												id="fu_case"
												doctype="Sijil Case"
												filters={landValue ? { land: landValue } : undefined}
												value={field.value}
												onChange={field.onChange}
											/>
										)}
									/>
								</Field>
							</div>
						)}
						<div className="grid gap-4 sm:grid-cols-2">
							<Field label={t("Assigned To")} required htmlFor="fu_assignee">
								<Controller
									control={form.control}
									name="assigned_to"
									render={({ field }) => (
										<UserSelect
											id="fu_assignee"
											value={field.value}
											onChange={field.onChange}
											clearable={false}
										/>
									)}
								/>
							</Field>
							<Field label={t("Due Date")} required htmlFor="fu_due" error={err.due_date && required}>
								<Input id="fu_due" type="date" {...form.register("due_date")} />
							</Field>
							<Field label={t("Priority")} htmlFor="fu_priority">
								<Select id="fu_priority" {...form.register("priority")}>
									{boot.options.priority.map((o) => (
										<option key={o} value={o}>
											{tv(o)}
										</option>
									))}
								</Select>
							</Field>
							{!followup && (
								<Field label={t("Remind days before")} htmlFor="fu_remind">
									<Input
										id="fu_remind"
										type="number"
										min={0}
										max={30}
										{...form.register("reminder_days_before")}
									/>
								</Field>
							)}
						</div>
						<Field label={t("Description")} htmlFor="fu_desc">
							<Textarea id="fu_desc" {...form.register("description")} />
						</Field>
					</DialogBody>
					<DialogFooter>
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							{t("Cancel")}
						</Button>
						<Button type="submit" disabled={save.isPending}>
							{save.isPending ? t("Saving...") : followup ? t("Save") : t("Plan follow-up")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
