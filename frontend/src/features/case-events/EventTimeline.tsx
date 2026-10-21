import { useInfiniteQuery } from "@tanstack/react-query";
import * as React from "react";
import { EmptyState, ErrorState, LoadingRows } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/input";
import { caseKeys, casesApi, type CaseEvent } from "@/features/cases/api";
import { t } from "@/i18n";
import { EventCard } from "./EventCard";

const PAGE = 15;

/** The case history, newest first by actual event date, paged from the server. */
export function EventTimeline({ caseName, onCorrect }: { caseName: string; onCorrect?: (e: CaseEvent) => void }) {
	const [withSuperseded, setWithSuperseded] = React.useState(true);
	const query = useInfiniteQuery({
		queryKey: caseKeys.events(caseName, withSuperseded),
		queryFn: ({ pageParam }) => casesApi.events(caseName, pageParam, PAGE, withSuperseded),
		initialPageParam: 0,
		getNextPageParam: (last) => (last.has_more ? last.start + last.rows.length : undefined),
	});
	const events = query.data?.pages.flatMap((p) => p.rows) ?? [];
	const total = query.data?.pages[0]?.total ?? 0;

	const jump = (name: string) => {
		const el = document.getElementById(`event-${name}`);
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "center" });
			el.classList.add("ring-2", "ring-primary", "rounded-lg");
			setTimeout(() => el.classList.remove("ring-2", "ring-primary", "rounded-lg"), 1600);
		}
	};

	return (
		<section aria-label={t("Development history")}>
			<div className="mb-4 flex flex-wrap items-center justify-between gap-2">
				<p className="text-xs text-muted-foreground">{t("{0} entries, newest first", total)}</p>
				<label className="flex items-center gap-2 text-xs">
					<Checkbox checked={withSuperseded} onChange={(e) => setWithSuperseded(e.target.checked)} />
					{t("Show corrected entries")}
				</label>
			</div>
			{query.isLoading ? (
				<LoadingRows rows={3} />
			) : query.error ? (
				<ErrorState error={query.error} onRetry={() => void query.refetch()} />
			) : events.length === 0 ? (
				<EmptyState title={t("No developments recorded yet")} hint={t("Record the first development to start the history of this case.")} />
			) : (
				<div className="relative space-y-4 before:absolute before:bottom-2 before:start-3 before:top-2 before:w-px before:bg-border">
					{events.map((e) => (
						<EventCard key={e.name} event={e} onCorrect={onCorrect} onJump={jump} />
					))}
				</div>
			)}
			{query.hasNextPage && (
				<div className="mt-4 text-center">
					<Button variant="outline" size="sm" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
						{query.isFetchingNextPage ? t("Loading...") : t("Load older developments")}
					</Button>
				</div>
			)}
		</section>
	);
}
