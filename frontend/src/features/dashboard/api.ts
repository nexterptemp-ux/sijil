// sijil.api.dashboard
import { call } from "@/lib/api/client";
import type { FollowUp } from "@/lib/api/types";

export interface Dashboard {
	today: string;
	stale_days: number;
	counts: {
		active_lands: number;
		open_cases: number;
		awaiting_action: number;
		overdue_followups: number;
		due_today_followups: number;
		upcoming_followups: number;
		open_tasks: number;
		overdue_tasks: number;
		stale_cases: number;
	};
	attention_followups: FollowUp[];
	upcoming_followups: FollowUp[];
	recent_events: {
		name: string;
		title: string;
		case: string;
		case_title?: string;
		land: string;
		land_name?: string;
		event_date: string;
		event_type: string;
		recorded_by: string;
		recorded_by_name?: string;
		is_milestone: number;
	}[];
	recent_documents: {
		name: string;
		title: string;
		land: string;
		land_name?: string;
		document_type?: string;
		creation: string;
		version_count: number;
	}[];
	stale_cases: {
		name: string;
		title: string;
		land: string;
		land_name?: string;
		owner_user: string;
		owner_name?: string;
		last_update_date?: string | null;
		status: string;
	}[];
}

export const dashboardApi = { get: () => call<Dashboard>("dashboard.get_dashboard") };
export const dashboardKeys = { main: ["dashboard"] as const };
