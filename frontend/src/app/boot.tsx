// Loads meta.bootstrap and the user's language before anything else renders.
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { Logo } from "@/components/Logo";
import { ErrorState } from "@/components/states";
import { loadLanguage, normalizeLang, rememberLang, storedLang, type Lang } from "@/i18n";
import { ApiError } from "@/lib/api/client";
import { metaApi, metaKeys } from "@/lib/api/meta";
import { BootContext } from "./boot-context";

export { useBoot } from "./boot-context";


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
				<Logo variant="mark" className="h-16" />
				<div className="h-1 w-28 overflow-hidden rounded-full bg-muted">
					<div className="h-full w-1/2 animate-[sijil-load_1.1s_ease-in-out_infinite] rounded-full bg-primary" />
				</div>
			</div>
		</div>
	);
}
