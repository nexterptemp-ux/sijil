// Translations. English source strings are the keys — the same convention as Frappe's __() —
// so sijil/translations/ar.csv stays the single translation file for the backend and this app.

import { parseCsv, toDictionary } from "./csv";

export type Lang = "en" | "ar";
const RTL = new Set(["ar", "he", "fa", "ur"]);
const STORAGE_KEY = "sijil.lang";

let dictionary: Record<string, string> = {};
let current: Lang = "en";

const loaders: Record<string, () => Promise<string>> = {
	ar: () => import("../../../sijil/translations/ar.csv?raw").then((m) => m.default),
};

export function normalizeLang(lang?: string | null): Lang {
	return (lang || "").split("-")[0] === "ar" ? "ar" : "en";
}

export function storedLang(): Lang | null {
	try {
		const value = localStorage.getItem(STORAGE_KEY);
		return value ? normalizeLang(value) : null;
	} catch {
		return null;
	}
}

export function rememberLang(lang: Lang | null) {
	try {
		if (lang) localStorage.setItem(STORAGE_KEY, lang);
		else localStorage.removeItem(STORAGE_KEY);
	} catch {
		/* storage unavailable */
	}
}

export async function loadLanguage(lang: Lang): Promise<void> {
	current = lang;
	dictionary = loaders[lang] ? toDictionary(parseCsv(await loaders[lang]())) : {};
	document.documentElement.lang = lang;
	document.documentElement.dir = isRtl() ? "rtl" : "ltr";
}

/** For tests. */
export function setDictionary(lang: Lang, dict: Record<string, string>) {
	current = lang;
	dictionary = dict;
}

export function currentLang(): Lang {
	return current;
}

export function isRtl(): boolean {
	return RTL.has(current);
}

/**
 * Translate an English source string. Positional placeholders {0}, {1} … are filled from `args`
 * after translation, exactly like Frappe's __("...", [args]).
 */
export function t(source: string, ...args: Array<string | number | null | undefined>): string {
	const text = dictionary[source] ?? source;
	return args.length ? text.replace(/\{(\d+)\}/g, (m, i: string) => String(args[Number(i)] ?? m)) : text;
}

/** Translate a value that comes from data (status, type, …). Same as t(), named for the scanner. */
export function tv(value: string | null | undefined): string {
	return value ? (dictionary[value] ?? value) : "";
}
