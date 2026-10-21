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
import { Checkbox, Input, Select, Textarea } from "@/components/ui/input";
import { t, tv } from "@/i18n";
import { useApiMutation } from "@/lib/api/hooks";
import { DOMAIN } from "@/lib/api/keys";
import { landsApi, type Land } from "./api";

const schema = z.object({
	land_name: z.string().trim().min(1, "required"),
	land_code: z.string().optional(),
	status: z.string(),
	city: z.string().optional(),
	company: z.string().nullable().optional(),
	project: z.string().nullable().optional(),
	location: z.string().optional(),
	description: z.string().optional(),
	notes: z.string().optional(),
	create_project: z.boolean().optional(),
	responsibles: z.array(z.object({ user: z.string().nullable(), responsibility: z.string().optional() })),
	organizations: z.array(z.object({ organization: z.string().nullable(), role: z.string().optional() })),
});
type Values = z.infer<typeof schema>;

function defaults(land?: Land): Values {
	return {
		land_name: land?.land_name ?? "",
		land_code: land?.land_code ?? "",
		status: land?.status ?? "Active",
		city: land?.city ?? "",
		company: land?.company ?? null,
		project: land?.project ?? null,
		location: land?.location ?? "",
		description: land?.description ?? "",
		notes: land?.notes ?? "",
		create_project: false,
		responsibles: land?.responsibles.map((r) => ({ user: r.user, responsibility: r.responsibility ?? "" })) ?? [],
		organizations: land?.organizations.map((o) => ({ organization: o.organization, role: o.role ?? "" })) ?? [],
	};
}

