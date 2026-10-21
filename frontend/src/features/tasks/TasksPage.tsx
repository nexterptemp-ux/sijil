import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
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
import { taskKeys, tasksApi, type TaskFilters, type TaskScope } from "./api";
import { TaskFormDialog } from "./TaskFormDialog";
import { TaskList } from "./TaskList";

const PAGE = 20;

export function TasksPage() {
	const [s, update] = useUrlState({ scope: "open", mine: "", search: "", land: "", page: "0" });
	const page = Number(s.page) || 0;
	const mine = s.mine === "1";
	const [creating, setCreating] = React.useState(false);
	const filters: TaskFilters = { scope: s.scope as TaskScope, mine, search: s.search, land: s.land, start: page * PAGE, page_length: PAGE };
	const query = useQuery({ queryKey: taskKeys.list(filters), queryFn: () => tasksApi.list(filters), placeholderData: keepPreviousData });
	const counts = useQuery({ queryKey: taskKeys.counts(mine), queryFn: () => tasksApi.counts(mine) });
	const scopes: { key: TaskScope; label: string; n?: number }[] = [
		{ key: "open", label: t("Open"), n: counts.data?.open },
		{ key: "overdue", label: t("Overdue"), n: counts.data?.overdue },
		{ key: "completed", label: t("Completed"), n: counts.data?.completed },
		{ key: "cancelled", label: t("Cancelled") },
		{ key: "all", label: t("All") },
	];

	return (
		<>
			<PageHeader
				title={t("Tasks")}
				subtitle={t("Ordinary work — with or without a case")}
				actions={
					<Button onClick={() => setCreating(true)}>
						<Plus />
						{t("New Task")}
					</Button>
				}
			/>
			<div className="-mx-4 mb-3 overflow-x-auto px-4" role="tablist" aria-label={t("Show")}>
				<div className="flex w-max gap-1.5">
					{scopes.map((scope) => {
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
									active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-muted-foreground hover:text-foreground",
								)}
							>
								{scope.label}
								{scope.n !== undefined && (
									<span className={cn("rounded-full px-1.5 text-[11px]", active ? "bg-white/20" : scope.key === "overdue" && scope.n > 0 ? "bg-danger-soft text-danger" : "bg-muted")}>
										{formatNumber(scope.n)}
									</span>
								)}
							</button>
						);
					})}
				</div>
			</div>
			<div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
				<SearchInput value={s.search} onChange={(search) => update({ search })} placeholder={t("Search tasks")} className="flex-1" />
				<div className="sm:w-64">
					<LookupSelect doctype="Sijil Land" value={s.land} onChange={(v) => update({ land: v ?? "" })} placeholder={t("Any land / project")} />
				</div>
				<label className="flex items-center gap-2 text-sm">
					<Checkbox checked={mine} onChange={(e) => update({ mine: e.target.checked ? "1" : "" })} />
					{t("Assigned to me")}
				</label>
			</div>
			<Card className="px-4">
				{query.isLoading ? (
					<LoadingRows rows={5} className="py-4" />
				) : query.error ? (
					<ErrorState error={query.error} onRetry={() => void query.refetch()} />
				) : !query.data?.rows.length ? (
					<EmptyState title={t("No tasks here")} />
				) : (
					<TaskList rows={query.data.rows} />
				)}
			</Card>
			<Pager page={page} onPage={(p) => update({ page: String(p) }, { resetPage: false })} data={query.data} />
			<TaskFormDialog open={creating} onOpenChange={setCreating} prefill={s.land ? { land: s.land } : undefined} />
		</>
	);
}
