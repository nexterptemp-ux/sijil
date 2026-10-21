import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

export function useDebounced<T>(value: T, delay = 300): T {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const id = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(id);
	}, [value, delay]);
	return debounced;
}

/**
 * List filters kept in the URL so they survive reloads, back/forward and sharing a link.
 * Values are strings; an empty string removes the parameter.
 */
export function useUrlState<K extends string>(defaults: Record<K, string>) {
	const [params, setParams] = useSearchParams();
	const state = useMemo(() => {
		const out = { ...defaults };
		for (const key of Object.keys(defaults) as K[]) {
			const v = params.get(key);
			if (v !== null) out[key] = v;
		}
		return out;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [params]);

	const update = (patch: Partial<Record<K, string>>, { resetPage = true } = {}) => {
		setParams(
			(prev) => {
				const next = new URLSearchParams(prev);
				for (const [k, v] of Object.entries(patch) as [K, string | undefined][]) {
					if (v === undefined || v === "" || v === defaults[k]) next.delete(k);
					else next.set(k, v);
				}
				if (resetPage && !("page" in patch)) next.delete("page");
				return next;
			},
			{ replace: true },
		);
	};
	return [state, update] as const;
}
