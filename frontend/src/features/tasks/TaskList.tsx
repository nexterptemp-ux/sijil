import { CalendarClock, CheckCircle2, Circle, Loader } from "lucide-react";
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
					<Link to={`/tasks/${task.name}`} className="group flex gap-3 py-3.5 sm:items-center sm:gap-4">
						<span
							className={cn(
								"mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl sm:mt-0",
								task.status === "Completed"
									? "bg-success-soft text-success"
									: task.overdue
										? "bg-danger-soft text-danger"
										: task.status === "In Progress"
											? "bg-primary-soft text-primary"
											: "bg-muted text-muted-foreground",
							)}
							aria-hidden
						>
							{task.status === "Completed" ? (
								<CheckCircle2 className="size-[18px]" />
							) : task.status === "In Progress" ? (
								<Loader className="size-[18px]" />
							) : (
								<Circle className="size-[18px]" />
							)}
						</span>
						<div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
							<div className="min-w-0 flex-1">
								<div className="flex flex-wrap items-center gap-2">
									<span
										className={cn(
											"font-semibold leading-snug group-hover:text-primary",
											task.status === "Completed" && "text-muted-foreground line-through",
										)}
										dir="auto"
									>
										{task.title}
									</span>
									<StateBadge state={task.overdue ? "Overdue" : task.status} />
									<PriorityBadge priority={task.priority} />
								</div>
								{showContext && (task.case_title || task.land_name) && (
									<div
										className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground"
										dir="auto"
									>
										{task.case_title && <span>{task.case_title}</span>}
										{task.land_name && <span>{task.land_name}</span>}
									</div>
								)}
							</div>
							<div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
								{task.due_date && (
									<span
										className={cn(
											"inline-flex items-center gap-1",
											task.overdue && "font-semibold text-danger",
										)}
									>
										<CalendarClock className="size-3.5" aria-hidden />
										{formatDate(task.due_date)}
									</span>
								)}
								{task.completed_on && <span>{t("Completed {0}", formatDate(task.completed_on))}</span>}
								<Person name={task.assigned_to_name} fallback={task.assigned_to} />
							</div>
						</div>
					</Link>
				</li>
			))}
		</ul>
	);
}
