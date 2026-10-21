import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
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
import { casesApi, type CaseDetail } from "./api";

const RELATION_TYPES = ["Related", "Depends On", "Blocks", "Duplicate Of", "Follows"];

const schema = z
	.object({
		title: z.string().trim().min(1),
		land: z
			.string()
			.nullable()
			.refine((v) => Boolean(v)),
		reference_no: z.string().optional(),
		case_type: z.string().optional(),
		status: z.string(),
		priority: z.string(),
		owner_user: z.string().nullable(),
		external_organization: z.string().nullable(),
		external_contact: z.string().nullable(),
		start_date: z.string().optional(),
		target_date: z.string().optional(),
		description: z.string().optional(),
		current_situation: z.string().optional(),
		relations: z.array(z.object({ related_case: z.string().nullable(), relation_type: z.string() })),
	})
	.refine((v) => !v.start_date || !v.target_date || v.target_date >= v.start_date, { path: ["target_date"] });
type Values = z.infer<typeof schema>;

function defaults(c: CaseDetail | undefined, land: string | undefined, me: string): Values {
	return {
		title: c?.title ?? "",
		land: c?.land ?? land ?? null,
		reference_no: c?.reference_no ?? "",
		case_type: c?.case_type ?? "",
		status: c?.status ?? "Not Started",
		priority: c?.priority ?? "Medium",
		owner_user: c?.owner_user ?? me,
		external_organization: c?.external_organization ?? null,
		external_contact: c?.external_contact ?? null,
		start_date: c?.start_date ?? "",
		target_date: c?.target_date ?? "",
		description: c?.description ?? "",
		current_situation: c?.current_situation ?? "",
		relations: c?.relations.map((r) => ({ related_case: r.related_case, relation_type: r.relation_type })) ?? [],
	};
}

