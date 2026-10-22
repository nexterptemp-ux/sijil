// Colour theme (CSS variables in styles/index.css) and the matching logo set (assets/brand/<theme>/).
import { useSyncExternalStore } from "react";

export const THEMES = ["evergreen", "navy"] as const;
export type Theme = (typeof THEMES)[number];

const KEY = "sijil.theme";
const listeners = new Set<() => void>();

function read(): Theme {
	try {
		const v = localStorage.getItem(KEY);
		return (THEMES as readonly string[]).includes(v ?? "") ? (v as Theme) : "evergreen";
	} catch {
		return "evergreen";
	}
}

let current: Theme = read();

/** Apply the remembered theme before the first paint (called from main.tsx). */
export function applyTheme(theme: Theme = current) {
	current = theme;
	document.documentElement.dataset.theme = theme;
}

export function setTheme(theme: Theme) {
	try {
		localStorage.setItem(KEY, theme);
	} catch {
		/* storage unavailable: theme still applies for this visit */
	}
	applyTheme(theme);
	listeners.forEach((l) => l());
}

export function useTheme(): Theme {
	return useSyncExternalStore(
		(cb) => {
			listeners.add(cb);
			return () => listeners.delete(cb);
		},
		() => current,
	);
}
