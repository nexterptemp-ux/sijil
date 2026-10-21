import { CalendarClock } from "lucide-react";
import { Link } from "react-router-dom";
import { useBoot } from "@/app/boot";
import { Person } from "@/components/common";
import { CaseStatusBadge, PriorityBadge } from "@/components/status";
import { t } from "@/i18n";
import { daysBetween, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CaseRow } from "./api";

function NextFollowUp({ date }: { date?: string | null }) {
	const { boot } = useBoot();
	if (!date) return <span className="text-muted-foreground">—</span>;
	const days = daysBetween(boot.today, date);
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1",
				days < 0 && "font-semibold text-danger",
				days === 0 && "font-semibold text-warning",
			)}
		>
			<CalendarClock className="size-3.5" aria-hidden />
			{formatDate(date)}
		</span>
	);
}

/** Cases as a table on wide screens and as cards on phones. */
export function CaseList({ rows, showLand = true }: { rows: CaseRow[]; showLand?: boolean }) {
	return (
		<>
			<div className="-mx-px hidden overflow-x-auto md:block">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-border/70 bg-surface-2 text-start text-[12px] text-muted-foreground">
							<th className="whitespace-nowrap px-4 py-2.5 text-start font-bold">{t("Case")}</th>
							{showLand && (
								<th className="whitespace-nowrap px-4 py-2.5 text-start font-bold">
									{t("Land / Project")}
								</th>
							)}
							<th className="whitespace-nowrap px-4 py-2.5 text-start font-bold">
								{t("Current Situation")}
							</th>
							<th className="whitespace-nowrap px-4 py-2.5 text-start font-bold">
								{t("Internal Owner")}
							</th>
							<th className="whitespace-nowrap px-4 py-2.5 text-start font-bold">{t("Status")}</th>
							<th className="whitespace-nowrap px-4 py-2.5 text-start font-bold">
								{t("Next Follow-up")}
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border/70">
						{rows.map((c) => (
							<tr key={c.name} className="transition-colors hover:bg-primary-soft/40">
								<td className="max-w-64 px-4 py-3.5 align-top">
									<Link
										to={`/cases/${c.name}`}
										className="font-semibold hover:text-primary"
										dir="auto"
									>
										{c.title}
									</Link>
									<div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
										{c.reference_no && (
											<span className="tabular rounded bg-muted px-1.5 font-semibold" dir="ltr">
												{c.reference_no}
											</span>
										)}
										<PriorityBadge priority={c.priority} />
									</div>
								</td>
								{showLand && (
									<td className="px-4 py-3.5 align-top" dir="auto">
										<Link to={`/lands/${c.land}`} className="hover:text-primary">
											{c.land_name || c.land}
										</Link>
									</td>
								)}
								<td className="max-w-80 px-4 py-3.5 align-top text-[13px] leading-6 text-foreground/70">
									<p className="line-clamp-2" dir="auto">
										{c.current_situation || "—"}
									</p>
								</td>
								<td className="px-4 py-3.5 align-top">
									<Person name={c.owner_name} fallback={c.owner_user} />
								</td>
								<td className="px-4 py-3.5 align-top">
									<CaseStatusBadge status={c.status} />
								</td>
								<td className="whitespace-nowrap px-4 py-3.5 align-top text-xs">
									<NextFollowUp date={c.next_followup_date} />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<ul className="divide-y divide-border md:hidden">
				{rows.map((c) => (
					<li key={c.name}>
						<Link to={`/cases/${c.name}`} className="block space-y-1.5 py-3 active:bg-muted">
							<div className="flex items-start justify-between gap-2">
								<span className="font-semibold" dir="auto">
									{c.title}
								</span>
								<CaseStatusBadge status={c.status} />
							</div>
							{c.current_situation && (
								<p className="line-clamp-2 text-sm text-muted-foreground" dir="auto">
									{c.current_situation}
								</p>
							)}
							<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
								{showLand && <span dir="auto">{c.land_name}</span>}
								<span>{c.owner_name}</span>
								<NextFollowUp date={c.next_followup_date} />
								<PriorityBadge priority={c.priority} />
							</div>
						</Link>
					</li>
				))}
			</ul>
		</>
	);
}
