// sijil.api.cases
import { call } from "@/lib/api/client";
import type { CaseStatus, FollowUp, LinkedDocument, Page, Priority } from "@/lib/api/types";
import { compact } from "@/lib/utils";

export interface CaseRow {
	name: string;
	title: string;
	reference_no?: string | null;
	land: string;
	land_name?: string | null;
	case_type?: string | null;
	status: CaseStatus;
	priority: Priority;
	owner_user: string;
	owner_name?: string | null;
	current_situation?: string | null;
	external_organization?: string | null;
	last_update_date?: string | null;
	next_followup_date?: string | null;
	start_date?: string | null;
	target_date?: string | null;
	modified: string;
}

export interface CaseDetail extends CaseRow {
	description?: string | null;
	external_contact?: string | null;
	external_contact_name?: string | null;
	external_organization_name?: string | null;
	situation_updated_on?: string | null;
	project?: string | null;
	relations: { related_case: string; relation_type: string; title?: string | null; status?: string | null }[];
	open_followups: FollowUp[];
	tasks: {
		name: string;
		title: string;
		status: string;
		priority: string;
		due_date?: string | null;
		assigned_to: string;
		assigned_to_name?: string | null;
	}[];
	documents: LinkedDocument[];
	stats: { events: number; followups_total: number; followups_done: number; tasks_open: number; documents: number };
	last_event: { name: string; title: string; event_date: string; recorded_by: string } | null;
	can_write: boolean;
}

export interface CaseEvent {
	name: string;
	case?: string;
	title: string;
	description?: string | null;
	event_date: string;
	event_time?: string | null;
	event_type: string;
	communication_method?: string | null;
	external_organization?: string | null;
	outcome?: string | null;
	situation_update?: string | null;
	status_after?: string | null;
	is_milestone: number;
	recorded_by: string;
	recorded_by_name?: string | null;
	recorded_on: string;
	entry_status: "Active" | "Superseded";
	corrects?: string | null;
	superseded_by?: string | null;
	correction_reason?: string | null;
	source_followup?: string | null;
	documents: LinkedDocument[];
}

export type CaseOrder = "updated" | "stale" | "followup" | "title";

export interface CaseFilters {
	search?: string;
	land?: string;
	status?: string;
	priority?: string;
	owner?: string;
	mine?: boolean;
	stale?: boolean;
	scope?: "open" | "closed";
	order?: CaseOrder;
	start?: number;
	page_length?: number;
}

export interface CaseInput {
	name?: string;
	title?: string;
	reference_no?: string;
	land?: string;
	case_type?: string | null;
	status?: string;
	priority?: string;
	owner_user?: string | null;
	external_organization?: string | null;
	external_contact?: string | null;
	start_date?: string | null;
	target_date?: string | null;
	description?: string;
	current_situation?: string;
	relations?: { related_case: string; relation_type: string }[];
}

export interface EventInput {
	case: string;
	event_date: string;
	event_time?: string;
	title: string;
	description?: string;
	event_type: string;
	communication_method?: string;
	external_organization?: string | null;
	outcome?: string;
	situation_update?: string;
	status_after?: string;
	is_milestone?: number;
	documents?: Array<string | { document: string; version?: string; follow_latest?: number }>;
}

export const casesApi = {
	list: (f: CaseFilters) =>
		call<Page<CaseRow>>(
			"cases.list_cases",
			compact({ ...f, mine: f.mine ? 1 : undefined, stale: f.stale ? 1 : undefined }),
		),
	get: (name: string) => call<CaseDetail>("cases.get_case", { name }),
	events: (caseName: string, start = 0, page_length = 15, include_superseded = true) =>
		call<Page<CaseEvent>>("cases.list_events", {
			case: caseName,
			start,
			page_length,
			include_superseded: include_superseded ? 1 : 0,
		}),
	save: (data: CaseInput) => call<{ name: string }>("cases.save_case", { data }),
	recordEvent: (data: EventInput) => call<{ name: string }>("cases.record_event", { data }),
	correctEvent: (name: string, data: Partial<EventInput>, reason: string) =>
		call<{ name: string }>("cases.correct_event", { name, data, reason }),
	updateSituation: (caseName: string, situation: string, status?: string, title?: string) =>
		call<{ name: string }>("cases.update_situation", compact({ case: caseName, situation, status, title })),
};

export const caseKeys = {
	all: ["cases"] as const,
	list: (f: CaseFilters) => ["cases", "list", f] as const,
	detail: (name: string) => ["cases", "detail", name] as const,
	events: (name: string, superseded: boolean) => ["cases", "events", name, superseded] as const,
};
