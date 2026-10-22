import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Briefcase, Building2, CalendarClock, FileText, MapPin, Plus } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { landKeys, landsApi, type LandRow } from "./api";
import { KeyDocumentsIndicator } from "./KeyDocuments";
import { LandFormDialog } from "./LandFormDialog";

const PAGE = 24;

export function LandsPage() {
	const { boot } = useBoot();
	const [state, update] = useUrlState({ search: "", status: "", page: "0" });
	const page = Number(state.page) || 0;
	const filters = { search: state.search, status: state.status, start: page * PAGE, page_length: PAGE };
	const query = useQuery({
		queryKey: landKeys.list(filters),
		queryFn: () => landsApi.list(filters),
		placeholderData: keepPreviousData,
	});
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
				<Select
					value={state.status}
					onChange={(e) => update({ status: e.target.value })}
					className="sm:w-48"
					aria-label={t("Status")}
				>
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
				<EmptyState
					title={t("No lands found")}
					hint={state.search || state.status ? t("Try a different search or filter.") : undefined}
				/>
			) : (
				<>
					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
						{query.data.rows.map((land) => (
							<LandCard key={land.name} land={land} />
						))}
					</div>
					<Pager
						page={page}
						onPage={(p) => update({ page: String(p) }, { resetPage: false })}
						data={query.data}
					/>
				</>
			)}
			<LandFormDialog open={creating} onOpenChange={setCreating} />
		</>
	);
}

function LandCard({ land }: { land: LandRow }) {
	return (
		<Link
			to={`/lands/${land.name}`}
			className="group block rounded-[var(--radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
		>
			<Card className="flex h-full flex-col overflow-hidden transition-all group-hover:-translate-y-px group-hover:border-primary/30 group-hover:shadow-raised">
				<div className="flex items-start gap-3 p-4 pb-3">
					<span
						className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-soft to-accent-soft text-lg font-extrabold text-primary"
						aria-hidden
					>
						<Building2 className="size-5" />
					</span>
					<div className="min-w-0 flex-1">
						<div className="flex items-start justify-between gap-2">
							<h2
								className="truncate text-[15px] font-bold leading-snug group-hover:text-primary"
								dir="auto"
							>
								{land.land_name}
							</h2>
							<StateBadge state={land.status} />
						</div>
						<div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
							{land.land_code && (
								<span className="tabular rounded bg-muted px-1.5 font-semibold" dir="ltr">
									{land.land_code}
								</span>
							)}
							{land.city && (
								<span className="inline-flex items-center gap-1" dir="auto">
									<MapPin className="size-3" aria-hidden />
									{land.city}
								</span>
							)}
						</div>
					</div>
				</div>
				<div className="px-4 pb-3">
					<KeyDocumentsIndicator have={land.key_documents ?? []} />
				</div>
				<dl className="mt-auto grid grid-cols-3 divide-x divide-border/70 border-t border-border/70 bg-surface-2 rtl:divide-x-reverse">
					<Metric icon={<Briefcase />} label={t("Open cases")} value={land.open_cases} />
					<Metric
						icon={<CalendarClock />}
						label={t("Follow-ups")}
						value={land.open_followups}
						alert={land.overdue_followups > 0}
					/>
					<Metric icon={<FileText />} label={t("Documents")} value={land.documents} />
				</dl>
				{land.overdue_followups > 0 && (
					<div className="flex items-center gap-1.5 border-t border-danger/15 bg-danger-soft px-4 py-1.5 text-xs font-semibold text-danger">
						<AlertTriangle className="size-3.5" aria-hidden />
						{t("{0} overdue follow-ups", land.overdue_followups)}
					</div>
				)}
			</Card>
		</Link>
	);
}

function Metric({
	icon,
	label,
	value,
	alert,
}: {
	icon: React.ReactNode;
	label: string;
	value: number;
	alert?: boolean;
}) {
	return (
		<div className="px-2 py-3 text-center">
			<dd
				className={cn(
					"tabular flex items-center justify-center gap-1.5 text-lg font-extrabold leading-none",
					alert && "text-danger",
				)}
			>
				<span className="text-muted-foreground [&_svg]:size-3.5" aria-hidden>
					{icon}
				</span>
				{formatNumber(value)}
			</dd>
			<dt className="mt-1 truncate text-[11px] font-medium text-muted-foreground">{label}</dt>
		</div>
	);
}
