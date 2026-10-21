// sijil.api.reports
import { call, methodUrl } from "@/lib/api/client";

export interface ReportColumn {
	fieldname: string;
	label: string;
	fieldtype: string;
	options?: string | null;
	width?: number;
}

export interface ReportResult {
	key: string;
	name: string;
	columns: ReportColumn[];
	rows: Record<string, unknown>[];
}

export const reportsApi = {
	available: () => call<{ key: string; name: string }[]>("reports.available"),
	run: (report: string, filters: Record<string, string>) => call<ReportResult>("reports.run", { report, filters }),
	caseHistory: (caseName: string) =>
		call<{ title: string; html: string }>("reports.case_history", { case: caseName }),
	landHistory: (land: string) => call<{ title: string; html: string }>("reports.land_history", { land }),
	casePdfUrl: (caseName: string) => methodUrl("reports.case_history_pdf", { case: caseName }),
	landPdfUrl: (land: string) => methodUrl("reports.land_history_pdf", { land }),
};

export const reportKeys = {
	available: ["reports", "available"] as const,
	run: (key: string, filters: Record<string, string>) => ["reports", "run", key, filters] as const,
	history: (kind: string, name: string) => ["reports", "history", kind, name] as const,
};

/** Filters each operational report accepts (see sijil/services/reports.py). */
export const REPORT_FILTERS: Record<string, ("land" | "assigned_to" | "days")[]> = {
	overdue_followups: ["land", "assigned_to"],
	upcoming_followups: ["land", "assigned_to"],
	open_cases_by_employee: ["land"],
	case_status_by_project: ["land"],
	outstanding_tasks: ["land", "assigned_to"],
	stale_cases: ["land", "days"],
};
