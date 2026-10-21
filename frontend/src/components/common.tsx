// Shared app components used by several features.
import DOMPurify from "dompurify";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/layout";
import { isRtl, t } from "@/i18n";
import type { Page } from "@/lib/api/types";
import { formatNumber, initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PageHeader({
	title,
	subtitle,
	actions,
	back,
	children,
}: {
	title: React.ReactNode;
	subtitle?: React.ReactNode;
	actions?: React.ReactNode;
	back?: { to: string; label: string };
	children?: React.ReactNode;
}) {
	return (
		<header className="mb-5 space-y-2">
			{back && (
				<Link to={back.to} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
					<BackIcon className="size-3.5" />
					{back.label}
				</Link>
			)}
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0">
					<h1 className="text-xl font-bold leading-tight" dir="auto">
						{title}
					</h1>
					{subtitle && <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>}
				</div>
				{actions && <div className="flex flex-wrap gap-2">{actions}</div>}
			</div>
			{children}
		</header>
	);
}

/** "Back" points to the inline start: left in LTR, right in RTL. */
export function BackIcon({ className }: { className?: string }) {
	return isRtl() ? <ChevronRight className={className} aria-hidden /> : <ChevronLeft className={className} aria-hidden />;
}

export function ForwardIcon({ className }: { className?: string }) {
	return isRtl() ? <ChevronLeft className={className} aria-hidden /> : <ChevronRight className={className} aria-hidden />;
}

export function Avatar({ name, image, size = "md" }: { name?: string | null; image?: string | null; size?: "sm" | "md" }) {
	const dim = size === "sm" ? "size-6 text-[10px]" : "size-8 text-xs";
	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft font-bold text-primary",
				dim,
			)}
			aria-hidden
		>
			{image ? <img src={image} alt="" className="size-full object-cover" /> : initials(name)}
		</span>
	);
}

export function Person({ name, fallback, size = "sm" }: { name?: string | null; fallback?: string | null; size?: "sm" | "md" }) {
	const label = name || fallback;
	if (!label) return <span className="text-muted-foreground">—</span>;
	return (
		<span className="inline-flex min-w-0 items-center gap-2">
			<Avatar name={label} size={size} />
			<span className="truncate">{label}</span>
		</span>
	);
}

export function SearchInput({
	value,
	onChange,
	placeholder,
	className,
}: {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
}) {
	const [text, setText] = React.useState(value);
	React.useEffect(() => setText(value), [value]);
	React.useEffect(() => {
		if (text === value) return;
		const id = setTimeout(() => onChange(text), 300);
		return () => clearTimeout(id);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [text]);
	return (
		<div className={cn("relative", className)}>
			<Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="search"
				value={text}
				onChange={(e) => setText(e.target.value)}
				placeholder={placeholder ?? t("Search")}
				className="ps-9"
				aria-label={placeholder ?? t("Search")}
			/>
		</div>
	);
}

/** Page navigation for server-paginated lists. `page` is 0-based. */
export function Pager({
	page,
	onPage,
	data,
	className,
}: {
	page: number;
	onPage: (page: number) => void;
	data?: Pick<Page<unknown>, "total" | "start" | "rows" | "has_more" | "page_length">;
	className?: string;
}) {
	if (!data || data.total <= data.page_length) return null;
	const from = data.start + 1;
	const to = data.start + data.rows.length;
	return (
		<div className={cn("flex items-center justify-between gap-3 pt-3 text-xs text-muted-foreground", className)}>
			<span>{t("{0}–{1} of {2}", formatNumber(from), formatNumber(to), formatNumber(data.total))}</span>
			<div className="flex gap-1">
				<Button variant="outline" size="sm" disabled={page === 0} onClick={() => onPage(page - 1)}>
					<BackIcon />
					{t("Previous")}
				</Button>
				<Button variant="outline" size="sm" disabled={!data.has_more} onClick={() => onPage(page + 1)}>
					{t("Next")}
					<ForwardIcon />
				</Button>
			</div>
		</div>
	);
}

export function StatTile({
	label,
	value,
	hint,
	tone = "default",
	to,
}: {
	label: string;
	value: number;
	hint?: string;
	tone?: "default" | "danger" | "warning";
	to?: string;
}) {
	const body = (
		<Card className={cn("h-full p-4 transition-colors", to && "hover:border-primary/40")}>
			<div className="text-xs font-semibold text-muted-foreground">{label}</div>
			<div
				className={cn(
					"mt-1 text-2xl font-bold",
					tone === "danger" && value > 0 && "text-danger",
					tone === "warning" && value > 0 && "text-warning",
				)}
			>
				{formatNumber(value)}
			</div>
			{hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
		</Card>
	);
	return to ? (
		<Link to={to} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
			{body}
		</Link>
	) : (
		body
	);
}

/** Rich text fields (Text Editor) from the backend — always sanitized. */
export function RichText({ html, className }: { html?: string | null; className?: string }) {
	if (!html) return null;
	const looksHtml = /<[a-z][\s\S]*>/i.test(html);
	if (!looksHtml)
		return (
			<p className={cn("whitespace-pre-line text-sm leading-7", className)} dir="auto">
				{html}
			</p>
		);
	return (
		<div
			className={cn("prose-sijil", className)}
			dir="auto"
			dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html, { USE_PROFILES: { html: true } }) }}
		/>
	);
}

export function KeyValue({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex items-start justify-between gap-3 py-1.5 text-sm">
			<dt className="shrink-0 text-muted-foreground">{label}</dt>
			<dd className="min-w-0 text-end font-medium" dir="auto">
				{children}
			</dd>
		</div>
	);
}
