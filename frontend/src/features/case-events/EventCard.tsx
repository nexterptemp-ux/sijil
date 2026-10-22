import { ArrowRight, CalendarDays, History, MessageSquare, Pencil, Star } from "lucide-react";
import { RichText } from "@/components/common";
import { CaseStatusBadge } from "@/components/status";
import { Badge } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import type { CaseEvent } from "@/features/cases/api";
import { DocumentChip } from "@/features/documents/DocumentChip";
import { t, tv } from "@/i18n";
import { formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/** One development in the case history. Superseded entries stay visible, clearly marked. */
export function EventCard({
	event,
	onCorrect,
	onJump,
}: {
	event: CaseEvent;
	onCorrect?: (event: CaseEvent) => void;
	onJump?: (name: string) => void;
}) {
	const superseded = event.entry_status === "Superseded";
	return (
		<article
			id={`event-${event.name}`}
			className={cn("relative ps-8", superseded && "opacity-70")}
			aria-label={event.title}
		>
			<span
				className={cn(
					"absolute start-0 top-1 flex size-6 items-center justify-center rounded-full border-2 border-surface",
					event.is_milestone
						? "bg-warning text-white"
						: superseded
							? "bg-muted text-muted-foreground"
							: "bg-primary-soft text-primary",
				)}
				aria-hidden
			>
				{event.is_milestone ? <Star className="size-3.5 fill-current" /> : <MessageSquare className="size-3" />}
			</span>
			<div
				className={cn(
					"rounded-[var(--radius)] border bg-surface p-4 shadow-card sm:p-5",
					event.is_milestone && !superseded
						? "border-warning/30 bg-gradient-to-br from-warning-soft/50 to-surface"
						: "border-border/80",
					superseded && "border-dashed bg-surface-2 shadow-none",
				)}
			>
				<header className="flex flex-wrap items-start justify-between gap-2">
					<div className="min-w-0 space-y-1">
						<div className="flex flex-wrap items-center gap-2">
							<h3
								className={cn(
									"text-[15px] font-bold leading-snug",
									superseded && "text-muted-foreground line-through decoration-muted-foreground/50",
								)}
								dir="auto"
							>
								{event.title}
							</h3>
							{event.is_milestone ? <Badge tone="warning">{t("Milestone")}</Badge> : null}
							{superseded && <Badge>{t("Superseded")}</Badge>}
							{event.corrects && <Badge tone="primary">{t("Correction")}</Badge>}
						</div>
						<div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
							<time
								dateTime={event.event_date}
								className="tabular inline-flex items-center gap-1 font-bold text-foreground"
							>
								<CalendarDays className="size-3.5 text-muted-foreground" aria-hidden />
								{formatDate(event.event_date)}
								{event.event_time ? ` ${event.event_time.slice(0, 5)}` : ""}
							</time>
							<span>{tv(event.event_type)}</span>
							{event.communication_method && <span>{tv(event.communication_method)}</span>}
							{event.external_organization && <span dir="auto">{event.external_organization}</span>}
						</div>
					</div>
					{onCorrect && !superseded && (
						<Button variant="ghost" size="sm" onClick={() => onCorrect(event)}>
							<Pencil />
							{t("Correct")}
						</Button>
					)}
				</header>

				{event.description && <RichText html={event.description} className="mt-3" />}

				{event.outcome && event.outcome !== event.description && (
					<p className="mt-3 text-sm" dir="auto">
						<span className="font-semibold">{t("Outcome")}: </span>
						{event.outcome}
					</p>
				)}

				{(event.situation_update || event.status_after) && (
					<div className="mt-3 space-y-1 rounded-xl border border-primary/10 bg-primary-soft/60 p-3 text-sm">
						{event.situation_update && (
							<p dir="auto">
								<span className="font-semibold text-primary">{t("Current situation updated")}: </span>
								{event.situation_update}
							</p>
						)}
						{event.status_after && (
							<p className="flex items-center gap-2">
								<span className="font-semibold text-primary">{t("Status")}:</span>
								<ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden />
								<CaseStatusBadge status={event.status_after} />
							</p>
						)}
					</div>
				)}

				{event.documents.length > 0 && (
					<div className="mt-3 flex flex-wrap gap-2">
						{event.documents.map((d) => (
							<DocumentChip key={d.link} doc={d} />
						))}
					</div>
				)}

				{(event.corrects || event.superseded_by) && (
					<div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-2 text-xs text-muted-foreground">
						<History className="size-3.5" aria-hidden />
						{event.corrects && (
							<>
								<span>{t("Corrects an earlier entry.")}</span>
								{event.correction_reason && <span dir="auto">“{event.correction_reason}”</span>}
								{onJump && (
									<button
										type="button"
										className="text-primary hover:underline"
										onClick={() => onJump(event.corrects!)}
									>
										{t("View original")}
									</button>
								)}
							</>
						)}
						{event.superseded_by && (
							<>
								<span>{t("Replaced by a correction.")}</span>
								{onJump && (
									<button
										type="button"
										className="text-primary hover:underline"
										onClick={() => onJump(event.superseded_by!)}
									>
										{t("View correction")}
									</button>
								)}
							</>
						)}
					</div>
				)}

				<footer className="mt-3 border-t border-border/60 pt-2.5 text-[11px] text-muted-foreground">
					{t(
						"Recorded by {0} on {1}",
						event.recorded_by_name || event.recorded_by,
						formatDateTime(event.recorded_on),
					)}
				</footer>
			</div>
		</article>
	);
}
