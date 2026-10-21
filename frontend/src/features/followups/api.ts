// sijil.api.followups
import { call } from "@/lib/api/client";
import type { FollowUp, Page, Priority } from "@/lib/api/types";
import { compact } from "@/lib/utils";

export type FollowUpScope = "open" | "overdue" | "today" | "upcoming" | "week" | "completed" | "cancelled" | "all";

export interface FollowUpFilters {
	scope?: FollowUpScope;
	case?: string;
	land?: string;
	assigned_to?: string;
	mine?: boolean;
	search?: string;
	start?: number;
	page_length?: number;
}

export interface FollowUpCounts {
	open: number;
	overdue: number;
	today: number;
	upcoming: number;
	completed: number;
}

export interface FollowUpInput {
	name?: string;
	title: string;
	description?: string;
	case?: string | null;
	land?: string | null;
	assigned_to?: string | null;
	due_date: string;
	priority?: Priority;
	originating_event?: string | null;
	reminder_days_before?: number | null;
}

export interface CompleteFollowUpInput {
	name: string;
	outcome: string;
	event?: {
		title?: string;
		event_type?: string;
		communication_method?: string;
		is_milestone?: number;
		situation_update?: string;
		status_after?: string;
	};
	next_followup?: {
		due_date: string;
		title?: string;
		description?: string;
		assigned_to?: string;
		priority?: Priority;
	} | null;
	documents?: Array<string | { document: string; version?: string }>;
}

export const followupsApi = {
	list: (f: FollowUpFilters) =>
		call<Page<FollowUp>>("followups.list_followups", compact({ ...f, mine: f.mine ? 1 : undefined })),
	counts: (mine = false) => call<FollowUpCounts>("followups.followup_counts", { mine: mine ? 1 : 0 }),
	save: (data: FollowUpInput) => call<{ name: string }>("followups.save_followup", { data }),
	complete: ({ name, ...rest }: CompleteFollowUpInput) =>
		call<{ followup: string; event: string | null; next_followup: string | null }>("followups.complete", {
			name,
			...rest,
		}),
	cancel: (name: string, reason?: string) => call<{ name: string }>("followups.cancel", { name, reason }),
	reschedule: (name: string, due_date: string, assigned_to?: string | null) =>
		call<{ name: string }>("followups.reschedule", compact({ name, due_date, assigned_to })),
};

export const followupKeys = {
	all: ["followups"] as const,
	list: (f: FollowUpFilters) => ["followups", "list", f] as const,
	counts: (mine: boolean) => ["followups", "counts", mine] as const,
};
