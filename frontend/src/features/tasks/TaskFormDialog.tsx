import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useBoot } from "@/app/boot";
import { Field, LookupSelect, UserSelect } from "@/components/fields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Input, Select, Textarea } from "@/components/ui/input";
import { t, tv } from "@/i18n";
import { useApiMutation } from "@/lib/api/hooks";
import { DOMAIN } from "@/lib/api/keys";
import type { Priority, TaskStatus } from "@/lib/api/types";
import { tasksApi, type TaskDetail } from "./api";

const schema = z
	.object({
		title: z.string().trim().min(1),
		description: z.string().optional(),
		land: z.string().nullable(),
		case: z.string().nullable(),
		assigned_to: z.string().nullable(),
		priority: z.string(),
		status: z.string(),
		start_date: z.string().optional(),
		due_date: z.string().optional(),
	})
	.refine((v) => !v.start_date || !v.due_date || v.due_date >= v.start_date, { path: ["due_date"] });
type Values = z.infer<typeof schema>;

export interface TaskPrefill {
	land?: string | null;
	land_name?: string | null;
	case?: string | null;
	case_title?: string | null;
}

/** Tasks are ordinary work: a land or case is optional. */
export function TaskFormDialog({
	open,
	onOpenChange,
	task,
	prefill,
	navigateOnCreate = true,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	task?: TaskDetail;
	prefill?: TaskPrefill;
	navigateOnCreate?: boolean;
}) {
	const { boot } = useBoot();
	const navigate = useNavigate();
	const initial = React.useCallback(
		(): Values => ({
			title: task?.title ?? "",
			description: task?.description ?? "",
			land: task?.land ?? prefill?.land ?? null,
			case: task?.case ?? prefill?.case ?? null,
			assigned_to: task?.assigned_to ?? boot.user.name,
			priority: task?.priority ?? "Medium",
			status: task?.status ?? "Open",
			start_date: task?.start_date ?? "",
			due_date: task?.due_date ?? "",
		}),
		[task, prefill, boot.user.name],
	);
	const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: initial() });
	React.useEffect(() => {
		if (open) form.reset(initial());
	}, [open, initial, form]);
	const land = form.watch("land");

	const save = useApiMutation(tasksApi.save, {
		invalidate: DOMAIN,
		success: task ? t("Saved") : t("Task created"),
		onSuccess: (r) => {
			onOpenChange(false);
			if (!task && navigateOnCreate) navigate(`/tasks/${r.name}`);
		},
	});

	const submit = form.handleSubmit((v) =>
		save.mutate({
			name: task?.name,
			title: v.title.trim(),
			description: v.description,
			land: v.land,
			case: v.case,
			assigned_to: v.assigned_to,
			priority: v.priority as Priority,
			status: v.status as TaskStatus,
			start_date: v.start_date || null,
			due_date: v.due_date || null,
		}),
	);
	const err = form.formState.errors;
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader title={task ? t("Edit task") : t("New Task")} />
				<form onSubmit={submit} className="contents" noValidate>
					<DialogBody>
						<Field label={t("Title")} required htmlFor="task_title" error={err.title && t("This field is required.")}>
							<Input id="task_title" dir="auto" aria-invalid={Boolean(err.title)} placeholder={t("e.g. Prepare a presentation for management")} {...form.register("title")} />
						</Field>
						<div className="grid gap-4 sm:grid-cols-2">
							<Field label={t("Land / Project")} htmlFor="task_land" hint={t("Optional")}>
								<Controller
									control={form.control}
									name="land"
									render={({ field }) => (
										<LookupSelect
											id="task_land"
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
							<Field label={t("Case")} htmlFor="task_case" hint={t("Optional")}>
								<Controller
									control={form.control}
									name="case"
									render={({ field }) => (
										<LookupSelect
											id="task_case"
											doctype="Sijil Case"
											filters={land ? { land } : undefined}
											value={field.value}
											label={prefill?.case === field.value ? prefill?.case_title : undefined}
											onChange={field.onChange}
										/>
									)}
								/>
							</Field>
							<Field label={t("Assigned To")} required htmlFor="task_user">
								<Controller control={form.control} name="assigned_to" render={({ field }) => <UserSelect id="task_user" value={field.value} onChange={field.onChange} clearable={false} />} />
							</Field>
							<Field label={t("Priority")} htmlFor="task_priority">
								<Select id="task_priority" {...form.register("priority")}>
									{boot.options.priority.map((o) => (
										<option key={o} value={o}>
											{tv(o)}
										</option>
									))}
								</Select>
							</Field>
							<Field label={t("Start Date")} htmlFor="task_start">
								<Input id="task_start" type="date" {...form.register("start_date")} />
							</Field>
							<Field label={t("Due Date")} htmlFor="task_due" error={err.due_date && t("Due Date cannot be before Start Date.")}>
								<Input id="task_due" type="date" {...form.register("due_date")} />
							</Field>
							{task && (
								<Field label={t("Status")} htmlFor="task_status">
									<Select id="task_status" {...form.register("status")}>
										{boot.options.task_status.map((o) => (
											<option key={o} value={o}>
												{tv(o)}
											</option>
										))}
									</Select>
								</Field>
							)}
						</div>
						<Field label={t("Description")} htmlFor="task_desc">
							<Textarea id="task_desc" rows={4} {...form.register("description")} />
						</Field>
					</DialogBody>
					<DialogFooter>
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							{t("Cancel")}
						</Button>
						<Button type="submit" disabled={save.isPending}>
							{save.isPending ? t("Saving...") : t("Save")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
