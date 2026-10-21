// sijil.api.meta — app-wide lookups used by many features.
import { call } from "./client";
import type { Bootstrap, LookupDoctype, Option, UserOption } from "./types";

export interface SearchResults {
	lands?: { name: string; land_name: string; land_code?: string; city?: string }[];
	cases?: { name: string; title: string; land: string; land_name?: string; status: string }[];
	tasks?: { name: string; title: string; status: string }[];
	followups?: { name: string; title: string; due_date: string; status: string }[];
	documents?: { name: string; title: string; land: string; folder?: string }[];
}

export const metaApi = {
	bootstrap: () => call<Bootstrap>("meta.bootstrap"),
	users: (search?: string) => call<UserOption[]>("meta.users", { search }),
	search: (query: string) => call<SearchResults>("meta.search", { query }),
	lookup: (doctype: LookupDoctype, txt?: string, filters?: Record<string, string>) =>
		call<Option[]>("meta.lookup", { doctype, txt, filters }),
	labelFor: (doctype: LookupDoctype, name: string) => call<string | null>("meta.label_for", { doctype, name }),
};

export const metaKeys = {
	boot: ["boot"] as const,
	users: ["users"] as const,
	lookup: (doctype: string, txt: string, filters?: Record<string, string>) =>
		["lookup", doctype, txt, filters] as const,
	label: (doctype: string, name: string) => ["label", doctype, name] as const,
	search: (q: string) => ["search", q] as const,
};
