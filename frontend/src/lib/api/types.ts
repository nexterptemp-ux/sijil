// Types shared by several features. Feature-specific types live in features/<area>/types.ts.

export interface Page<T> {
	total: number;
	rows: T[];
	start: number;
	page_length: number;
	has_more: boolean;
}

export type Priority = "Low" | "Medium" | "High" | "Urgent";
export type CaseStatus = "Not Started" | "In Progress" | "Awaiting Action" | "On Hold" | "Completed" | "Cancelled";
export type FollowUpStatus = "Open" | "Completed" | "Cancelled";
export type FollowUpState = "Upcoming" | "Due Today" | "Overdue" | "Completed" | "Cancelled";
export type TaskStatus = "Open" | "In Progress" | "Completed" | "Cancelled";

export interface Bootstrap {
	today: string;
	user: { name: string; full_name: string; is_manager: boolean; image?: string | null };
	lang: string;
	settings: { stale_case_days: number; default_reminder_days: number; restrict_to_assigned_lands: number };
	options: {
		case_status: CaseStatus[];
		priority: Priority[];
		land_status: string[];
		event_type: string[];
		communication_method: string[];
		task_status: TaskStatus[];
		document_type: string[];
		organization_type: string[];
	};
	case_types: string[];
	can_create: Record<"Sijil Land" | "Sijil Case" | "Sijil Task" | "Sijil Follow Up" | "Sijil Document", boolean>;
}

export interface FollowUp {
	name: string;
	title: string;
	case?: string | null;
	case_title?: string | null;
	land?: string | null;
	land_name?: string | null;
	assigned_to: string;
	assigned_to_name?: string | null;
	due_date: string;
	priority: Priority;
	status: FollowUpStatus;
	completion_date?: string | null;
	state: FollowUpState;
	description?: string | null;
	outcome?: string | null;
	result_event?: string | null;
	next_followup?: string | null;
}

export interface DocumentVersionRef {
	name: string;
	version_no: number;
	file: string;
	file_name: string;
	file_size: number;
	creation: string;
	uploaded_by?: string;
}

export interface LinkedDocument {
	link: string;
	document: string;
	title: string;
	document_type?: string | null;
	land: string;
	is_confidential: number;
	follow_latest: number;
	note?: string | null;
	linked_by?: string;
	linked_on?: string;
	version: DocumentVersionRef | null;
	has_newer_version: boolean;
	current_version_no: number;
}

export interface Option {
	value: string;
	label: string;
}

export interface UserOption {
	name: string;
	full_name: string;
	user_image?: string | null;
}

/** Doctypes accepted by meta.lookup */
export type LookupDoctype =
	| "Sijil Land"
	| "Sijil Case"
	| "Sijil Case Event"
	| "Sijil External Organization"
	| "Sijil Case Type"
	| "Contact"
	| "Project"
	| "Company";

/** Doctypes a document can be linked to */
export type LinkableDoctype = "Sijil Land" | "Sijil Case" | "Sijil Case Event" | "Sijil Task" | "Sijil Follow Up";
