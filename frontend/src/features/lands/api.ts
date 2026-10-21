// sijil.api.lands
import { call } from "@/lib/api/client";
import type { Page } from "@/lib/api/types";
import { compact } from "@/lib/utils";

export interface LandRow {
	name: string;
	land_name: string;
	land_code?: string | null;
	status: string;
	city?: string | null;
	company?: string | null;
	project?: string | null;
	modified: string;
	open_cases: number;
	total_cases: number;
	open_followups: number;
	overdue_followups: number;
	documents: number;
}

export interface Land {
	name: string;
	land_name: string;
	land_code?: string | null;
	status: string;
	city?: string | null;
	company?: string | null;
	project?: string | null;
	location?: string | null;
	description?: string | null;
	notes?: string | null;
	root_folder?: string | null;
	responsibles: { user: string; full_name: string; responsibility?: string | null }[];
	organizations: { organization: string; role?: string | null; organization_type?: string | null }[];
	stats: {
		cases_total: number;
		cases_open: number;
		cases_stale: number;
		followups_open: number;
		followups_overdue: number;
		tasks_open: number;
		documents: number;
		events: number;
	};
	can_write: boolean;
	modified?: string;
}

export interface LandActivity {
	name: string;
	title: string;
	case: string;
	case_title?: string | null;
	event_date: string;
	event_type: string;
	recorded_by: string;
	recorded_by_name?: string | null;
	is_milestone: number;
}

export interface LandInput {
	name?: string;
	land_name: string;
	land_code?: string;
	status?: string;
	city?: string;
	company?: string | null;
	location?: string;
	description?: string;
	notes?: string;
	project?: string | null;
	responsibles?: { user: string; responsibility?: string }[];
	organizations?: { organization: string; role?: string }[];
	create_project?: number;
}

export const landsApi = {
	list: (f: { search?: string; status?: string; start?: number; page_length?: number }) =>
		call<Page<LandRow>>("lands.list_lands", compact(f)),
	get: (name: string) => call<Land>("lands.get_land", { name }),
	activity: (land: string, start = 0, page_length = 15) =>
		call<Page<LandActivity>>("lands.land_activity", { land, start, page_length }),
	save: (data: LandInput) => call<{ name: string }>("lands.save_land", { data }),
	createProject: (land: string) => call<{ project: string }>("lands.create_project", { land }),
};

export const landKeys = {
	all: ["lands"] as const,
	list: (f: object) => ["lands", "list", f] as const,
	detail: (name: string) => ["lands", "detail", name] as const,
	activity: (name: string) => ["lands", "activity", name] as const,
};
