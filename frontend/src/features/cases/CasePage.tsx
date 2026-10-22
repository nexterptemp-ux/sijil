import { useQuery } from "@tanstack/react-query";
import {
	Briefcase,
	Building2,
	CalendarClock,
	Clock,
	FileBarChart,
	GitBranch,
	Info,
	MoreHorizontal,
	Pencil,
	Plus,
	Quote,
	RefreshCw,
	UserRound,
} from "lucide-react";
import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { useBoot } from "@/app/boot";
import { BackIcon, KeyValue, Person, RichText } from "@/components/common";
import { EmptyState, LoadingRows, QueryView } from "@/components/states";
import { CaseStatusBadge, PriorityBadge, StateBadge } from "@/components/status";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/menu";
import { Badge, Card, CardBody, CardHeader, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/layout";
import { EventFormDialog } from "@/features/case-events/EventFormDialog";
import { EventTimeline } from "@/features/case-events/EventTimeline";
import { SituationDialog } from "@/features/case-events/SituationDialog";
import { CaseDocuments } from "@/features/documents/CaseDocuments";
import { FollowUpActions } from "@/features/followups/FollowUpActions";
import { FollowUpRow } from "@/features/followups/FollowUpRow";
import { PlanFollowUpButton } from "@/features/followups/PlanFollowUpButton";
import { CaseTasks } from "@/features/tasks/CaseTasks";
import { t, tv } from "@/i18n";
import { formatDate, formatDateTime, relativeDays } from "@/lib/format";
import { caseKeys, casesApi, type CaseDetail, type CaseEvent } from "./api";
import { CaseFormDialog } from "./CaseFormDialog";

export function CasePage() {
	const { name = "" } = useParams();
	const query = useQuery({ queryKey: caseKeys.detail(name), queryFn: () => casesApi.get(name) });
	return (
		<QueryView query={query} loading={<LoadingRows rows={6} />}>
			{(c) => <CaseWorkspace caseDoc={c} />}
		</QueryView>
	);
}

type DialogState =
	{ kind: "record" } | { kind: "correct"; event: CaseEvent } | { kind: "situation" } | { kind: "edit" } | null;

function CaseWorkspace({ caseDoc: c }: { caseDoc: CaseDetail }) {
	const { boot } = useBoot();
	const [dialog, setDialog] = React.useState<DialogState>(null);
	const close = (open: boolean) => !open && setDialog(null);
	const next = c.open_followups[0];

	return (
		<>
			<Link
				to="/cases"
				className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary"
			>
				<BackIcon className="size-3.5" />
				{t("Cases")}
			</Link>
			<Card className="mb-6 p-5">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div className="flex min-w-0 gap-4">
						<span
							className="hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-soft to-accent-soft text-primary sm:flex"
							aria-hidden
						>
							<Briefcase className="size-6" />
						</span>
						<div className="min-w-0 space-y-2">
							<h1
								className="text-[22px] font-extrabold leading-tight tracking-tight sm:text-2xl"
								dir="auto"
							>
								{c.title}
							</h1>
							<div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
								<CaseStatusBadge status={c.status} />
								<PriorityBadge priority={c.priority} />
								{c.case_type && <Badge>{tv(c.case_type)}</Badge>}
								{c.reference_no && (
									<span
										className="tabular rounded-md bg-muted px-2 py-0.5 text-xs font-bold"
										dir="ltr"
									>
										{c.reference_no}
									</span>
								)}
								<Link
									to={`/lands/${c.land}`}
									className="inline-flex items-center gap-1 font-medium hover:text-primary"
									dir="auto"
								>
									<Building2 className="size-3.5" aria-hidden />
									{c.land_name}
								</Link>
							</div>
						</div>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<>
							{c.can_write && (
								<Button onClick={() => setDialog({ kind: "record" })}>
									<Plus />
									{t("Record development")}
								</Button>
							)}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="icon" aria-label={t("More actions")}>
										<MoreHorizontal />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									{c.can_write && (
										<DropdownMenuItem onSelect={() => setDialog({ kind: "situation" })}>
											<RefreshCw />
											{t("Update current situation")}
										</DropdownMenuItem>
									)}
									{c.can_write && (
										<DropdownMenuItem onSelect={() => setDialog({ kind: "edit" })}>
											<Pencil />
											{t("Edit case details")}
										</DropdownMenuItem>
									)}
									<DropdownMenuItem asChild>
										<Link to={`/reports/case/${c.name}`}>
											<FileBarChart />
											{t("History report")}
										</Link>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</>
					</div>
				</div>
			</Card>

			<div className="grid gap-6 lg:grid-cols-3 [&>*]:min-w-0">
				<div className="space-y-6 lg:col-span-2">
					{/* 1. Current situation — the most prominent element of the page. */}
					<Card className="relative overflow-hidden border-primary/25 bg-gradient-to-br from-primary-soft/70 via-surface to-surface">
						<div className="absolute inset-y-0 start-0 w-1 bg-primary" aria-hidden />
						<CardBody className="space-y-3 ps-6">
							<div className="flex items-center justify-between gap-2">
								<h2 className="inline-flex items-center gap-2 text-[13px] font-bold text-primary">
									<Quote className="size-4" aria-hidden />
									{t("Current Situation")}
								</h2>
								{c.can_write && (
									<Button variant="ghost" size="sm" onClick={() => setDialog({ kind: "situation" })}>
										<RefreshCw />
										{t("Update")}
									</Button>
								)}
							</div>
							<p
								className="whitespace-pre-line text-[17px] font-bold leading-8 text-foreground sm:text-[19px] sm:leading-9"
								dir="auto"
							>
								{c.current_situation || (
									<span className="text-muted-foreground">
										{t("No current situation recorded yet.")}
									</span>
								)}
							</p>
							<div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-primary/10 pt-3 text-xs text-muted-foreground">
								{c.situation_updated_on && (
									<span className="inline-flex items-center gap-1">
										<Clock className="size-3.5" aria-hidden />
										{t("Updated {0}", formatDateTime(c.situation_updated_on))}
									</span>
								)}
								{c.last_event && (
									<span>
										{t("Latest development")}:{" "}
										<span className="font-medium text-foreground" dir="auto">
											{c.last_event.title}
										</span>{" "}
										({formatDate(c.last_event.event_date)})
									</span>
								)}
							</div>
						</CardBody>
					</Card>

					{/* 2. Next required action. */}
					<Card>
						<CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center">
							<span
								className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning-soft text-warning"
								aria-hidden
							>
								<CalendarClock className="size-5" />
							</span>
							<div className="min-w-0 flex-1">
								<div className="text-[12px] font-bold text-muted-foreground">
									{t("Next required action")}
								</div>
								{next ? (
									<div className="mt-1 space-y-1">
										<div className="flex flex-wrap items-center gap-2">
											<span className="font-semibold" dir="auto">
												{next.title}
											</span>
											<StateBadge state={next.state} />
										</div>
										<div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
											<span>
												{formatDate(next.due_date)} · {relativeDays(boot.today, next.due_date)}
											</span>
											<Person name={next.assigned_to_name} fallback={next.assigned_to} />
										</div>
									</div>
								) : (
									<p className="mt-1 text-sm text-muted-foreground">
										{t("No follow-up is planned for this case.")}
									</p>
								)}
							</div>
							<div className="flex flex-wrap gap-2">
								{next && <FollowUpActions followup={next} />}
								{c.can_write && (
									<PlanFollowUpButton caseDoc={c} variant={next ? "outline" : "default"} />
								)}
							</div>
						</CardBody>
					</Card>

					<Tabs defaultValue="history">
						<TabsList>
							<TabsTrigger value="history">
								{t("History")}{" "}
								<span className="tabular rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground">
									{c.stats.events}
								</span>
							</TabsTrigger>
							<TabsTrigger value="followups">
								{t("Follow-ups")}{" "}
								<span className="tabular rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground">
									{c.open_followups.length}
								</span>
							</TabsTrigger>
							<TabsTrigger value="tasks">
								{t("Tasks")}{" "}
								<span className="tabular rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground">
									{c.stats.tasks_open}
								</span>
							</TabsTrigger>
							<TabsTrigger value="documents">
								{t("Documents")}{" "}
								<span className="tabular rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground">
									{c.documents.length}
								</span>
							</TabsTrigger>
						</TabsList>
						<TabsContent value="history">
							<EventTimeline
								caseName={c.name}
								onCorrect={c.can_write ? (event) => setDialog({ kind: "correct", event }) : undefined}
							/>
						</TabsContent>
						<TabsContent value="followups">
							<Card>
								<CardHeader
									icon={<CalendarClock />}
									title={t("Open follow-ups")}
									action={
										<Link
											to={`/followups?case=${c.name}&scope=all`}
											className="text-xs text-primary hover:underline"
										>
											{t("Full follow-up history")}
										</Link>
									}
								/>
								<CardBody className="py-0">
									{c.open_followups.length === 0 ? (
										<EmptyState
											title={t("No open follow-ups")}
											action={c.can_write && <PlanFollowUpButton caseDoc={c} />}
										/>
									) : (
										<div className="divide-y divide-border">
											{c.open_followups.map((f) => (
												<FollowUpRow
													key={f.name}
													followup={f}
													showContext={false}
													actions={<FollowUpActions followup={f} />}
												/>
											))}
										</div>
									)}
								</CardBody>
							</Card>
						</TabsContent>
						<TabsContent value="tasks">
							<CaseTasks caseDoc={c} />
						</TabsContent>
						<TabsContent value="documents">
							<CaseDocuments caseDoc={c} />
						</TabsContent>
					</Tabs>
				</div>

				<aside className="space-y-6">
					<Card>
						<CardHeader icon={<UserRound />} title={t("Responsibility")} />
						<CardBody>
							<dl className="divide-y divide-border">
								<KeyValue label={t("Internal Owner")}>
									<Person name={c.owner_name} fallback={c.owner_user} />
								</KeyValue>
								<KeyValue label={t("External Organization")}>{c.external_organization || "—"}</KeyValue>
								{c.external_contact && (
									<KeyValue label={t("External Contact")}>
										{c.external_contact_name || c.external_contact}
									</KeyValue>
								)}
							</dl>
						</CardBody>
					</Card>
					<Card>
						<CardHeader icon={<Info />} title={t("Details")} />
						<CardBody>
							<dl className="divide-y divide-border">
								<KeyValue label={t("Start Date")}>{formatDate(c.start_date)}</KeyValue>
								<KeyValue label={t("Target Date")}>{formatDate(c.target_date)}</KeyValue>
								<KeyValue label={t("Last Meaningful Update")}>
									{formatDate(c.last_update_date)}
								</KeyValue>
								<KeyValue label={t("Next Follow-up")}>{formatDate(c.next_followup_date)}</KeyValue>
								<KeyValue label={t("Follow-ups done")}>
									{c.stats.followups_done} / {c.stats.followups_total}
								</KeyValue>
								{c.project && <KeyValue label={t("ERPNext Project")}>{c.project}</KeyValue>}
							</dl>
							{c.description && <RichText html={c.description} className="mt-3 text-muted-foreground" />}
						</CardBody>
					</Card>
					{c.relations.length > 0 && (
						<Card>
							<CardHeader icon={<GitBranch />} title={t("Related Cases")} />
							<CardBody>
								<ul className="space-y-2">
									{c.relations.map((r) => (
										<li
											key={`${r.relation_type}-${r.related_case}`}
											className="flex items-center justify-between gap-2 text-sm"
										>
											<span className="min-w-0">
												<span className="block text-xs text-muted-foreground">
													{tv(r.relation_type)}
												</span>
												<Link
													to={`/cases/${r.related_case}`}
													className="font-medium hover:text-primary"
													dir="auto"
												>
													{r.title || r.related_case}
												</Link>
											</span>
											<CaseStatusBadge status={r.status} />
										</li>
									))}
								</ul>
							</CardBody>
						</Card>
					)}
				</aside>
			</div>

			<EventFormDialog
				open={dialog?.kind === "record" || dialog?.kind === "correct"}
				onOpenChange={close}
				caseDoc={c}
				correcting={dialog?.kind === "correct" ? dialog.event : null}
			/>
			<SituationDialog open={dialog?.kind === "situation"} onOpenChange={close} caseDoc={c} />
			<CaseFormDialog open={dialog?.kind === "edit"} onOpenChange={close} caseDoc={c} />
		</>
	);
}
