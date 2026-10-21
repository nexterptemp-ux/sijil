import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { FileBarChart, FolderOpen, Link2, MapPin, Pencil, Star } from "lucide-react";
import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { KeyValue, PageHeader, Person, RichText, StatTile } from "@/components/common";
import { EmptyState, LoadingRows, QueryView } from "@/components/states";
import { StateBadge } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/layout";
import { caseKeys, casesApi } from "@/features/cases/api";
import { CaseList } from "@/features/cases/CaseList";
import { followupKeys, followupsApi } from "@/features/followups/api";
import { FollowUpRow } from "@/features/followups/FollowUpRow";
import { t, tv } from "@/i18n";
import { useApiMutation } from "@/lib/api/hooks";
import { formatDate } from "@/lib/format";
import { landKeys, landsApi, type Land } from "./api";
import { LandFormDialog } from "./LandFormDialog";
import { LandExtras } from "./LandExtras";

export function LandPage() {
	const { name = "" } = useParams();
	const query = useQuery({ queryKey: landKeys.detail(name), queryFn: () => landsApi.get(name) });
	return (
		<QueryView query={query} loading={<LoadingRows rows={6} />}>
			{(land) => <LandView land={land} />}
		</QueryView>
	);
}

function LandView({ land }: { land: Land }) {
	const [editing, setEditing] = React.useState(false);
	const project = useApiMutation(() => landsApi.createProject(land.name), {
		invalidate: [landKeys.all],
		success: (r) => t("ERPNext project {0} linked", r.project),
	});
	const s = land.stats;
	return (
		<>
			<PageHeader
				back={{ to: "/lands", label: t("Lands and Projects") }}
				title={
					<span className="inline-flex flex-wrap items-center gap-2">
						{land.land_name}
						<StateBadge state={land.status} />
					</span>
				}
				subtitle={
					<span className="flex flex-wrap items-center gap-x-3">
						{land.land_code && <span dir="auto">{land.land_code}</span>}
						{land.city && (
							<span className="inline-flex items-center gap-1" dir="auto">
								<MapPin className="size-3.5" aria-hidden />
								{land.city}
							</span>
						)}
					</span>
				}
				actions={
					<>
						<Button asChild variant="outline">
							<Link to={`/documents/${land.name}`}>
								<FolderOpen />
								{t("Document Library")}
							</Link>
						</Button>
						<Button asChild variant="outline">
							<Link to={`/reports/land/${land.name}`}>
								<FileBarChart />
								{t("History report")}
							</Link>
						</Button>
						{land.can_write && (
							<Button variant="outline" onClick={() => setEditing(true)}>
								<Pencil />
								{t("Edit")}
							</Button>
						)}
					</>
				}
			/>

			<section className="mb-6 grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-6" aria-label={t("Summary")}>
				<StatTile label={t("Open cases")} value={s.cases_open} to={`/cases?land=${land.name}`} />
				<StatTile label={t("Cases without recent updates")} value={s.cases_stale} tone="warning" to={`/cases?land=${land.name}&stale=1`} />
				<StatTile label={t("Open follow-ups")} value={s.followups_open} to={`/followups?land=${land.name}`} />
				<StatTile label={t("Overdue follow-ups")} value={s.followups_overdue} tone="danger" to={`/followups?land=${land.name}&scope=overdue`} />
				<StatTile label={t("Open tasks")} value={s.tasks_open} to={`/tasks?land=${land.name}`} />
				<StatTile label={t("Documents")} value={s.documents} to={`/documents/${land.name}`} />
			</section>

			<div className="grid gap-6 lg:grid-cols-3">
				<div className="space-y-6 lg:col-span-2">
					<LandCases land={land} />
					<LandFollowUps land={land.name} />
					<LandExtras land={land} />
					<LandActivity land={land.name} />
				</div>
				<div className="space-y-6">
					<Card>
						<CardHeader title={t("Details")} />
						<CardBody>
							<dl className="divide-y divide-border">
								{land.location && <KeyValue label={t("Location")}>{land.location}</KeyValue>}
								{land.company && <KeyValue label={t("Company")}>{land.company}</KeyValue>}
								<KeyValue label={t("ERPNext Project")}>
									{land.project ? (
										<a href={`/app/project/${encodeURIComponent(land.project)}`} className="inline-flex items-center gap-1 text-primary hover:underline">
											<Link2 className="size-3.5" aria-hidden />
											{land.project}
										</a>
									) : land.can_write ? (
										<Button variant="link" size="sm" disabled={project.isPending} onClick={() => project.mutate(undefined)}>
											{t("Create project")}
										</Button>
									) : (
										"—"
									)}
								</KeyValue>
								<KeyValue label={t("Developments")}>{s.events}</KeyValue>
								<KeyValue label={t("Total cases")}>{s.cases_total}</KeyValue>
							</dl>
							{land.description && <RichText html={land.description} className="mt-3 text-muted-foreground" />}
							{land.notes && (
								<div className="mt-3 rounded-md bg-muted p-3 text-sm" dir="auto">
									<div className="mb-1 text-xs font-semibold text-muted-foreground">{t("Notes")}</div>
									{land.notes}
								</div>
							)}
						</CardBody>
					</Card>
					<Card>
						<CardHeader title={t("Responsible Employees")} />
						<CardBody>
							{land.responsibles.length === 0 ? (
								<p className="text-sm text-muted-foreground">{t("No responsible employees yet.")}</p>
							) : (
								<ul className="space-y-3">
									{land.responsibles.map((r) => (
										<li key={r.user} className="flex items-center justify-between gap-2 text-sm">
											<Person name={r.full_name} size="md" />
											<span className="truncate text-xs text-muted-foreground" dir="auto">
												{r.responsibility}
											</span>
										</li>
									))}
								</ul>
							)}
						</CardBody>
					</Card>
					<Card>
						<CardHeader title={t("External Organizations")} />
						<CardBody>
							{land.organizations.length === 0 ? (
								<p className="text-sm text-muted-foreground">{t("No external organizations yet.")}</p>
							) : (
								<ul className="space-y-2">
									{land.organizations.map((o) => (
										<li key={o.organization} className="text-sm">
											<div className="font-medium" dir="auto">
												{o.organization}
											</div>
											<div className="text-xs text-muted-foreground" dir="auto">
												{[tv(o.organization_type), o.role].filter(Boolean).join(" · ")}
											</div>
										</li>
									))}
								</ul>
							)}
						</CardBody>
					</Card>
				</div>
			</div>
			<LandFormDialog open={editing} onOpenChange={setEditing} land={land} />
		</>
	);
}

