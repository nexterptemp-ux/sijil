import { useQuery } from "@tanstack/react-query";
import { FileText, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useBoot } from "@/app/boot";
import { PageHeader, StatTile } from "@/components/common";
import { EmptyState, QueryView } from "@/components/states";
import { CaseStatusBadge } from "@/components/status";
import { Card, CardBody, CardHeader, Skeleton } from "@/components/ui/layout";
import { FollowUpActions } from "@/features/followups/FollowUpActions";
import { FollowUpRow } from "@/features/followups/FollowUpRow";
import { t, tv } from "@/i18n";
import { formatDate, relativeDays } from "@/lib/format";
import { dashboardApi, dashboardKeys, type Dashboard } from "./api";

export function DashboardPage() {
	const { boot } = useBoot();
	const query = useQuery({ queryKey: dashboardKeys.main, queryFn: dashboardApi.get });
	const firstName = boot.user.full_name.split(" ")[0];
	return (
		<>
			<PageHeader title={t("Welcome, {0}", firstName)} subtitle={t("What needs your attention today")} />
			<QueryView query={query} loading={<DashboardSkeleton />}>
				{(data) => <DashboardBody data={data} />}
			</QueryView>
		</>
	);
}

function DashboardSkeleton() {
	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
				{Array.from({ length: 8 }, (_, i) => (
					<Skeleton key={i} className="h-24" />
				))}
			</div>
			<Skeleton className="h-64" />
		</div>
	);
}

function DashboardBody({ data }: { data: Dashboard }) {
	const c = data.counts;
	return (
		<div className="space-y-6">
			<section className="grid grid-cols-3 gap-2 sm:gap-3 xl:grid-cols-5" aria-label={t("Summary")}>
				<StatTile label={t("Overdue follow-ups")} value={c.overdue_followups} tone="danger" to="/followups?scope=overdue" />
				<StatTile label={t("Follow-ups due today")} value={c.due_today_followups} tone="warning" to="/followups?scope=today" />
				<StatTile label={t("Upcoming follow-ups")} value={c.upcoming_followups} hint={t("Next 7 days")} to="/followups?scope=week" />
				<StatTile label={t("Open cases")} value={c.open_cases} to="/cases" />
				<StatTile label={t("Awaiting action")} value={c.awaiting_action} tone="warning" to="/cases?status=Awaiting+Action" />
				<StatTile label={t("Cases without recent updates")} value={c.stale_cases} tone="warning" hint={t("More than {0} days", data.stale_days)} to="/cases?stale=1" />
				<StatTile label={t("Open tasks")} value={c.open_tasks} to="/tasks" />
				<StatTile label={t("Overdue tasks")} value={c.overdue_tasks} tone="danger" to="/tasks?scope=overdue" />
				<StatTile label={t("Active lands")} value={c.active_lands} to="/lands?status=Active" />
			</section>

			<div className="grid gap-6 lg:grid-cols-5">
				<div className="space-y-6 lg:col-span-3">
					<Card>
						<CardHeader
							title={t("Needs attention")}
							action={
								<Link to="/followups?scope=overdue" className="text-xs text-primary hover:underline">
									{t("View all")}
								</Link>
							}
						/>
						<CardBody className="py-0">
							{data.attention_followups.length === 0 ? (
								<EmptyState title={t("Nothing overdue or due today")} hint={t("Well done — all follow-ups are on schedule.")} />
							) : (
								<div className="divide-y divide-border">
									{data.attention_followups.map((f) => (
										<FollowUpRow key={f.name} followup={f} actions={<FollowUpActions followup={f} compact />} />
									))}
								</div>
							)}
						</CardBody>
					</Card>

					<Card>
						<CardHeader title={t("Recent developments")} />
						<CardBody className="py-0">
							{data.recent_events.length === 0 ? (
								<EmptyState title={t("No developments recorded yet")} />
							) : (
								<ul className="divide-y divide-border">
									{data.recent_events.map((e) => (
										<li key={e.name} className="flex gap-3 py-3">
											<div className="mt-1.5 shrink-0">
												{e.is_milestone ? (
													<Star className="size-4 fill-warning text-warning" aria-label={t("Milestone")} />
												) : (
													<span className="block size-2.5 rounded-full bg-primary" aria-hidden />
												)}
											</div>
											<div className="min-w-0 flex-1">
												<Link to={`/cases/${e.case}`} className="font-semibold hover:text-primary" dir="auto">
													{e.title}
												</Link>
												<div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
													<span dir="auto">{e.case_title}</span>
													<span dir="auto">{e.land_name}</span>
													<span>{formatDate(e.event_date)}</span>
													<span>{e.recorded_by_name}</span>
												</div>
											</div>
										</li>
									))}
								</ul>
							)}
						</CardBody>
					</Card>
				</div>

				<div className="space-y-6 lg:col-span-2">
					<Card>
						<CardHeader title={t("Upcoming follow-ups")} />
						<CardBody className="py-0">
							{data.upcoming_followups.length === 0 ? (
								<EmptyState title={t("No upcoming follow-ups")} />
							) : (
								<div className="divide-y divide-border">
									{data.upcoming_followups.map((f) => (
										<FollowUpRow key={f.name} followup={f} />
									))}
								</div>
							)}
						</CardBody>
					</Card>

					<Card>
						<CardHeader
							title={t("Cases without recent updates")}
							action={
								<Link to="/cases?stale=1" className="text-xs text-primary hover:underline">
									{t("View all")}
								</Link>
							}
						/>
						<CardBody className="py-0">
							{data.stale_cases.length === 0 ? (
								<EmptyState title={t("Every open case was updated recently")} />
							) : (
								<ul className="divide-y divide-border">
									{data.stale_cases.map((c) => (
										<li key={c.name} className="flex items-start justify-between gap-3 py-3">
											<div className="min-w-0">
												<Link to={`/cases/${c.name}`} className="font-semibold hover:text-primary" dir="auto">
													{c.title}
												</Link>
												<div className="text-xs text-muted-foreground" dir="auto">
													{c.land_name} · {c.owner_name}
												</div>
											</div>
											<div className="shrink-0 text-end text-xs text-muted-foreground">
												<CaseStatusBadge status={c.status} />
												<div className="mt-1">
													{c.last_update_date ? relativeDays(data.today, c.last_update_date) : t("Never updated")}
												</div>
											</div>
										</li>
									))}
								</ul>
							)}
						</CardBody>
					</Card>

					<Card>
						<CardHeader title={t("Recent documents")} />
						<CardBody className="py-0">
							{data.recent_documents.length === 0 ? (
								<EmptyState title={t("No documents yet")} />
							) : (
								<ul className="divide-y divide-border">
									{data.recent_documents.map((d) => (
										<li key={d.name} className="flex items-center gap-3 py-2.5">
											<FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
											<div className="min-w-0 flex-1">
												<Link
													to={`/documents/${d.land}?doc=${d.name}`}
													className="block truncate text-sm font-medium hover:text-primary"
													dir="auto"
												>
													{d.title}
												</Link>
												<div className="text-xs text-muted-foreground" dir="auto">
													{d.land_name} · {tv(d.document_type)}
												</div>
											</div>
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
