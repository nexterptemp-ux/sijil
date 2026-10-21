// Loads meta.bootstrap and the user's language before anything else renders.
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { ErrorState, LoadingRows } from "@/components/states";
import { loadLanguage, normalizeLang, rememberLang, storedLang, type Lang } from "@/i18n";
import { ApiError } from "@/lib/api/client";
import { metaApi, metaKeys } from "@/lib/api/meta";
import type { Bootstrap } from "@/lib/api/types";

interface BootValue {
	boot: Bootstrap;
	lang: Lang;
	setLang: (lang: Lang) => void;
}

const BootContext = React.createContext<BootValue | null>(null);

export function useBoot(): BootValue {
	const value = React.useContext(BootContext);
	if (!value) throw new Error("useBoot must be used inside <BootGate>");
	return value;
}

export function BootGate({ children }: { children: React.ReactNode }) {
	const query = useQuery({ queryKey: metaKeys.boot, queryFn: metaApi.bootstrap, staleTime: 10 * 60_000, retry: 1 });
	const [lang, setLangState] = React.useState<Lang | null>(null);

	React.useEffect(() => {
		if (!query.data || lang) return;
		const initial = storedLang() ?? normalizeLang(query.data.lang);
		void loadLanguage(initial).then(() => setLangState(initial));
	}, [query.data, lang]);

	const setLang = React.useCallback((next: Lang) => {
		rememberLang(next);
		void loadLanguage(next).then(() => setLangState(next));
	}, []);

	if (query.error instanceof ApiError && query.error.isPermission && !import.meta.env.DEV) {
		// Session expired or no app access: let Frappe handle login.
		window.location.href = `/login?redirect-to=${encodeURIComponent(window.location.pathname)}`;
		return null;
	}
	if (query.error) return <ErrorState error={query.error} onRetry={() => void query.refetch()} className="mt-24" />;
	if (!query.data || !lang)
		return (
			<div className="mx-auto mt-24 max-w-md px-4">
				<LoadingRows rows={3} />
			</div>
		);

	return (
		<BootContext.Provider value={{ boot: query.data, lang, setLang }}>
			{/* Re-mount on language change so every t() call re-renders. */}
			<React.Fragment key={lang}>{children}</React.Fragment>
		</BootContext.Provider>
	);
}
