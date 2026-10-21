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
		<header className="mb-6 space-y-3">
			{back && (
				<Link
					to={back.to}
					className="inline-flex items-center gap-1 rounded-md text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
				>
					<BackIcon className="size-3.5" />
					{back.label}
				</Link>
			)}
			<div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
				<div className="min-w-0">
					<h1 className="text-[22px] font-extrabold leading-tight tracking-tight sm:text-2xl" dir="auto">
						{title}
					</h1>
					{subtitle && <div className="mt-1.5 text-sm text-muted-foreground">{subtitle}</div>}
				</div>
				{actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
			</div>
			{children}
		</header>
	);
}

/** "Back" points to the inline start: left in LTR, right in RTL. */
export function BackIcon({ className }: { className?: string }) {
	return isRtl() ? (
		<ChevronRight className={className} aria-hidden />
	) : (
		<ChevronLeft className={className} aria-hidden />
	);
}

export function ForwardIcon({ className }: { className?: string }) {
	return isRtl() ? (
		<ChevronLeft className={className} aria-hidden />
	) : (
		<ChevronRight className={className} aria-hidden />
	);
}

// Stable, distinct but quiet colours per person.
const AVATAR_TONES = [
	"bg-[#e8efff] text-[#2b4fc7]",
	"bg-[#e6f6f0] text-[#11795a]",
	"bg-[#fff1e0] text-[#a35a06]",
	"bg-[#f3e9ff] text-[#6d3cc4]",
	"bg-[#ffe9ec] text-[#b4233c]",
	"bg-[#e3f4f8] text-[#0d6c84]",
];

function toneFor(name: string) {
	let h = 0;
	for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
	return AVATAR_TONES[h % AVATAR_TONES.length];
}

export function Avatar({
	name,
	image,
	size = "md",
}: {
	name?: string | null;
	image?: string | null;
	size?: "sm" | "md" | "lg";
}) {
	const dim = { sm: "size-6 text-[10px]", md: "size-8 text-xs", lg: "size-10 text-sm" }[size];
	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold ring-2 ring-surface",
				toneFor(name || "?"),
				dim,
			)}
			aria-hidden
		>
			{image ? <img src={image} alt="" className="size-full object-cover" /> : initials(name)}
		</span>
	);
}

export function Person({
	name,
	fallback,
	size = "sm",
}: {
	name?: string | null;
	fallback?: string | null;
	size?: "sm" | "md";
}) {
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

const TILE_TONES = {
	default: "bg-primary-soft text-primary",
	danger: "bg-danger-soft text-danger",
	warning: "bg-warning-soft text-warning",
	success: "bg-success-soft text-success",
};

export function StatTile({
	label,
	value,
	hint,
	tone = "default",
	icon,
	to,
}: {
	label: string;
	value: number;
	hint?: string;
	tone?: keyof typeof TILE_TONES;
	icon?: React.ReactNode;
	to?: string;
}) {
	const quiet = tone !== "default" && value === 0;
	const body = (
		<Card
			className={cn(
				"group h-full p-3 transition-all sm:p-4",
				to && "hover:-translate-y-px hover:border-primary/30 hover:shadow-raised",
			)}
		>
			<div className="flex items-start justify-between gap-2">
				<div className="text-[11.5px] font-semibold leading-snug text-muted-foreground sm:text-[13px]">
					{label}
				</div>
				{icon && (
					<span
						className={cn(
							"hidden size-8 shrink-0 items-center justify-center rounded-lg sm:flex [&_svg]:size-4",
							quiet ? "bg-muted text-muted-foreground" : TILE_TONES[tone],
						)}
						aria-hidden
					>
						{icon}
					</span>
				)}
			</div>
			<div
				className={cn(
					"tabular mt-1.5 text-[22px] font-extrabold leading-none sm:mt-2 sm:text-[28px]",
					!quiet && tone === "danger" && "text-danger",
					!quiet && tone === "warning" && "text-warning",
				)}
			>
				{formatNumber(value)}
			</div>
			{hint && <div className="mt-1.5 text-xs text-muted-foreground max-sm:hidden">{hint}</div>}
		</Card>
	);
	return to ? (
		<Link
			to={to}
			className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
		>
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
		<div className="flex items-start justify-between gap-3 py-2 text-sm">
			<dt className="shrink-0 text-muted-foreground">{label}</dt>
			<dd className="min-w-0 text-end font-medium" dir="auto">
				{children}
			</dd>
		</div>
	);
}
