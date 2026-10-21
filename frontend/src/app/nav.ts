import {
	BarChart3,
	Briefcase,
	CalendarClock,
	FolderOpen,
	LayoutDashboard,
	ListChecks,
	MapPinned,
	Settings,
	type LucideIcon,
} from "lucide-react";

export interface NavItem {
	to: string;
	/** English source string, translated at render time. */
	label: string;
	icon: LucideIcon;
	badge?: "followups";
	end?: boolean;
}

export const NAV: NavItem[] = [
	{ to: "/", label: "Home", icon: LayoutDashboard, end: true },
	{ to: "/lands", label: "Lands and Projects", icon: MapPinned },
	{ to: "/cases", label: "Cases", icon: Briefcase },
	{ to: "/followups", label: "Follow-ups", icon: CalendarClock, badge: "followups" },
	{ to: "/tasks", label: "Tasks", icon: ListChecks },
	{ to: "/documents", label: "Document Library", icon: FolderOpen },
	{ to: "/reports", label: "Reports", icon: BarChart3 },
	{ to: "/settings", label: "Settings", icon: Settings },
];
