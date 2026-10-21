import { CalendarClock } from "lucide-react";
import { Link } from "react-router-dom";
import { Person } from "@/components/common";
import { PriorityBadge, StateBadge } from "@/components/status";
import { t } from "@/i18n";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TaskRow } from "./api";

export function TaskList({ rows, showContext = true }: { rows: TaskRow[]; showContext?: boolean }) {
	return (
		<ul className="divide-y divide-border">
			{rows.map((task) => (
				<li key={task.name}>
					<Link to={`/tasks/${task.name}`} className="flex flex-col gap-1.5 py-3 hover:bg-muted/40 active:bg-muted sm:flex-row sm:items-center sm:gap-4">
						<div className="min-w-0 flex-1">
							<div className="flex flex-wrap items-center gap-2">
								<span className={cn("font-semibold", task.status === "Completed" && "text-muted-foreground line-through")} dir="auto">
									{task.title}
								</span>
								<StateBadge state={task.overdue ? "Overdue" : task.status} />
								<PriorityBadge priority={task.priority} />
							</div>
							{showContext && (task.case_title || task.land_name) && (
								<div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground" dir="auto">
									{task.case_title && <span>{task.case_title}</span>}
									{task.land_name && <span>{task.land_name}</span>}
								</div>
							)}
						</div>
						<div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
							{task.due_date && (
								<span className={cn("inline-flex items-center gap-1", task.overdue && "font-semibold text-danger")}>
									<CalendarClock className="size-3.5" aria-hidden />
									{formatDate(task.due_date)}
								</span>
							)}
							{task.completed_on && <span>{t("Completed {0}", formatDate(task.completed_on))}</span>}
							<Person name={task.assigned_to_name} fallback={task.assigned_to} />
						</div>
					</Link>
				</li>
			))}
		</ul>
	);
}
