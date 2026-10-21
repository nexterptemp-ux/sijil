import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Building2, CalendarDays, ExternalLink, FileText, FolderKanban, ListChecks, Mail, RefreshCw, SquareCheck, User, Users, type LucideIcon } from "lucide-react";
import { useBoot } from "@/app/boot";
import { KeyValue, PageHeader } from "@/components/common";
import { QueryView } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardBody, CardHeader } from "@/components/ui/layout";
import { t } from "@/i18n";
import { useApiMutation } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";
import { integrationKeys, integrationsApi, type Integration } from "./api";

const ICONS: Record<string, LucideIcon> = {
	project: FolderKanban,
	task: ListChecks,
	todo: SquareCheck,
	calendar: CalendarDays,
	bell: Bell,
	mail: Mail,
	users: Users,
	file: FileText,
	user: User,
	building: Building2,
};

function describe(item: Integration): { title: string; text: string } {
	const s = item.stats;
	switch (item.key) {
		case "project":
			return { title: t("ERPNext Projects"), text: t("Lands link to an ERPNext Project ({0} of {1} linked).", s.linked_lands ?? 0, s.total_lands ?? 0) };
		case "auto_project":
			return { title: t("Create projects automatically"), text: t("A new land gets its own ERPNext Project.") };
		case "task":
			return { title: t("Two-way task sync"), text: t("Tasks on a land with a project are mirrored to ERPNext Tasks ({0} synced).", s.synced_tasks ?? 0) };
		case "todo":
			return { title: t("ToDo for assignees"), text: t("Follow-ups and tasks appear in the assignee's ERPNext ToDo list.") };
		case "calendar":
			return { title: t("Calendar"), text: t("Open follow-ups appear in the assignee's calendar.") };
		case "notifications":
			return { title: t("Reminders in the notification bell"), text: t("A daily job reminds assignees of follow-ups and tasks that are due soon, due today or overdue.") };
		case "email":
			return { title: t("Email reminders"), text: t("The same reminders are also sent by email.") };
		case "parties":
			return { title: t("Suppliers, customers and contacts"), text: t("External organizations can link to ERPNext suppliers, customers and contacts ({0} organizations).", s.organizations ?? 0) };
		case "files":
			return { title: t("Private files"), text: t("Every document version is a private ERPNext file ({0} versions).", s.versions ?? 0) };
		case "employees":
			return { title: t("Employees"), text: t("Responsible people are ERPNext users.") };
		case "company":
			return { title: t("Company"), text: s.default_company ? t("Default company: {0}", s.default_company) : t("No default company set.") };
		default:
			return { title: item.doctype, text: "" };
	}
}

export function SettingsPage() {
	const { boot } = useBoot();
	const qc = useQueryClient();
	const query = useQuery({ queryKey: integrationKeys.list, queryFn: integrationsApi.list });
	const toggle = useApiMutation(({ flag, value }: { flag: string; value: boolean }) => integrationsApi.set(flag, value), {
		success: t("Setting saved"),
		onSuccess: (items) => qc.setQueryData(integrationKeys.list, items),
	});
	const sync = useApiMutation(integrationsApi.linkPendingTasks, {
		invalidate: [integrationKeys.list, ["tasks"]],
		success: (r) => t("{0} tasks synced to ERPNext", r.synced),
	});
	const manager = boot.user.is_manager;

	return (
		<>
			<PageHeader
				title={t("Settings")}
				subtitle={manager ? t("ERPNext integration and general settings") : t("Only managers can change these settings.")}
				actions={
					manager && (
						<Button asChild variant="outline">
							<a href="/app/sijil-settings">
								<ExternalLink />
								{t("All settings in Desk")}
							</a>
						</Button>
					)
				}
			/>
			<div className="grid gap-6 lg:grid-cols-3">
				<div className="space-y-3 lg:col-span-2">
					<h2 className="text-sm font-bold text-muted-foreground">{t("ERPNext integration")}</h2>
					<QueryView query={query}>
						{(items) => (
							<ul className="space-y-2">
								{items.map((item) => {
									const Icon = ICONS[item.icon] ?? FileText;
									const d = describe(item);
									return (
										<li key={item.key}>
											<Card className="flex items-start gap-3 p-4">
												<Icon className={cn("mt-0.5 size-5 shrink-0", item.enabled ? "text-primary" : "text-muted-foreground")} aria-hidden />
												<div className="min-w-0 flex-1">
													<div className="flex flex-wrap items-center gap-2">
														<span className="font-semibold">{d.title}</span>
														<Badge tone={item.enabled ? "success" : "neutral"}>{item.enabled ? t("On") : t("Off")}</Badge>
														{!item.flag && <Badge>{t("Always on")}</Badge>}
													</div>
													<p className="mt-0.5 text-sm text-muted-foreground">{d.text}</p>
													{item.key === "task" && item.enabled && manager && (
														<Button variant="link" size="sm" className="mt-1" disabled={sync.isPending} onClick={() => sync.mutate(undefined)}>
															<RefreshCw />
															{t("Sync existing open tasks now")}
														</Button>
													)}
												</div>
												{item.flag && (
													<Switch
														label={d.title}
														checked={item.enabled}
														disabled={!manager || toggle.isPending}
														onChange={(value) => toggle.mutate({ flag: item.flag!, value })}
													/>
												)}
											</Card>
										</li>
									);
								})}
							</ul>
						)}
					</QueryView>
				</div>
				<div className="space-y-6">
					<Card>
						<CardHeader title={t("General")} />
						<CardBody>
							<dl className="divide-y divide-border">
								<KeyValue label={t("Cases count as stale after (days)")}>{boot.settings.stale_case_days}</KeyValue>
								<KeyValue label={t("Default reminder (days before)")}>{boot.settings.default_reminder_days}</KeyValue>
								<KeyValue label={t("Restrict users to assigned lands")}>{boot.settings.restrict_to_assigned_lands ? t("Yes") : t("No")}</KeyValue>
							</dl>
							<p className="mt-3 text-xs text-muted-foreground">{t("These and the default folder template are edited in Sijil Settings in Desk.")}</p>
						</CardBody>
					</Card>
					<Card>
						<CardHeader title={t("Classic interface")} />
						<CardBody className="space-y-2 text-sm">
							<p className="text-muted-foreground">{t("The previous Sijil screen inside Desk stays available while the new app is being verified.")}</p>
							<a href="/app/sijil-app" className="inline-flex items-center gap-1 text-primary hover:underline">
								<ExternalLink className="size-3.5" aria-hidden />
								{t("Open the classic screen")}
							</a>
						</CardBody>
					</Card>
				</div>
			</div>
		</>
	);
}

function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={label}
			disabled={disabled}
			onClick={() => onChange(!checked)}
			className={cn(
				"relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
				checked ? "bg-primary" : "bg-input",
			)}
		>
			<span className={cn("inline-block size-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-5 rtl:-translate-x-5" : "translate-x-0.5 rtl:-translate-x-0.5")} />
		</button>
	);
}
