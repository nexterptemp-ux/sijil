import { useQuery } from "@tanstack/react-query";
import {
	AlarmClock,
	Briefcase,
	CalendarClock,
	CalendarX2,
	FileText,
	Hourglass,
	ListChecks,
	ListX,
	PartyPopper,
	Sparkles,
	Star,
	TimerOff,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useBoot } from "@/app/boot";
import { PageHeader, StatTile } from "@/components/common";
import { EmptyState, QueryView } from "@/components/states";
import { CaseStatusBadge } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, Skeleton } from "@/components/ui/layout";
import { FollowUpActions } from "@/features/followups/FollowUpActions";
import { FollowUpRow } from "@/features/followups/FollowUpRow";
import { t, tv } from "@/i18n";
import { formatDate, formatNumber, relativeDays } from "@/lib/format";
import { dashboardApi, dashboardKeys, type Dashboard } from "./api";

function longDate(iso: string) {
	const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
	return new Intl.DateTimeFormat(document.documentElement.lang === "ar" ? "ar-u-ca-gregory-nu-latn" : "en-GB", {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
	}).format(new Date(y, m - 1, d));
}

export function DashboardPage() {
	const { boot } = useBoot();
	const query = useQuery({ queryKey: dashboardKeys.main, queryFn: dashboardApi.get });
	const firstName = boot.user.full_name.split(" ")[0];
	return (
		<>
			<PageHeader
				title={t("Welcome, {0}", firstName)}
				subtitle={
					<span className="flex flex-wrap items-center gap-x-2">
						<span>{longDate(boot.today)}</span>
						{query.data && (
							<>
								<span aria-hidden>·</span>
								<span>{t("{0} active lands", formatNumber(query.data.counts.active_lands))}</span>
							</>
						)}
					</span>
				}
			/>
			<QueryView query={query} loading={<DashboardSkeleton />}>
				{(data) => <DashboardBody data={data} />}
			</QueryView>
		</>
	);
}

function DashboardSkeleton() {
	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				{Array.from({ length: 8 }, (_, i) => (
					<Skeleton key={i} className="h-28" />
				))}
			</div>
			<div className="grid gap-6 lg:grid-cols-5 [&>*]:min-w-0">
				<Skeleton className="h-80 lg:col-span-3" />
				<Skeleton className="h-80 lg:col-span-2" />
			</div>
		</div>
	);
}

function ViewAll({ to }: { to: string }) {
	return (
		<Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary">
			<Link to={to}>{t("View all")}</Link>
		</Button>
	);
}