export function LandFormDialog({
	open,
	onOpenChange,
	land,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	land?: Land;
}) {
	const { boot } = useBoot();
	const navigate = useNavigate();
	const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults(land) });
	const responsibles = useFieldArray({ control: form.control, name: "responsibles" });
	const organizations = useFieldArray({ control: form.control, name: "organizations" });

	React.useEffect(() => {
		if (open) form.reset(defaults(land));
	}, [open, land, form]);

	const save = useApiMutation(landsApi.save, {
		invalidate: DOMAIN,
		success: land ? t("Saved") : t("Land / Project created"),
		onSuccess: (res) => {
			onOpenChange(false);
			if (!land) navigate(`/lands/${res.name}`);
		},
	});

	const submit = form.handleSubmit((v) =>
		save.mutate({
			name: land?.name,
			land_name: v.land_name.trim(),
			land_code: v.land_code,
			status: v.status,
			city: v.city,
			company: v.company,
			project: v.project,
			location: v.location,
			description: v.description,
			notes: v.notes,
			create_project: !land && v.create_project ? 1 : 0,
			responsibles: v.responsibles
				.filter((r) => r.user)
				.map((r) => ({ user: r.user!, responsibility: r.responsibility })),
			organizations: v.organizations
				.filter((o) => o.organization)
				.map((o) => ({ organization: o.organization!, role: o.role })),
		}),
	);

	const err = form.formState.errors;
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="lg">
				<DialogHeader title={land ? t("Edit Land / Project") : t("New Land / Project")} />
				<form onSubmit={submit} className="contents" noValidate>
					<DialogBody>
						<div className="grid gap-4 sm:grid-cols-2">
							<Field
								label={t("Land / Project Name")}
								required
								htmlFor="land_name"
								error={err.land_name && t("This field is required.")}
								className="sm:col-span-2"
							>
								<Input
									id="land_name"
									dir="auto"
									aria-invalid={Boolean(err.land_name)}
									{...form.register("land_name")}
								/>
							</Field>
							<Field label={t("Code")} htmlFor="land_code">
								<Input id="land_code" dir="auto" {...form.register("land_code")} />
							</Field>
							<Field label={t("Status")} htmlFor="land_status">
								<Select id="land_status" {...form.register("status")}>
									{boot.options.land_status.map((s) => (
										<option key={s} value={s}>
											{tv(s)}
										</option>
									))}
								</Select>
							</Field>
							<Field label={t("City")} htmlFor="land_city">
								<Input id="land_city" dir="auto" {...form.register("city")} />
							</Field>
							<Field label={t("Company")} htmlFor="land_company">
								<Controller
									control={form.control}
									name="company"
									render={({ field }) => (
										<LookupSelect
											id="land_company"
											doctype="Company"
											value={field.value}
											onChange={field.onChange}
										/>
									)}
								/>
							</Field>
							<Field label={t("Location")} htmlFor="land_location" className="sm:col-span-2">
								<Input id="land_location" dir="auto" {...form.register("location")} />
							</Field>
							<Field label={t("Description")} htmlFor="land_description" className="sm:col-span-2">
								<Textarea id="land_description" {...form.register("description")} />
							</Field>
							<Field
								label={t("ERPNext Project")}
								htmlFor="land_project"
								hint={
									land
										? undefined
										: t("Leave empty to create one automatically if enabled in settings.")
								}
							>
								<Controller
									control={form.control}
									name="project"
									render={({ field }) => (
										<LookupSelect
											id="land_project"
											doctype="Project"
											value={field.value}
											onChange={field.onChange}
										/>
									)}
								/>
							</Field>
							{!land && (
								<label className="flex items-center gap-2 self-end pb-2 text-sm">
									<Checkbox {...form.register("create_project")} />
									{t("Create an ERPNext project for this land")}
								</label>
							)}
						</div>

						<fieldset className="space-y-2">
							<legend className="text-sm font-bold">{t("Responsible Employees")}</legend>
							{responsibles.fields.map((row, i) => (
								<div
									key={row.id}
									className="flex flex-col gap-2 rounded-md border border-border p-2 sm:flex-row sm:items-center sm:border-0 sm:p-0"
								>
									<div className="sm:w-1/2">
										<Controller
											control={form.control}
											name={`responsibles.${i}.user`}
											render={({ field }) => (
												<UserSelect
													value={field.value}
													onChange={field.onChange}
													placeholder={t("Employee")}
												/>
											)}
										/>
									</div>
									<Input
										placeholder={t("Responsibility")}
										dir="auto"
										className="flex-1"
										aria-label={t("Responsibility")}
										{...form.register(`responsibles.${i}.responsibility`)}
									/>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => responsibles.remove(i)}
										aria-label={t("Remove")}
									>
										<Trash2 />
									</Button>
								</div>
							))}
							<Button
								variant="outline"
								size="sm"
								onClick={() => responsibles.append({ user: null, responsibility: "" })}
							>
								<Plus />
								{t("Add employee")}
							</Button>
						</fieldset>

						<fieldset className="space-y-2">
							<legend className="text-sm font-bold">{t("External Organizations")}</legend>
							{organizations.fields.map((row, i) => (
								<div
									key={row.id}
									className="flex flex-col gap-2 rounded-md border border-border p-2 sm:flex-row sm:items-center sm:border-0 sm:p-0"
								>
									<div className="sm:w-1/2">
										<Controller
											control={form.control}
											name={`organizations.${i}.organization`}
											render={({ field }) => (
												<LookupSelect
													doctype="Sijil External Organization"
													value={field.value}
													onChange={field.onChange}
													placeholder={t("Organization")}
												/>
											)}
										/>
									</div>
									<Input
										placeholder={t("Role")}
										dir="auto"
										className="flex-1"
										aria-label={t("Role")}
										{...form.register(`organizations.${i}.role`)}
									/>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => organizations.remove(i)}
										aria-label={t("Remove")}
									>
										<Trash2 />
									</Button>
								</div>
							))}
							<Button
								variant="outline"
								size="sm"
								onClick={() => organizations.append({ organization: null, role: "" })}
							>
								<Plus />
								{t("Add organization")}
							</Button>
						</fieldset>

						<Field label={t("Notes")} htmlFor="land_notes">
							<Textarea id="land_notes" {...form.register("notes")} />
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
