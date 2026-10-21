import { AlarmClock, CalendarCheck2, CalendarClock, CalendarX2, CircleSlash } from "lucide-react";
import type * as React from "react";
import { Link } from "react-router-dom";
import { useBoot } from "@/app/boot";
import { Person } from "@/components/common";
import { PriorityBadge, StateBadge } from "@/components/status";
import { t } from "@/i18n";
import type { FollowUp } from "@/lib/api/types";
import { formatDate, relativeDays } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATE_STYLE: Record<string, { icon: React.ComponentType<{ className?: string }>; chip: string; date: string }> = {
	Overdue: { icon: CalendarX2, chip: "bg-danger-soft text-danger", date: "text-danger" },
	"Due Today": { icon: AlarmClock, chip: "bg-warning-soft text-warning", date: "text-warning" },
	Upcoming: { icon: CalendarClock, chip: "bg-primary-soft text-primary", date: "text-foreground/80" },
	Completed: { icon: CalendarCheck2, chip: "bg-success-soft text-success", date: "text-muted-foreground" },
	Cancelled: { icon: CircleSlash, chip: "bg-muted text-muted-foreground", date: "text-muted-foreground" },
};

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
	const style = STATE_STYLE[f.state] ?? STATE_STYLE.Upcoming!;
	const Icon = style.icon;
	return (
		<div className={cn("flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:gap-4", className)}>
			<div className="flex min-w-0 flex-1 gap-3">
				<span
					className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl", style.chip)}
					aria-hidden
				>
					<Icon className="size-[18px]" />
				</span>
				<div className="min-w-0 flex-1 space-y-1">
					<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
						<span className="font-semibold leading-snug" dir="auto">
							{f.title}
						</span>
						<PriorityBadge priority={f.priority} />
					</div>
					{showContext && (f.case || f.land) && (
						<div className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
							{f.case && (
								<Link to={`/cases/${f.case}`} className="font-medium hover:text-primary" dir="auto">
									{f.case_title || f.case}
								</Link>
							)}
							{f.case && f.land && <span aria-hidden>·</span>}
							{f.land && (
								<Link to={`/lands/${f.land}`} className="hover:text-primary" dir="auto">
									{f.land_name || f.land}
								</Link>
							)}
						</div>
					)}
					<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
						<span className={cn("tabular inline-flex items-center gap-1 font-semibold", style.date)}>
							{formatDate(f.due_date)}
							{open && (
								<span className="font-medium opacity-80">· {relativeDays(boot.today, f.due_date)}</span>
							)}
						</span>
						{!open && <StateBadge state={f.state} />}
						<span className="text-muted-foreground">
							<Person name={f.assigned_to_name} fallback={f.assigned_to} />
						</span>
					</div>
					{!open && f.outcome && (
						<p className="rounded-lg bg-muted/70 px-2.5 py-1.5 text-xs leading-5" dir="auto">
							<span className="font-semibold text-muted-foreground">{t("Outcome")}: </span>
							{f.outcome}
						</p>
					)}
				</div>
			</div>
			{actions && <div className="flex shrink-0 flex-wrap gap-2 ps-12 sm:ps-0">{actions}</div>}
		</div>
	);
}
