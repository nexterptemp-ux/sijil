import { Link } from "react-router-dom";
import { Person } from "@/components/common";
import { EmptyState } from "@/components/states";
import { StateBadge } from "@/components/status";
import { Card, CardBody, CardHeader } from "@/components/ui/layout";
import type { CaseDetail } from "@/features/cases/api";
import { t } from "@/i18n";
import { formatDate } from "@/lib/format";

/** Open tasks of a case. */
export function CaseTasks({ caseDoc }: { caseDoc: CaseDetail }) {
	return (
		<Card>
			<CardHeader title={t("Open tasks")} />
			<CardBody className="py-0">
				{caseDoc.tasks.length === 0 ? (
					<EmptyState title={t("No open tasks for this case")} />
				) : (
					<ul className="divide-y divide-border">
						{caseDoc.tasks.map((task) => (
							<li key={task.name} className="flex flex-wrap items-center justify-between gap-2 py-3">
								<Link to={`/tasks/${task.name}`} className="font-medium hover:text-primary" dir="auto">
									{task.title}
								</Link>
								<span className="flex items-center gap-3 text-xs text-muted-foreground">
									{task.due_date && <span>{formatDate(task.due_date)}</span>}
									<Person name={task.assigned_to_name} fallback={task.assigned_to} />
									<StateBadge state={task.status} />
								</span>
							</li>
						))}
					</ul>
				)}
			</CardBody>
		</Card>
	);
}
