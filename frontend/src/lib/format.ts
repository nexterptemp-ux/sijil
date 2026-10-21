import { currentLang } from "@/i18n";

function locale(): string {
	// Gregorian calendar and Latin digits, matching dates and references used in correspondence.
	return currentLang() === "ar" ? "ar-u-ca-gregory-nu-latn" : "en-GB";
}

function toDate(value: string): Date {
	// "YYYY-MM-DD" must be read as a local calendar date, not UTC midnight.
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
	return new Date(value.replace(" ", "T"));
}

export function formatDate(value?: string | null): string {
	if (!value) return "—";
	const d = toDate(value);
	if (Number.isNaN(d.getTime())) return value;
	return new Intl.DateTimeFormat(locale(), { day: "numeric", month: "short", year: "numeric" }).format(d);
}

export function formatDateTime(value?: string | null): string {
	if (!value) return "—";
	const d = toDate(value);
	if (Number.isNaN(d.getTime())) return value;
	return new Intl.DateTimeFormat(locale(), { dateStyle: "medium", timeStyle: "short" }).format(d);
}

/** Whole days from `today` to `value` (negative = in the past). Both are YYYY-MM-DD. */
export function daysBetween(today: string, value: string): number {
	const a = toDate(today);
	const b = toDate(value.slice(0, 10));
	return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function relativeDays(today: string, value?: string | null): string {
	if (!value) return "";
	const rtf = new Intl.RelativeTimeFormat(locale(), { numeric: "auto" });
	return rtf.format(daysBetween(today, value), "day");
}

export function formatNumber(value: number): string {
	return new Intl.NumberFormat(locale()).format(value);
}

export function formatFileSize(bytes?: number | null): string {
	if (!bytes) return "—";
	const units = ["B", "KB", "MB", "GB"];
	let i = 0;
	let n = bytes;
	while (n >= 1024 && i < units.length - 1) {
		n /= 1024;
		i++;
	}
	return `${formatNumber(Math.round(n * 10) / 10)} ${units[i]}`;
}

export function initials(name?: string | null): string {
	return (name || "?")
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((p) => p[0])
		.join("")
		.toUpperCase();
}
