// Boot context in its own module so that hot reload of boot.tsx (or anything it imports, such as the
// logo) does not create a second context and break every useBoot() consumer during development.
import * as React from "react";
import type { Lang } from "@/i18n";
import type { Bootstrap } from "@/lib/api/types";

export interface BootValue {
	boot: Bootstrap;
	lang: Lang;
	setLang: (lang: Lang) => void;
}

export const BootContext = React.createContext<BootValue | null>(null);

export function useBoot(): BootValue {
	const value = React.useContext(BootContext);
	if (!value) throw new Error("useBoot must be used inside <BootGate>");
	return value;
}
