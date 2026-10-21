import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CalendarPlus, X } from "lucide-react";
import * as React from "react";
import { PageHeader, Pager, SearchInput } from "@/components/common";
import { LookupSelect } from "@/components/fields";
import { EmptyState, ErrorState, LoadingRows } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/input";
import { Card } from "@/components/ui/layout";
import { t } from "@/i18n";
import { formatNumber } from "@/lib/format";
import { useUrlState } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { followupKeys, followupsApi, type FollowUpFilters, type FollowUpScope } from "./api";
import { FollowUpActions } from "./FollowUpActions";
import { FollowUpFormDialog } from "./FollowUpFormDialog";
import { FollowUpRow } from "./FollowUpRow";

const PAGE = 20;
const scopes = (): {
	key: FollowUpScope;
	label: string;
	count?: "overdue" | "today" | "upcoming" | "open" | "completed";
}[] => [
	{ key: "overdue", label: t("Overdue"), count: "overdue" },
	{ key: "today", label: t("Due Today"), count: "today" },
	{ key: "week", label: t("This week") },
	{ key: "upcoming", label: t("Upcoming"), count: "upcoming" },
	{ key: "open", label: t("All open"), count: "open" },
	{ key: "completed", label: t("Completed"), count: "completed" },
	{ key: "cancelled", label: t("Cancelled") },
	{ key: "all", label: t("All") },
];

export function FollowUpsPage() {
	const [s, update] = useUrlState({ scope: "open", mine: "", search: "", land: "", case: "", page: "0" });
	const page = Number(s.page) || 0;
	const mine = s.mine === "1";
	const [creating, setCreating] = React.useState(false);
	const filters: FollowUpFilters = {
		scope: s.scope as FollowUpScope,
		mine,
		search: s.search,
		land: s.land,
		case: s.case,
		start: page * PAGE,
		page_length: PAGE,
	};
	const query = useQuery({
		queryKey: followupKeys.list(filters),
		queryFn: () => followupsApi.list(filters),
		placeholderData: keepPreviousData,
	});
	const counts = useQuery({ queryKey: followupKeys.counts(mine), queryFn: () => followupsApi.counts(mine) });

	return (
		<>
			<PageHeader
				title={t("Follow-ups")}
				subtitle={t("What needs to be checked, by whom and when")}
				actions={
					<Button onClick={() => setCreating(true)}>
						<CalendarPlus />
						{t("Plan follow-up")}
					</Button>
				}
			/>
			<div className="-mx-4 mb-3 overflow-x-auto px-4" role="tablist" aria-label={t("Show")}>
				<div className="flex w-max gap-1.5">
					{scopes().map((scope) => {
						const n = scope.count ? counts.data?.[scope.count] : undefined;
						const active = s.scope === scope.key;
						return (
							<button
								key={scope.key}
								type="button"
								role="tab"
								aria-selected={active}
								onClick={() => update({ scope: scope.key })}
								className={cn(
									"flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium",
									active
										? "border-primary bg-primary text-primary-foreground"
										: "border-border bg-surface text-muted-foreground hover:text-foreground",
								)}
							>
								{scope.label}
								{n !== undefined && (
									<span
										className={cn(
											"rounded-full px-1.5 text-[11px]",
											active
												? "bg-white/20"
												: scope.key === "overdue" && n > 0
													? "bg-danger-soft text-danger"
													: "bg-muted",
										)}
									>
										{formatNumber(n)}
									</span>
								)}
							</button>
						);
					})}
				</div>
			</div>
			<div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
				<SearchInput
					value={s.search}
					onChange={(search) => update({ search })}
					placeholder={t("Search follow-ups")}
					className="flex-1"
				/>
				<div className="sm:w-64">
					<LookupSelect
						doctype="Sijil Land"
						value={s.land}
						onChange={(v) => update({ land: v ?? "", case: "" })}
						placeholder={t("Any land / project")}
					/>
				</div>
				<label className="flex items-center gap-2 text-sm">
					<Checkbox checked={mine} onChange={(e) => update({ mine: e.target.checked ? "1" : "" })} />
					{t("Assigned to me")}
				</label>
			</div>
			{s.case && (
				<div className="mb-3">
					<button
						type="button"
						onClick={() => update({ case: "" })}
						className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary"
					>
						{t("Case")}: {s.case}
						<X className="size-3.5" aria-label={t("Clear")} />
					</button>
				</div>
			)}
			<Card className="px-4">
				{query.isLoading ? (
					<LoadingRows rows={5} className="py-4" />
				) : query.error ? (
					<ErrorState error={query.error} onRetry={() => void query.refetch()} />
				) : !query.data?.rows.length ? (
					<EmptyState
						title={t("No follow-ups here")}
						hint={s.scope === "overdue" ? t("Well done — all follow-ups are on schedule.") : undefined}
					/>
				) : (
					<div className="divide-y divide-border">
						{query.data.rows.map((f) => (
							<FollowUpRow key={f.name} followup={f} actions={<FollowUpActions followup={f} />} />
						))}
					</div>
				)}
			</Card>
			<Pager page={page} onPage={(p) => update({ page: String(p) }, { resetPage: false })} data={query.data} />
			<FollowUpFormDialog
				open={creating}
				onOpenChange={setCreating}
				prefill={s.land ? { land: s.land } : undefined}
			/>
		</>
	);
}
