// sijil.api.integrations
import { call } from "@/lib/api/client";

export interface Integration {
	key: string;
	/** Sijil Settings flag; null = always-on link that cannot be switched off. */
	flag: string | null;
	doctype: string;
	icon: string;
	enabled: boolean;
	stats: Record<string, string | number>;
}

export const integrationsApi = {
	list: () => call<Integration[]>("integrations.get_integrations"),
	set: (flag: string, value: boolean) =>
		call<Integration[]>("integrations.set_integration", { flag, value: value ? 1 : 0 }),
	linkPendingTasks: () => call<{ synced: number }>("integrations.link_pending_tasks"),
};

export const integrationKeys = { list: ["integrations"] as const };
