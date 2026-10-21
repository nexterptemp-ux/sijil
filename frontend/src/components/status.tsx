// Consistent pills for statuses, priorities and derived due states across the app.
import { Flag } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/layout";
import { tv } from "@/i18n";

const CASE_TONE: Record<string, BadgeTone> = {
	"Not Started": "neutral",
	"In Progress": "primary",
	"Awaiting Action": "warning",
	"On Hold": "neutral",
	Completed: "success",
	Cancelled: "neutral",
};

const STATE_TONE: Record<string, BadgeTone> = {
	Upcoming: "primary",
	"Due Today": "warning",
	Overdue: "danger",
	Completed: "success",
	Cancelled: "neutral",
	Open: "primary",
	"In Progress": "primary",
	Active: "success",
	"On Hold": "warning",
	Archived: "neutral",
};

const PRIORITY_TONE: Record<string, BadgeTone> = {
	Low: "neutral",
	Medium: "neutral",
	High: "warning",
	Urgent: "danger",
};

export function CaseStatusBadge({ status }: { status?: string | null }) {
	if (!status) return null;
	return (
		<Badge tone={CASE_TONE[status] ?? "neutral"} dot>
			{tv(status)}
		</Badge>
	);
}

/** Follow-up derived state, task status, land status. */
export function StateBadge({ state }: { state?: string | null }) {
	if (!state) return null;
	return (
		<Badge tone={STATE_TONE[state] ?? "neutral"} dot>
			{tv(state)}
		</Badge>
	);
}

export function PriorityBadge({ priority, hideNormal = true }: { priority?: string | null; hideNormal?: boolean }) {
	if (!priority || (hideNormal && (priority === "Medium" || priority === "Low"))) return null;
	return (
		<Badge tone={PRIORITY_TONE[priority] ?? "neutral"}>
			<Flag className="size-3" aria-hidden />
			{tv(priority)}
		</Badge>
	);
}
