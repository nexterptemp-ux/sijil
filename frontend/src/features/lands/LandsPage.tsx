import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Briefcase, CalendarClock, FileText, MapPin, Plus } from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";
import { useBoot } from "@/app/boot";
import { PageHeader, Pager, SearchInput } from "@/components/common";
import { EmptyState, ErrorState, LoadingRows } from "@/components/states";
import { StateBadge } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Card } from "@/components/ui/layout";
import { t, tv } from "@/i18n";
import { formatNumber } from "@/lib/format";
import { useUrlState } from "@/lib/hooks";
import { landKeys, landsApi, type LandRow } from "./api";
import { LandFormDialog } from "./LandFormDialog";

const PAGE = 24;

export function LandsPage() {
	const { boot } = useBoot();
	const [state, update] = useUrlState({ search: "", status: "", page: "0" });
	const page = Number(state.page) || 0;
	const filters = { search: state.search, status: state.status, start: page * PAGE, page_length: PAGE };
	const query = useQuery({ queryKey: landKeys.list(filters), queryFn: () => landsApi.list(filters), placeholderData: keepPreviousData });
	const [creating, setCreating] = React.useState(false);

	return (
		<>
			<PageHeader
				title={t("Lands and Projects")}
				subtitle={query.data ? t("{0} lands and projects", formatNumber(query.data.total)) : undefined}
				actions={
					boot.can_create["Sijil Land"] && (
						<Button onClick={() => setCreating(true)}>
							<Plus />
							{t("New Land / Project")}
						</Button>
					)
				}
			/>
			<div className="mb-4 flex flex-col gap-2 sm:flex-row">
				<SearchInput
					value={state.search}
					onChange={(search) => update({ search })}
					placeholder={t("Search by name, code or city")}
					className="flex-1"
				/>
				<Select value={state.status} onChange={(e) => update({ status: e.target.value })} className="sm:w-48" aria-label={t("Status")}>
					<option value="">{t("All statuses")}</option>
					{boot.options.land_status.map((s) => (
						<option key={s} value={s}>
							{tv(s)}
						</option>
					))}
				</Select>
			</div>
			{query.isLoading ? (
				<LoadingRows rows={6} />
			) : query.error ? (
				<ErrorState error={query.error} onRetry={() => void query.refetch()} />
			) : !query.data?.rows.length ? (
				<EmptyState title={t("No lands found")} hint={state.search || state.status ? t("Try a different search or filter.") : undefined} />
			) : (
				<>
					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
						{query.data.rows.map((land) => (
							<LandCard key={land.name} land={land} />
						))}
					</div>
					<Pager page={page} onPage={(p) => update({ page: String(p) }, { resetPage: false })} data={query.data} />
				</>
			)}
			<LandFormDialog open={creating} onOpenChange={setCreating} />
		</>
	);
}

function LandCard({ land }: { land: LandRow }) {
	return (
		<Link to={`/lands/${land.name}`} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
			<Card className="h-full p-4 transition-colors hover:border-primary/40">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0">
						<h2 className="truncate font-bold" dir="auto">
							{land.land_name}
						</h2>
						<div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
							{land.land_code && <span dir="auto">{land.land_code}</span>}
							{land.city && (
								<span className="inline-flex items-center gap-1" dir="auto">
									<MapPin className="size-3" aria-hidden />
									{land.city}
								</span>
							)}
						</div>
					</div>
					<StateBadge state={land.status} />
				</div>
				<dl className="mt-4 grid grid-cols-3 gap-2 text-center">
					<Metric icon={<Briefcase />} label={t("Open cases")} value={land.open_cases} />
					<Metric icon={<CalendarClock />} label={t("Follow-ups")} value={land.open_followups} />
					<Metric icon={<FileText />} label={t("Documents")} value={land.documents} />
				</dl>
				{land.overdue_followups > 0 && (
					<div className="mt-3 flex items-center gap-1.5 rounded-md bg-danger-soft px-2 py-1 text-xs font-semibold text-danger">
						<AlertTriangle className="size-3.5" aria-hidden />
						{t("{0} overdue follow-ups", land.overdue_followups)}
					</div>
				)}
			</Card>
		</Link>
	);
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
	return (
		<div className="rounded-md bg-muted/60 px-1 py-2">
			<div className="flex justify-center text-muted-foreground [&_svg]:size-3.5" aria-hidden>
				{icon}
			</div>
			<dd className="text-base font-bold">{formatNumber(value)}</dd>
			<dt className="truncate text-[11px] text-muted-foreground">{label}</dt>
		</div>
	);
}
