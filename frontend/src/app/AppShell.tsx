import { Globe, LogOut, Menu, MonitorCog, X } from "lucide-react";
import * as React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Avatar } from "@/components/common";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/menu";
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
			{open && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
			<Sidebar open={open} onClose={() => setOpen(false)} />
			<div className="flex min-w-0 flex-1 flex-col">
				<Topbar onMenu={() => setOpen(true)} />
				<main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8">
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
				"fixed inset-y-0 start-0 z-40 flex w-64 flex-col gap-6 border-e border-border bg-surface px-3 py-5 transition-transform lg:sticky lg:top-0 lg:h-screen",
				!open && "max-lg:-translate-x-full max-lg:rtl:translate-x-full",
			)}
			aria-label={t("Workspace")}
		>
			<div className="flex items-center justify-between px-2">
				<div className="flex items-center gap-3">
					<div className="flex size-9 items-center justify-center rounded-lg bg-primary text-lg font-extrabold text-primary-foreground">
						{t("Sijil").slice(0, 1)}
					</div>
					<div className="leading-tight">
						<div className="font-bold">{t("Sijil")}</div>
						<div className="text-[11px] text-muted-foreground">{t("Land and case follow-up")}</div>
					</div>
				</div>
				<Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose} aria-label={t("Close")}>
					<X />
				</Button>
			</div>
			<nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
				<div className="px-2 pb-1 text-[11px] font-semibold uppercase text-muted-foreground">{t("Workspace")}</div>
				{NAV.map((item) => (
					<NavLink
						key={item.to}
						to={item.to}
						end={item.end}
						className={({ isActive }) =>
							cn(
								"flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
								isActive && "bg-primary-soft text-primary hover:bg-primary-soft hover:text-primary",
							)
						}
					>
						<item.icon className="size-4 shrink-0" aria-hidden />
						<span className="flex-1 truncate">{t(item.label)}</span>
						{item.badge && <NavBadge kind={item.badge} />}
					</NavLink>
				))}
			</nav>
			<div className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
				<Avatar name={boot.user.full_name} image={boot.user.image} />
				<div className="min-w-0 leading-tight">
					<div className="truncate text-sm font-semibold">{boot.user.full_name}</div>
					<div className="text-[11px] text-muted-foreground">{boot.user.is_manager ? t("Manager") : t("User")}</div>
				</div>
			</div>
		</aside>
	);
}

/** Filled in by the follow-ups feature (overdue + due today for the current user). */
export function NavBadge(_props: { kind: "followups" }) {
	return null;
}

function Topbar({ onMenu }: { onMenu: () => void }) {
	const { boot, lang, setLang } = useBoot();
	return (
		<header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur lg:px-8">
			<Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label={t("Menu")}>
				<Menu />
			</Button>
			<div className="min-w-0 flex-1" />
			<Button
				variant="ghost"
				size="sm"
				onClick={() => setLang(lang === "ar" ? "en" : "ar")}
				aria-label={t("Change language")}
			>
				<Globe />
				<span>{lang === "ar" ? "English" : "العربية"}</span>
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						type="button"
						className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
