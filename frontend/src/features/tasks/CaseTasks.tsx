import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";
import { EmptyState, QueryView } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/layout";
import type { CaseDetail } from "@/features/cases/api";
import { t } from "@/i18n";
import { taskKeys, tasksApi } from "./api";
import { TaskFormDialog, type TaskPrefill } from "./TaskFormDialog";
import { TaskList } from "./TaskList";

/** Open tasks of a case, or of a land. */
export function RelatedTasks({ filter, prefill, canCreate, allLink }: { filter: { case?: string; land?: string }; prefill: TaskPrefill; canCreate: boolean; allLink: string }) {
	const [creating, setCreating] = React.useState(false);
	const filters = { ...filter, scope: "open" as const, page_length: 10 };
	const query = useQuery({ queryKey: taskKeys.list(filters), queryFn: () => tasksApi.list(filters) });
	return (
		<Card>
			<CardHeader
				title={t("Open tasks")}
				action={
					<span className="flex items-center gap-3">
						<Link to={allLink} className="text-xs text-primary hover:underline">
							{t("View all")}
						</Link>
						{canCreate && (
							<Button size="sm" variant="outline" onClick={() => setCreating(true)}>
								<Plus />
								{t("New Task")}
							</Button>
						)}
					</span>
				}
			/>
			<CardBody className="py-0">
				<QueryView query={query}>
					{(data) => (data.rows.length ? <TaskList rows={data.rows} showContext={!filter.case} /> : <EmptyState title={t("No open tasks")} />)}
				</QueryView>
			</CardBody>
			<TaskFormDialog open={creating} onOpenChange={setCreating} prefill={prefill} navigateOnCreate={false} />
		</Card>
	);
}

export function CaseTasks({ caseDoc }: { caseDoc: CaseDetail }) {
	return (
		<RelatedTasks
			filter={{ case: caseDoc.name }}
			prefill={{ case: caseDoc.name, case_title: caseDoc.title, land: caseDoc.land, land_name: caseDoc.land_name }}
			canCreate={caseDoc.can_write}
			allLink={`/tasks?land=${caseDoc.land}&scope=all`}
		/>
	);
}
