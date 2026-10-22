import evergreenLight from "@/assets/brand/evergreen/logo-light.svg";
import evergreenLogo from "@/assets/brand/evergreen/logo.svg";
import evergreenMark from "@/assets/brand/evergreen/mark.svg";
import navyLight from "@/assets/brand/navy/logo-light.svg";
import navyLogo from "@/assets/brand/navy/logo.svg";
import navyMark from "@/assets/brand/navy/mark.svg";
import { useTheme, type Theme } from "@/app/theme";
import { cn } from "@/lib/utils";

const LOGOS: Record<Theme, Record<"full" | "light" | "mark", string>> = {
	evergreen: { full: evergreenLogo, light: evergreenLight, mark: evergreenMark },
	navy: { full: navyLogo, light: navyLight, mark: navyMark },
};

/**
 * The Sijil logo for the active theme.
 * full = dark text for light backgrounds, light = light text for the sidebar, mark = icon only.
 */
export function Logo({ variant = "full", className }: { variant?: "full" | "light" | "mark"; className?: string }) {
	const theme = useTheme();
	return (
		<img
			src={LOGOS[theme][variant]}
			alt="سجل — Sijil"
			className={cn("block h-9 w-auto select-none", className)}
			draggable={false}
		/>
	);
}
