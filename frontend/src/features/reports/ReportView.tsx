import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "@/components/common";
import { Field, LookupSelect, UserSelect, useUsers } from "@/components/fields";
import { EmptyState, ErrorState, LoadingRows } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/layout";
import { t, tv } from "@/i18n";
import { formatDate, formatNumber } from "@/lib/format";
import { useUrlState } from "@/lib/hooks";
import { REPORT_FILTERS, reportKeys, reportsApi, type ReportColumn } from "./api";

const LINKS: Record<string, string> = {
	"Sijil Case": "/cases/",
	"Sijil Land": "/lands/",
	"Sijil Task": "/tasks/",
};

/** One operational report: server-defined columns, filters in the URL, CSV export. */
export function ReportView() {
	const { report = "" } = useParams();
	const [s, update] = useUrlState({ land: "", assigned_to: "", days: "" });
	const filters = Object.fromEntries(Object.entries(s).filter(([, v]) => v)) as Record<string, string>;
	const query = useQuery({ queryKey: reportKeys.run(report, filters), queryFn: () => reportsApi.run(report, filters) });
	const users = useUsers();
	const userName = (id: unknown) => users.data?.find((u) => u.name === id)?.full_name ?? String(id ?? "");
	const allowed = REPORT_FILTERS[report] ?? [];

	const display = (col: ReportColumn, value: unknown): string => {
		if (value === null || value === undefined || value === "") return "—";
		if (col.fieldtype === "Date") return formatDate(String(value));
		if (col.fieldtype === "Int" || col.fieldtype === "Float") return formatNumber(Number(value));
		if (col.fieldtype === "Link" && col.options === "User") return userName(value);
		if (col.fieldname === "status" || col.fieldname === "priority") return tv(String(value));
		return String(value);
	};

	const cell = (col: ReportColumn, row: Record<string, unknown>) => {
		const value = row[col.fieldname];
		const base = col.fieldtype === "Link" && col.options ? LINKS[col.options] : undefined;
		const text = display(col, value);
		if (base && value)
			return (
				<Link to={`${base}${String(value)}`} className="text-primary hover:underline" dir="auto">
					{col.fieldname === "name" && typeof row.title === "string" ? String(value) : text}
				</Link>
			);
		return <span dir="auto">{text}</span>;
	};

	const exportCsv = () => {
		if (!query.data) return;
		const { columns, rows } = query.data;
		const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
		const lines = [columns.map((c) => esc(c.label)).join(","), ...rows.map((r) => columns.map((c) => esc(display(c, r[c.fieldname]))).join(","))];
		// BOM so Excel opens Arabic text correctly.
		const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = `${report}.csv`;
		a.click();
		URL.revokeObjectURL(a.href);
	};

	return (
		<>
			<PageHeader
				back={{ to: "/reports", label: t("Reports") }}
				title={query.data ? tv(query.data.name) : t("Report")}
				subtitle={query.data ? t("{0} rows", formatNumber(query.data.rows.length)) : undefined}
				actions={
					<Button variant="outline" onClick={exportCsv} disabled={!query.data?.rows.length}>
						<Download />
						{t("Export CSV")}
					</Button>
				}
			/>
			{allowed.length > 0 && (
				<div className="mb-4 grid gap-3 sm:grid-cols-3">
					{allowed.includes("land") && (
						<Field label={t("Land / Project")} htmlFor="rf_land">
							<LookupSelect id="rf_land" doctype="Sijil Land" value={s.land} onChange={(v) => update({ land: v ?? "" })} placeholder={t("Any land / project")} />
						</Field>
					)}
					{allowed.includes("assigned_to") && (
						<Field label={t("Assigned To")} htmlFor="rf_user">
							<UserSelect id="rf_user" value={s.assigned_to} onChange={(v) => update({ assigned_to: v ?? "" })} placeholder={t("Anyone")} />
						</Field>
					)}
					{allowed.includes("days") && (
						<Field label={t("No update for more than (days)")} htmlFor="rf_days">
							<Input id="rf_days" type="number" min={1} value={s.days} onChange={(e) => update({ days: e.target.value })} />
						</Field>
					)}
				</div>
			)}
			{query.isLoading ? (
				<LoadingRows rows={6} />
			) : query.error ? (
				<ErrorState error={query.error} onRetry={() => void query.refetch()} />
			) : !query.data?.rows.length ? (
				<EmptyState title={t("Nothing to report")} />
			) : (
				<>
					<Card className="hidden overflow-x-auto md:block">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-border text-xs text-muted-foreground">
									{query.data.columns.map((c) => (
										<th key={c.fieldname} className="whitespace-nowrap px-3 py-2 text-start font-semibold">
											{c.label}
										</th>
									))}
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{query.data.rows.map((row, i) => (
									<tr key={i} className="hover:bg-muted/50">
										{query.data.columns.map((c) => (
											<td key={c.fieldname} className="px-3 py-2 align-top">
												{cell(c, row)}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</Card>
					<ul className="space-y-2 md:hidden">
						{query.data.rows.map((row, i) => (
							<li key={i}>
								<Card className="p-3">
									<dl className="space-y-1 text-sm">
										{query.data.columns.map((c) => (
											<div key={c.fieldname} className="flex justify-between gap-3">
												<dt className="shrink-0 text-xs text-muted-foreground">{c.label}</dt>
												<dd className="min-w-0 text-end">{cell(c, row)}</dd>
											</div>
										))}
									</dl>
								</Card>
							</li>
						))}
					</ul>
				</>
			)}
		</>
	);
}