export function CaseFormDialog({
	open,
	onOpenChange,
	caseDoc,
	defaultLand,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	caseDoc?: CaseDetail;
	defaultLand?: string;
}) {
	const { boot } = useBoot();
	const navigate = useNavigate();
	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: defaults(caseDoc, defaultLand, boot.user.name),
	});
	const relations = useFieldArray({ control: form.control, name: "relations" });
	const land = form.watch("land");

	React.useEffect(() => {
		if (open) form.reset(defaults(caseDoc, defaultLand, boot.user.name));
	}, [open, caseDoc, defaultLand, boot.user.name, form]);

	const save = useApiMutation(casesApi.save, {
		invalidate: DOMAIN,
		success: caseDoc ? t("Saved") : t("Case created"),
		onSuccess: (res) => {
			onOpenChange(false);
			if (!caseDoc) navigate(`/cases/${res.name}`);
		},
	});

	const submit = form.handleSubmit((v) =>
		save.mutate({
			name: caseDoc?.name,
			title: v.title.trim(),
			land: v.land ?? undefined,
			reference_no: v.reference_no,
			case_type: v.case_type || null,
			status: v.status,
			priority: v.priority,
			owner_user: v.owner_user,
			external_organization: v.external_organization,
			external_contact: v.external_contact,
			start_date: v.start_date || null,
			target_date: v.target_date || null,
			description: v.description,
			// The situation of an existing case changes only through a recorded development.
			...(caseDoc ? {} : { current_situation: v.current_situation }),
			relations: v.relations
				.filter((r) => r.related_case)
				.map((r) => ({ related_case: r.related_case!, relation_type: r.relation_type })),
		}),
	);

	const err = form.formState.errors;
	const required = t("This field is required.");
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="lg">
				<DialogHeader title={caseDoc ? t("Edit Case") : t("New Case")} />
				<form onSubmit={submit} className="contents" noValidate>
					<DialogBody>
						<div className="grid gap-4 sm:grid-cols-2">
							<Field
								label={t("Title")}
								required
								htmlFor="case_title"
								error={err.title && required}
								className="sm:col-span-2"
							>
								<Input
									id="case_title"
									dir="auto"
									aria-invalid={Boolean(err.title)}
									{...form.register("title")}
								/>
							</Field>
							<Field
								label={t("Land / Project")}
								required
								htmlFor="case_land"
								error={err.land && required}
								hint={caseDoc ? t("A case cannot be moved to another land.") : undefined}
							>
								<Controller
									control={form.control}
									name="land"
									render={({ field }) => (
										<LookupSelect
											id="case_land"
											doctype="Sijil Land"
											value={field.value}
											onChange={field.onChange}
											disabled={Boolean(caseDoc)}
											invalid={Boolean(err.land)}
										/>
									)}
								/>
							</Field>
							<Field label={t("Case Type")} htmlFor="case_type">
								<Select id="case_type" {...form.register("case_type")}>
									<option value="">—</option>
									{boot.case_types.map((ct) => (
										<option key={ct} value={ct}>
											{tv(ct)}
										</option>
									))}
								</Select>
							</Field>
							<Field label={t("Status")} htmlFor="case_status">
								<Select id="case_status" {...form.register("status")}>
									{boot.options.case_status.map((o) => (
										<option key={o} value={o}>
											{tv(o)}
										</option>
									))}
								</Select>
							</Field>
							<Field label={t("Priority")} htmlFor="case_priority">
								<Select id="case_priority" {...form.register("priority")}>
									{boot.options.priority.map((o) => (
										<option key={o} value={o}>
											{tv(o)}
										</option>
									))}
								</Select>
							</Field>
							<Field label={t("Internal Owner")} htmlFor="case_owner">
								<Controller
									control={form.control}
									name="owner_user"
									render={({ field }) => (
										<UserSelect
											id="case_owner"
											value={field.value}
											onChange={field.onChange}
											clearable={false}
										/>
									)}
								/>
							</Field>
							<Field label={t("Reference No")} htmlFor="case_ref">
								<Input id="case_ref" dir="auto" {...form.register("reference_no")} />
							</Field>
							<Field label={t("External Organization")} htmlFor="case_org">
								<Controller
									control={form.control}
									name="external_organization"
									render={({ field }) => (
										<LookupSelect
											id="case_org"
											doctype="Sijil External Organization"
											value={field.value}
											onChange={field.onChange}
										/>
									)}
								/>
							</Field>
							<Field label={t("External Contact")} htmlFor="case_contact">
								<Controller
									control={form.control}
									name="external_contact"
									render={({ field }) => (
										<LookupSelect
											id="case_contact"
											doctype="Contact"
											value={field.value}
											onChange={field.onChange}
										/>
									)}
								/>
							</Field>
							<Field label={t("Start Date")} htmlFor="case_start">
								<Input id="case_start" type="date" {...form.register("start_date")} />
							</Field>
							<Field
								label={t("Target Date")}
								htmlFor="case_target"
								error={err.target_date && t("Target Date cannot be before Start Date.")}
							>
								<Input id="case_target" type="date" {...form.register("target_date")} />
							</Field>
							{!caseDoc && (
								<Field
									label={t("Current Situation")}
									htmlFor="case_situation"
									className="sm:col-span-2"
									hint={t(
										"Where things stand right now. Later changes are recorded as developments.",
									)}
								>
									<Textarea id="case_situation" {...form.register("current_situation")} />
								</Field>
							)}
							<Field label={t("Description")} htmlFor="case_description" className="sm:col-span-2">
								<Textarea id="case_description" {...form.register("description")} />
							</Field>
						</div>
						<fieldset className="space-y-2">
							<legend className="text-sm font-bold">{t("Related Cases")}</legend>
							{relations.fields.map((row, i) => (
								<div
									key={row.id}
									className="flex flex-col gap-2 rounded-md border border-border p-2 sm:flex-row sm:items-center sm:border-0 sm:p-0"
								>
									<Select
										className="sm:w-44"
										aria-label={t("Relation")}
										{...form.register(`relations.${i}.relation_type`)}
									>
										{RELATION_TYPES.map((r) => (
											<option key={r} value={r}>
												{tv(r)}
											</option>
										))}
									</Select>
									<div className="flex-1">
										<Controller
											control={form.control}
											name={`relations.${i}.related_case`}
											render={({ field }) => (
												<LookupSelect
													doctype="Sijil Case"
													filters={land ? { land } : undefined}
													value={field.value}
													onChange={field.onChange}
													placeholder={t("Case")}
												/>
											)}
										/>
									</div>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => relations.remove(i)}
										aria-label={t("Remove")}
									>
										<Trash2 />
									</Button>
								</div>
							))}
							<Button
								variant="outline"
								size="sm"
								onClick={() => relations.append({ related_case: null, relation_type: "Related" })}
							>
								<Plus />
								{t("Add related case")}
							</Button>
						</fieldset>
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
