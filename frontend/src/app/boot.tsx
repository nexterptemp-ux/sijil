// Loads meta.bootstrap and the user's language before anything else renders.
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { ErrorState } from "@/components/states";
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
	if (!query.data || !lang) return <Splash />;

	return (
		<BootContext.Provider value={{ boot: query.data, lang, setLang }}>
			{/* Re-mount on language change so every t() call re-renders. */}
			<React.Fragment key={lang}>{children}</React.Fragment>
		</BootContext.Provider>
	);
}

/** Shown while the app boots (before translations are loaded, so no text). */
function Splash() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-label="Loading">
			<div className="flex flex-col items-center gap-5">
				<div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4f74f0] to-[#2a49c4] text-2xl font-extrabold text-white shadow-[0_10px_30px_-8px_rgba(56,92,230,.6)]">
					س
				</div>
				<div className="h-1 w-28 overflow-hidden rounded-full bg-muted">
					<div className="h-full w-1/2 animate-[sijil-load_1.1s_ease-in-out_infinite] rounded-full bg-primary" />
				</div>
			</div>
		</div>
	);
}
