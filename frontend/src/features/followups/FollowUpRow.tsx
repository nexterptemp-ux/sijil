import { CalendarClock } from "lucide-react";
import type * as React from "react";
import { Link } from "react-router-dom";
import { useBoot } from "@/app/boot";
import { Person } from "@/components/common";
import { PriorityBadge, StateBadge } from "@/components/status";
import { t } from "@/i18n";
import type { FollowUp } from "@/lib/api/types";
import { formatDate, relativeDays } from "@/lib/format";
import { cn } from "@/lib/utils";

/** One follow-up in a list: what, where, who, when — plus optional actions. */
export function FollowUpRow({
	followup,
	actions,
	showContext = true,
	className,
}: {
	followup: FollowUp;
	actions?: React.ReactNode;
	showContext?: boolean;
	className?: string;
}) {
	const { boot } = useBoot();
	const f = followup;
	const open = f.status === "Open";
	return (
		<div className={cn("flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4", className)}>
			<div className="min-w-0 flex-1 space-y-1">
				<div className="flex flex-wrap items-center gap-2">
					<span className="font-semibold" dir="auto">
						{f.title}
					</span>
					<StateBadge state={f.state} />
					<PriorityBadge priority={f.priority} />
				</div>
				<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
					{showContext && f.case && (
						<Link to={`/cases/${f.case}`} className="hover:text-primary" dir="auto">
							{f.case_title || f.case}
						</Link>
					)}
					{showContext && f.land && (
						<Link to={`/lands/${f.land}`} className="hover:text-primary" dir="auto">
							{f.land_name || f.land}
						</Link>
					)}
					<span className="inline-flex items-center gap-1">
						<CalendarClock className="size-3.5" aria-hidden />
						{formatDate(f.due_date)}
						{open && <span>· {relativeDays(boot.today, f.due_date)}</span>}
					</span>
					<Person name={f.assigned_to_name} fallback={f.assigned_to} />
				</div>
				{!open && f.outcome && (
					<p className="text-xs" dir="auto">
						<span className="text-muted-foreground">{t("Outcome")}: </span>
						{f.outcome}
					</p>
				)}
			</div>
			{actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
		</div>
	);
}
