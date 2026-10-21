import { useQuery } from "@tanstack/react-query";
import { BarChart3, FileClock } from "lucide-react";
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ForwardIcon, PageHeader } from "@/components/common";
import { Field, LookupSelect } from "@/components/fields";
import { QueryView } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/layout";
import { t, tv } from "@/i18n";
import { reportKeys, reportsApi } from "./api";

export function ReportsPage() {
	const query = useQuery({ queryKey: reportKeys.available, queryFn: reportsApi.available, staleTime: 10 * 60_000 });
	return (
		<>
			<PageHeader title={t("Reports")} subtitle={t("Operational lists and complete history reports")} />
			<div className="grid gap-6 lg:grid-cols-3">
				<div className="space-y-3 lg:col-span-2">
					<h2 className="text-sm font-bold text-muted-foreground">{t("Operational reports")}</h2>
					<QueryView query={query}>
						{(reports) => (
							<div className="grid gap-3 sm:grid-cols-2">
								{reports.map((r) => (
									<Link key={r.key} to={`/reports/${r.key}`} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
										<Card className="flex h-full items-center gap-3 p-4 hover:border-primary/40">
											<BarChart3 className="size-5 shrink-0 text-primary" aria-hidden />
											<span className="flex-1 font-semibold">{tv(r.name)}</span>
											<ForwardIcon className="size-4 text-muted-foreground" />
										</Card>
									</Link>
								))}
							</div>
						)}
					</QueryView>
				</div>
				<div className="space-y-3">
					<h2 className="text-sm font-bold text-muted-foreground">{t("History reports")}</h2>
					<HistoryPicker kind="case" />
					<HistoryPicker kind="land" />
				</div>
			</div>
		</>
	);
}

function HistoryPicker({ kind }: { kind: "case" | "land" }) {
	const [value, setValue] = React.useState<string | null>(null);
	const navigate = useNavigate();
	return (
		<Card>
			<CardHeader title={kind === "case" ? t("Case History Report") : t("Land / Project History Report")} />
			<CardBody className="space-y-3">
				<p className="text-xs text-muted-foreground">
					{kind === "case"
						? t("Every development of one case by actual date, with who recorded it, documents, follow-ups and outstanding actions.")
						: t("Developments across all cases of one land / project.")}
				</p>
				<Field label={kind === "case" ? t("Case") : t("Land / Project")} htmlFor={`hist_${kind}`}>
					<LookupSelect id={`hist_${kind}`} doctype={kind === "case" ? "Sijil Case" : "Sijil Land"} value={value} onChange={setValue} />
				</Field>
				<Button size="sm" disabled={!value} onClick={() => value && navigate(`/reports/${kind}/${value}`)}>
					<FileClock />
					{t("Open report")}
				</Button>
			</CardBody>
		</Card>
	);
}