function DashboardBody({ data }: { data: Dashboard }) {
	const c = data.counts;
	const attention = c.overdue_followups + c.due_today_followups;
	return (
		<div className="space-y-6">
			<section className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4" aria-label={t("Summary")}>
				<StatTile
					icon={<CalendarX2 />}
					label={t("Overdue follow-ups")}
					value={c.overdue_followups}
					tone="danger"
					to="/followups?scope=overdue"
				/>
				<StatTile
					icon={<AlarmClock />}
					label={t("Follow-ups due today")}
					value={c.due_today_followups}
					tone="warning"
					to="/followups?scope=today"
				/>
				<StatTile
					icon={<CalendarClock />}
					label={t("Upcoming follow-ups")}
					value={c.upcoming_followups}
					hint={t("Next 7 days")}
					to="/followups?scope=week"
				/>
				<StatTile
					icon={<Hourglass />}
					label={t("Awaiting action")}
					value={c.awaiting_action}
					tone="warning"
					to="/cases?status=Awaiting+Action"
				/>
				<StatTile icon={<Briefcase />} label={t("Open cases")} value={c.open_cases} to="/cases" />
				<StatTile
					icon={<TimerOff />}
					label={t("Cases without recent updates")}
					value={c.stale_cases}
					tone="warning"
					hint={t("More than {0} days", data.stale_days)}
					to="/cases?stale=1"
				/>
				<StatTile icon={<ListChecks />} label={t("Open tasks")} value={c.open_tasks} to="/tasks" />
				<StatTile
					icon={<ListX />}
					label={t("Overdue tasks")}
					value={c.overdue_tasks}
					tone="danger"
					to="/tasks?scope=overdue"
				/>
			</section>

			<div className="grid gap-6 lg:grid-cols-5 [&>*]:min-w-0">
				<div className="space-y-6 lg:col-span-3">
					<Card>
						<CardHeader
							icon={<AlarmClock />}
							title={t("Needs attention")}
							count={attention}
							description={t("Overdue and due today")}
							action={<ViewAll to="/followups?scope=overdue" />}
						/>
						<CardBody className="py-0">
							{data.attention_followups.length === 0 ? (
								<EmptyState
									icon={<PartyPopper />}
									title={t("Nothing overdue or due today")}
									hint={t("Well done — all follow-ups are on schedule.")}
								/>
							) : (
								<div className="divide-y divide-border/70">
									{data.attention_followups.map((f) => (
										<FollowUpRow
											key={f.name}
											followup={f}
											actions={<FollowUpActions followup={f} compact />}
										/>
									))}
								</div>
							)}
						</CardBody>
					</Card>

					<Card>
						<CardHeader
							icon={<Sparkles />}
							title={t("Recent developments")}
							description={t("Latest recorded across all cases")}
						/>
						<CardBody>
							{data.recent_events.length === 0 ? (
								<EmptyState title={t("No developments recorded yet")} />
							) : (
								<ol className="relative space-y-5 before:absolute before:inset-y-1 before:start-[11px] before:w-px before:bg-border">
									{data.recent_events.map((e) => (
										<li key={e.name} className="relative flex gap-3.5">
											<span
												className="relative z-10 flex w-6 shrink-0 justify-center pt-0.5"
												aria-hidden
											>
												{e.is_milestone ? (
													<span className="flex size-6 items-center justify-center rounded-full bg-warning text-white ring-4 ring-surface">
														<Star className="size-3 fill-current" />
													</span>
												) : (
													<span className="mt-1.5 size-2.5 rounded-full bg-primary ring-4 ring-surface" />
												)}
											</span>
											<div className="min-w-0 flex-1">
												<div className="flex flex-wrap items-baseline justify-between gap-x-3">
													<Link
														to={`/cases/${e.case}`}
														className="font-semibold leading-snug hover:text-primary"
														dir="auto"
													>
														{e.title}
													</Link>
													<span className="tabular shrink-0 text-xs text-muted-foreground">
														{formatDate(e.event_date)}
													</span>
												</div>
												<div className="mt-0.5 flex flex-wrap gap-x-1.5 text-xs text-muted-foreground">
													<span className="font-medium text-foreground/70" dir="auto">
														{e.case_title}
													</span>
													<span aria-hidden>·</span>
													<span dir="auto">{e.land_name}</span>
													<span aria-hidden>·</span>
													<span>{e.recorded_by_name}</span>
												</div>
											</div>
										</li>
									))}
								</ol>
							)}
						</CardBody>
					</Card>
				</div>

				<div className="space-y-6 lg:col-span-2">
					<Card>
						<CardHeader
							icon={<CalendarClock />}
							title={t("Upcoming follow-ups")}
							count={data.upcoming_followups.length}
							action={<ViewAll to="/followups?scope=upcoming" />}
						/>
						<CardBody className="py-0">
							{data.upcoming_followups.length === 0 ? (
								<EmptyState title={t("No upcoming follow-ups")} />
							) : (
								<div className="divide-y divide-border/70">
									{data.upcoming_followups.map((f) => (
										<FollowUpRow key={f.name} followup={f} />
									))}
								</div>
							)}
						</CardBody>
					</Card>

					<Card>
						<CardHeader
							icon={<TimerOff />}
							title={t("Cases without recent updates")}
							description={t("More than {0} days", data.stale_days)}
							action={<ViewAll to="/cases?stale=1" />}
						/>
						<CardBody className="py-1">
							{data.stale_cases.length === 0 ? (
								<EmptyState title={t("Every open case was updated recently")} />
							) : (
								<ul className="divide-y divide-border/70">
									{data.stale_cases.map((c) => (
										<li key={c.name} className="flex items-start justify-between gap-3 py-3">
											<div className="min-w-0">
												<Link
													to={`/cases/${c.name}`}
													className="font-semibold leading-snug hover:text-primary"
													dir="auto"
												>
													{c.title}
												</Link>
												<div className="mt-0.5 text-xs text-muted-foreground" dir="auto">
													{c.land_name} · {c.owner_name}
												</div>
											</div>
											<div className="shrink-0 space-y-1 text-end">
												<CaseStatusBadge status={c.status} />
												<div className="text-[11px] font-semibold text-warning">
													{c.last_update_date
														? relativeDays(data.today, c.last_update_date)
														: t("Never updated")}
												</div>
											</div>
										</li>
									))}
								</ul>
							)}
						</CardBody>
					</Card>

					<Card>
						<CardHeader
							icon={<FileText />}
							title={t("Recent documents")}
							action={<ViewAll to="/documents" />}
						/>
						<CardBody className="py-1">
							{data.recent_documents.length === 0 ? (
								<EmptyState title={t("No documents yet")} />
							) : (
								<ul className="divide-y divide-border/70">
									{data.recent_documents.map((d) => (
										<li key={d.name}>
											<Link
												to={`/documents/${d.land}?doc=${d.name}`}
												className="group flex items-center gap-3 py-2.5"
											>
												<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#fdecec] text-[10px] font-extrabold text-[#c0392b]">
													PDF
												</span>
												<div className="min-w-0 flex-1">
													<div
														className="truncate text-sm font-semibold group-hover:text-primary"
														dir="auto"
													>
														{d.title}
													</div>
													<div className="truncate text-xs text-muted-foreground" dir="auto">
														{d.land_name} · {tv(d.document_type)}
													</div>
												</div>
												<span className="shrink-0 text-[11px] text-muted-foreground">
													{t("v{0}", d.version_count)}
												</span>
											</Link>
										</li>
									))}
								</ul>
							)}
						</CardBody>
					</Card>
				</div>
			</div>
		</div>
	);
}
