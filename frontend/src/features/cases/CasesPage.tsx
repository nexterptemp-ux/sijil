import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Plus, SlidersHorizontal } from "lucide-react";
import * as React from "react";
import { useBoot } from "@/app/boot";
import { PageHeader, Pager, SearchInput } from "@/components/common";
import { LookupSelect } from "@/components/fields";
import { EmptyState, ErrorState, LoadingRows } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Checkbox, Select } from "@/components/ui/input";
import { Card } from "@/components/ui/layout";
import { t, tv } from "@/i18n";
import { formatNumber } from "@/lib/format";
import { useUrlState } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { caseKeys, casesApi, type CaseFilters, type CaseOrder } from "./api";
import { CaseFormDialog } from "./CaseFormDialog";
import { CaseList } from "./CaseList";

const PAGE = 20;

export function CasesPage() {
	const { boot } = useBoot();
	const [s, update] = useUrlState({
		search: "",
		scope: "open",
		status: "",
		priority: "",
		land: "",
		mine: "",
		stale: "",
		order: "updated",
		page: "0",
	});
	const page = Number(s.page) || 0;
	const [showFilters, setShowFilters] = React.useState(false);
	const [creating, setCreating] = React.useState(false);

	const filters: CaseFilters = {
		search: s.search,
		scope: s.status ? undefined : ((s.scope || undefined) as CaseFilters["scope"]),
		status: s.status,
		priority: s.priority,
		land: s.land,
		mine: s.mine === "1",
		stale: s.stale === "1",
		order: s.order as CaseOrder,
		start: page * PAGE,
		page_length: PAGE,
	};
	const query = useQuery({ queryKey: caseKeys.list(filters), queryFn: () => casesApi.list(filters), placeholderData: keepPreviousData });
	const active = [s.status, s.priority, s.land, s.mine, s.stale].filter(Boolean).length;

	return (
		<>
			<PageHeader
				title={t("Cases")}
				subtitle={query.data ? t("{0} cases", formatNumber(query.data.total)) : undefined}
				actions={
					boot.can_create["Sijil Case"] && (
						<Button onClick={() => setCreating(true)}>
							<Plus />
							{t("New Case")}
						</Button>
					)
				}
			/>
			<div className="mb-3 flex flex-col gap-2 sm:flex-row">
				<SearchInput value={s.search} onChange={(search) => update({ search })} placeholder={t("Search by title or reference")} className="flex-1" />
				<div className="flex gap-2">
					<Select value={s.scope} onChange={(e) => update({ scope: e.target.value })} aria-label={t("Show")} className="flex-1 sm:w-36" disabled={Boolean(s.status)}>
						<option value="open">{t("Open")}</option>
						<option value="closed">{t("Closed")}</option>
						<option value="">{t("All")}</option>
					</Select>
					<Select value={s.order} onChange={(e) => update({ order: e.target.value })} aria-label={t("Sort by")} className="flex-1 sm:w-48">
						<option value="updated">{t("Recently updated")}</option>
						<option value="stale">{t("Longest without update")}</option>
						<option value="followup">{t("Next follow-up")}</option>
						<option value="title">{t("Title")}</option>
					</Select>
					<Button variant={active ? "secondary" : "outline"} onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
						<SlidersHorizontal />
						<span className="max-sm:sr-only">{t("Filters")}</span>
						{active > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{active}</span>}
					</Button>
				</div>
			</div>
			<div className={cn("mb-4 grid gap-3 rounded-lg border border-border bg-surface p-3 sm:grid-cols-2 lg:grid-cols-4", !showFilters && !active && "hidden")}>
				<Select value={s.status} onChange={(e) => update({ status: e.target.value })} aria-label={t("Status")}>
					<option value="">{t("Any status")}</option>
					{boot.options.case_status.map((o) => (
						<option key={o} value={o}>
							{tv(o)}
						</option>
					))}
				</Select>
				<Select value={s.priority} onChange={(e) => update({ priority: e.target.value })} aria-label={t("Priority")}>
					<option value="">{t("Any priority")}</option>
					{boot.options.priority.map((o) => (
						<option key={o} value={o}>
							{tv(o)}
						</option>
					))}
				</Select>
				<LookupSelect doctype="Sijil Land" value={s.land} onChange={(v) => update({ land: v ?? "" })} placeholder={t("Any land / project")} />
				<div className="flex flex-wrap items-center gap-4 text-sm">
					<label className="flex items-center gap-2">
						<Checkbox checked={s.mine === "1"} onChange={(e) => update({ mine: e.target.checked ? "1" : "" })} />
						{t("My cases")}
					</label>
					<label className="flex items-center gap-2">
						<Checkbox checked={s.stale === "1"} onChange={(e) => update({ stale: e.target.checked ? "1" : "" })} />
						{t("Without recent updates")}
					</label>
				</div>
			</div>
			<Card className="px-3 py-1 sm:px-1">
				{query.isLoading ? (
					<LoadingRows rows={6} className="py-3" />
				) : query.error ? (
					<ErrorState error={query.error} onRetry={() => void query.refetch()} />
				) : !query.data?.rows.length ? (
					<EmptyState title={t("No cases found")} hint={t("Try a different search or filter.")} />
				) : (
					<CaseList rows={query.data.rows} />
				)}
			</Card>
			<Pager page={page} onPage={(p) => update({ page: String(p) }, { resetPage: false })} data={query.data} />
			<CaseFormDialog open={creating} onOpenChange={setCreating} defaultLand={s.land || undefined} />
		</>
	);
}
