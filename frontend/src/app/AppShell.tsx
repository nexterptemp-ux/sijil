import { useQuery } from "@tanstack/react-query";
import { Globe, LogOut, Menu, MonitorCog, X } from "lucide-react";
import * as React from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Avatar } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/menu";
import { followupKeys, followupsApi } from "@/features/followups/api";
import { GlobalSearch } from "@/features/search/GlobalSearch";
import { t } from "@/i18n";
import { logout } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { useBoot } from "./boot";
import { NAV } from "./nav";

export function AppShell() {
	const [open, setOpen] = React.useState(false);
	const location = useLocation();
	React.useEffect(() => setOpen(false), [location.pathname]);

	return (
		<div className="flex min-h-screen">
			<a
				href="#main"
				className="sr-only focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-50 focus:rounded focus:bg-surface focus:p-2"
			>
				{t("Skip to content")}
			</a>
			{open && (
				<div
					className="fixed inset-0 z-30 bg-[#0b1430]/50 backdrop-blur-[2px] lg:hidden"
					onClick={() => setOpen(false)}
					aria-hidden
				/>
			)}
			<Sidebar open={open} onClose={() => setOpen(false)} />
			<div className="flex min-w-0 flex-1 flex-col">
				<Topbar onMenu={() => setOpen(true)} />
				<main id="main" className="w-full flex-1 px-4 py-5 sm:px-5 lg:px-6 lg:py-6">
					<Outlet />
				</main>
			</div>
		</div>
	);
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
	const { boot } = useBoot();
	return (
		<aside
			className={cn(
				"fixed inset-y-0 start-0 z-40 flex w-[264px] shrink-0 flex-col gap-7 bg-sidebar px-3.5 py-5 text-sidebar-foreground transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen",
				!open && "max-lg:-translate-x-full max-lg:rtl:translate-x-full",
			)}
			aria-label={t("Workspace")}
		>
			<div className="flex items-center justify-between px-1.5">
				<div className="flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4f74f0] to-[#2a49c4] text-xl font-extrabold text-white shadow-[0_6px_16px_-4px_rgba(56,92,230,.6),inset_0_1px_0_rgba(255,255,255,.25)]">
						{t("Sijil").slice(0, 1)}
					</div>
					<div className="leading-tight">
						<div className="text-[17px] font-extrabold text-white">{t("Sijil")}</div>
						<div className="text-[11px] text-sidebar-foreground/70">{t("Land and case follow-up")}</div>
					</div>
				</div>
				<button
					type="button"
					className="rounded-lg p-2 text-sidebar-foreground hover:bg-white/10 lg:hidden"
					onClick={onClose}
					aria-label={t("Close")}
				>
					<X className="size-4" />
				</button>
			</div>
			<nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
				<div className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-sidebar-foreground/50">
					{t("Workspace")}
				</div>
				{NAV.map((item) => (
					<NavLink
						key={item.to}
						to={item.to}
						end={item.end}
						className={({ isActive }) =>
							cn(
								"relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] font-semibold text-sidebar-foreground transition-colors hover:bg-white/[.06] hover:text-white",
								isActive &&
									"bg-sidebar-active text-white shadow-[inset_0_1px_0_rgba(255,255,255,.06)] before:absolute before:inset-y-2 before:start-0 before:w-[3px] before:rounded-full before:bg-[#6e8ff5] hover:bg-sidebar-active",
							)
						}
					>
						<item.icon className="size-[18px] shrink-0 opacity-90" aria-hidden />
						<span className="flex-1 truncate">{t(item.label)}</span>
						{item.badge && <NavBadge kind={item.badge} />}
					</NavLink>
				))}
			</nav>
			<div className="flex items-center gap-3 rounded-xl bg-white/[.05] px-3 py-2.5 ring-1 ring-inset ring-white/[.06]">
				<Avatar name={boot.user.full_name} image={boot.user.image} />
				<div className="min-w-0 leading-tight">
					<div className="truncate text-sm font-bold text-white">{boot.user.full_name}</div>
					<div className="text-[11px] text-sidebar-foreground/70">
						{boot.user.is_manager ? t("Manager") : t("User")}
					</div>
				</div>
			</div>
		</aside>
	);
}

/** Overdue + due-today follow-ups assigned to the current user. */
function NavBadge(_props: { kind: "followups" }) {
	const { data } = useQuery({
		queryKey: followupKeys.counts(true),
		queryFn: () => followupsApi.counts(true),
		staleTime: 60_000,
	});
	const n = (data?.overdue ?? 0) + (data?.today ?? 0);
	if (!n) return null;
	return (
		<span
			className={cn(
				"tabular min-w-5 rounded-full px-1.5 text-center text-[11px] font-bold leading-5 text-white",
				data?.overdue ? "bg-[#e5484d]" : "bg-[#e08a1e]",
			)}
			aria-label={t("{0} follow-ups need attention", n)}
		>
			{n}
		</span>
	);
}

function Topbar({ onMenu }: { onMenu: () => void }) {
	const { boot, lang, setLang } = useBoot();
	return (
		<header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border/70 bg-surface/90 px-4 backdrop-blur-md sm:gap-3 sm:px-5 lg:px-6">
			<Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label={t("Menu")}>
				<Menu />
			</Button>
			<Link to="/" className="flex items-center gap-2 lg:hidden" aria-label={t("Home")}>
				<span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#4f74f0] to-[#2a49c4] text-base font-extrabold text-white">
					{t("Sijil").slice(0, 1)}
				</span>
				<span className="text-base font-extrabold max-[360px]:hidden">{t("Sijil")}</span>
			</Link>
			<div className="flex min-w-0 flex-1 justify-end sm:justify-start">
				<GlobalSearch />
			</div>
			<Button
				variant="ghost"
				size="sm"
				onClick={() => setLang(lang === "ar" ? "en" : "ar")}
				aria-label={t("Change language")}
			>
				<Globe />
				<span className="max-sm:hidden">{lang === "ar" ? "English" : "العربية"}</span>
				<span className="sm:hidden">{lang === "ar" ? "EN" : "ع"}</span>
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						type="button"
						className="flex items-center rounded-full p-0.5 ring-1 ring-border transition hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						aria-label={t("Account")}
					>
						<Avatar name={boot.user.full_name} image={boot.user.image} />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<div className="px-2 py-1.5 text-xs text-muted-foreground">{boot.user.name}</div>
					<DropdownMenuSeparator />
					<DropdownMenuItem onSelect={() => (window.location.href = "/app")}>
						<MonitorCog />
						{t("Open Desk")}
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={() => void logout()}>
						<LogOut />
						{t("Log out")}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</header>
	);
}
