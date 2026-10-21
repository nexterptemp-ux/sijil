import type { QueryKey } from "@tanstack/react-query";

/**
 * Most business actions touch several screens at once (recording an event changes the case, the land
 * activity, the dashboard and follow-up lists). Invalidating the whole domain is cheap at this scale and
 * avoids stale screens; use narrower keys only for isolated data.
 */
export const DOMAIN: QueryKey[] = [
	["dashboard"],
	["lands"],
	["cases"],
	["followups"],
	["tasks"],
	["documents"],
	["search"],
];
