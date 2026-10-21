// sijil.api.tasks
import { call } from "@/lib/api/client";
import type { LinkedDocument, Page, Priority, TaskStatus } from "@/lib/api/types";
import { compact } from "@/lib/utils";

export type TaskScope = "open" | "overdue" | "completed" | "cancelled" | "all";

export interface TaskRow {
	name: string;
	title: string;
	status: TaskStatus;
	priority: Priority;
	assigned_to: string;
	assigned_to_name?: string | null;
	land?: string | null;
	land_name?: string | null;
	case?: string | null;
	case_title?: string | null;
	due_date?: string | null;
	start_date?: string | null;
	completed_on?: string | null;
	erpnext_task?: string | null;
	project?: string | null;
	overdue: boolean;
}

export interface TaskDetail extends Omit<TaskRow, "overdue"> {
	description?: string | null;
	case_event?: string | null;
	completion_notes?: string | null;
	updates: { update_on: string; user: string; user_name?: string | null; note: string }[];
	documents: LinkedDocument[];
	can_write: boolean;
}

export interface TaskInput {
	name?: string;
	title?: string;
	description?: string;
	land?: string | null;
	case?: string | null;
	case_event?: string | null;
	status?: TaskStatus;
	priority?: Priority;
	assigned_to?: string | null;
	start_date?: string | null;
	due_date?: string | null;
	completion_notes?: string;
}

export interface TaskFilters {
	scope?: TaskScope;
	land?: string;
	case?: string;
	assigned_to?: string;
	mine?: boolean;
	search?: string;
	start?: number;
	page_length?: number;
}

export const tasksApi = {
	list: (f: TaskFilters) => call<Page<TaskRow>>("tasks.list_tasks", compact({ ...f, mine: f.mine ? 1 : undefined })),
	counts: (mine = false) =>
		call<{ open: number; overdue: number; completed: number }>("tasks.task_counts", { mine: mine ? 1 : 0 }),
	get: (name: string) => call<TaskDetail>("tasks.get_task", { name }),
	save: (data: TaskInput) => call<{ name: string }>("tasks.save_task", { data }),
	setStatus: (name: string, status: TaskStatus, completion_notes?: string) =>
		call<{ name: string; status: TaskStatus }>("tasks.set_status", compact({ name, status, completion_notes })),
	addUpdate: (name: string, note: string) => call<{ name: string }>("tasks.add_update", { name, note }),
};

export const taskKeys = {
	all: ["tasks"] as const,
	list: (f: TaskFilters) => ["tasks", "list", f] as const,
	counts: (mine: boolean) => ["tasks", "counts", mine] as const,
	detail: (name: string) => ["tasks", "detail", name] as const,
};
