import logoLight from "@/assets/brand/evergreen/logo-light.svg";
import logo from "@/assets/brand/evergreen/logo.svg";
import mark from "@/assets/brand/evergreen/mark.svg";
import { cn } from "@/lib/utils";

const LOGOS = { full: logo, light: logoLight, mark };

/** The Sijil logo. full = dark text for light backgrounds, light = light text for the sidebar, mark = icon only. */
export function Logo({ variant = "full", className }: { variant?: "full" | "light" | "mark"; className?: string }) {
	return (
		<img
			src={LOGOS[variant]}
			alt="سجل — Sijil"
			className={cn("block h-9 w-auto select-none", className)}
			draggable={false}
		/>
	);
}
