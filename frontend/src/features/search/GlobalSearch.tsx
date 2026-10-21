import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, CalendarClock, FileText, ListChecks, MapPinned, Search } from "lucide-react";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { t, tv } from "@/i18n";
import { metaApi, metaKeys } from "@/lib/api/meta";
import { formatDate } from "@/lib/format";
import { useDebounced } from "@/lib/hooks";
import { cn } from "@/lib/utils";

interface Hit {
	key: string;
	group: string;
	title: string;
	meta?: string;
	to: string;
	icon: React.ComponentType<{ className?: string }>;
}

export function GlobalSearch() {
	const [open, setOpen] = React.useState(false);

	React.useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				setOpen(true);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="flex h-10 w-full max-w-lg items-center gap-2.5 rounded-xl border border-border bg-surface-2 px-3.5 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:bg-surface max-sm:w-10 max-sm:justify-center max-sm:border-transparent max-sm:bg-transparent max-sm:px-0"
				aria-label={t("Search")}
			>
				<Search className="size-4 shrink-0" aria-hidden />
				<span className="flex-1 truncate text-start max-sm:hidden">
					{t("Search lands, cases, tasks, documents...")}
				</span>
				<kbd className="rounded-md border border-border bg-surface px-1.5 py-0.5 font-sans text-[10px] font-semibold shadow-sm max-md:hidden">
					Ctrl K
				</kbd>
			</button>
			<Dialog open={open} onOpenChange={setOpen}>
				{open && <SearchDialog onClose={() => setOpen(false)} />}
			</Dialog>
		</>
	);
}

function SearchDialog({ onClose }: { onClose: () => void }) {
	const [text, setText] = React.useState("");
	const [active, setActive] = React.useState(0);
	const q = useDebounced(text.trim(), 250);
	const navigate = useNavigate();
	const query = useQuery({
		queryKey: metaKeys.search(q),
		queryFn: () => metaApi.search(q),
		enabled: q.length >= 2,
		staleTime: 15_000,
	});

	const hits = React.useMemo<Hit[]>(() => {
		const r = query.data ?? {};
		return [
			...(r.lands ?? []).map((l) => ({
				key: l.name,
				group: t("Lands and Projects"),
				title: l.land_name,
				meta: [l.land_code, l.city].filter(Boolean).join(" · "),
				to: `/lands/${l.name}`,
				icon: MapPinned,
			})),
			...(r.cases ?? []).map((c) => ({
				key: c.name,
				group: t("Cases"),
				title: c.title,
				meta: [c.land_name, tv(c.status)].filter(Boolean).join(" · "),
				to: `/cases/${c.name}`,
				icon: Briefcase,
			})),
			...(r.followups ?? []).map((f) => ({
				key: f.name,
				group: t("Follow-ups"),
				title: f.title,
				meta: `${formatDate(f.due_date)} · ${tv(f.status)}`,
				to: `/followups?scope=all&search=${encodeURIComponent(f.title)}`,
				icon: CalendarClock,
			})),
			...(r.tasks ?? []).map((x) => ({
				key: x.name,
				group: t("Tasks"),
				title: x.title,
				meta: tv(x.status),
				to: `/tasks/${x.name}`,
				icon: ListChecks,
			})),
			...(r.documents ?? []).map((d) => ({
				key: d.name,
				group: t("Documents"),
				title: d.title,
				to: `/documents/${d.land}?doc=${d.name}`,
				icon: FileText,
			})),
		];
	}, [query.data]);

	React.useEffect(() => setActive(0), [hits]);

	const go = (hit?: Hit) => {
		if (!hit) return;
		onClose();
		navigate(hit.to);
	};

	const onKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setActive((i) => Math.min(i + 1, hits.length - 1));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setActive((i) => Math.max(i - 1, 0));
		} else if (e.key === "Enter") {
			e.preventDefault();
			go(hits[active]);
		}
	};

	let lastGroup = "";
	return (
		<DialogContent size="lg" className="p-0">
			<DialogPrimitive.Title className="sr-only">{t("Search")}</DialogPrimitive.Title>
			<DialogPrimitive.Description className="sr-only">
				{t("Search lands, cases, tasks, documents...")}
			</DialogPrimitive.Description>
			<div className="flex items-center gap-2 border-b border-border px-4 pe-12">
				<Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
				<input
					autoFocus
					value={text}
					onChange={(e) => setText(e.target.value)}
					onKeyDown={onKeyDown}
					placeholder={t("Search lands, cases, tasks, documents...")}
					className="h-12 w-full bg-transparent text-sm outline-none"
					dir="auto"
					role="combobox"
					aria-expanded={hits.length > 0}
					aria-controls="global-search-results"
				/>
			</div>
			<div className="max-h-[60vh] overflow-y-auto p-2" id="global-search-results" role="listbox">
				{q.length < 2 ? (
					<p className="px-2 py-6 text-center text-sm text-muted-foreground">
						{t("Type at least two characters.")}
					</p>
				) : query.isLoading ? (
					<p className="px-2 py-6 text-center text-sm text-muted-foreground">{t("Loading...")}</p>
				) : hits.length === 0 ? (
					<p className="px-2 py-6 text-center text-sm text-muted-foreground">{t("No results")}</p>
				) : (
					hits.map((hit, i) => {
						const header = hit.group !== lastGroup ? hit.group : null;
						lastGroup = hit.group;
						return (
							<React.Fragment key={`${hit.group}-${hit.key}`}>
								{header && (
									<div className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase text-muted-foreground">
										{header}
									</div>
								)}
								<button
									type="button"
									role="option"
									aria-selected={i === active}
									onMouseEnter={() => setActive(i)}
									onClick={() => go(hit)}
									className={cn(
										"flex w-full items-center gap-3 rounded-md px-2 py-2 text-start",
										i === active && "bg-muted",
									)}
								>
									<hit.icon className="size-4 shrink-0 text-muted-foreground" />
									<span className="min-w-0 flex-1">
										<span className="block truncate text-sm font-medium" dir="auto">
											{hit.title}
										</span>
										{hit.meta && (
											<span className="block truncate text-xs text-muted-foreground" dir="auto">
												{hit.meta}
											</span>
										)}
									</span>
								</button>
							</React.Fragment>
						);
					})
				)}
			</div>
		</DialogContent>
	);
}