function LandCases({ land }: { land: Land }) {
	const filters = { land: land.name, scope: "open" as const, page_length: 10 };
	const query = useQuery({ queryKey: caseKeys.list(filters), queryFn: () => casesApi.list(filters) });
	return (
		<Card>
			<CardHeader
				title={t("Open cases")}
				action={
					<span className="flex items-center gap-3">
						<Link to={`/cases?land=${land.name}&scope=`} className="text-xs text-primary hover:underline">
							{t("View all")}
						</Link>
					</span>
				}
			/>
			<CardBody className="py-1">
				<QueryView query={query}>
					{(data) =>
						data.rows.length ? (
							<CaseList rows={data.rows} showLand={false} />
						) : (
							<EmptyState title={t("No open cases on this land")} />
						)
					}
				</QueryView>
			</CardBody>
		</Card>
	);
}

function LandFollowUps({ land }: { land: string }) {
	const filters = { land, scope: "open" as const, page_length: 6 };
	const query = useQuery({ queryKey: followupKeys.list(filters), queryFn: () => followupsApi.list(filters) });
	return (
		<Card>
			<CardHeader
				title={t("Open follow-ups")}
				action={
					<Link to={`/followups?land=${land}`} className="text-xs text-primary hover:underline">
						{t("View all")}
					</Link>
				}
			/>
			<CardBody className="py-0">
				<QueryView query={query}>
					{(data) =>
						data.rows.length ? (
							<div className="divide-y divide-border">
								{data.rows.map((f) => (
									<FollowUpRow key={f.name} followup={f} />
								))}
							</div>
						) : (
							<EmptyState title={t("No open follow-ups")} />
						)
					}
				</QueryView>
			</CardBody>
		</Card>
	);
}

function LandActivity({ land }: { land: string }) {
	const query = useInfiniteQuery({
		queryKey: landKeys.activity(land),
		queryFn: ({ pageParam }) => landsApi.activity(land, pageParam, 10),
		initialPageParam: 0,
		getNextPageParam: (last) => (last.has_more ? last.start + last.rows.length : undefined),
	});
	const rows = query.data?.pages.flatMap((p) => p.rows) ?? [];
	return (
		<Card>
			<CardHeader title={t("Recent developments")} />
			<CardBody className="py-0">
				{query.isLoading ? (
					<LoadingRows rows={3} className="py-3" />
				) : rows.length === 0 ? (
					<EmptyState title={t("No developments recorded yet")} />
				) : (
					<>
						<ol className="divide-y divide-border">
							{rows.map((e) => (
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
											<span>{formatDate(e.event_date)}</span>
											<span>{tv(e.event_type)}</span>
											<span>{e.recorded_by_name}</span>
										</div>
									</div>
								</li>
							))}
						</ol>
						{query.hasNextPage && (
							<div className="py-3 text-center">
								<Button variant="outline" size="sm" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
									{query.isFetchingNextPage ? t("Loading...") : t("Load more")}
								</Button>
							</div>
						)}
					</>
				)}
			</CardBody>
		</Card>
	);
}
