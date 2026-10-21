import type * as React from "react";
import { Link, useRouteError, type RouteObject } from "react-router-dom";
import { EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n";
import { AppShell } from "./AppShell";

/** Base path of the SPA as served by Frappe (sijil/www/sijil.html). */
export const BASENAME = "/sijil";

export const ROUTER_FUTURE = {
	v7_relativeSplatPath: true,
	v7_fetcherPersist: true,
	v7_normalizeFormMethod: true,
	v7_partialHydration: true,
	v7_skipActionErrorRevalidation: true,
};

function NotFound() {
	return (
		<EmptyState
			className="mt-16"
			title={t("Page not found")}
			hint={t("The page you are looking for does not exist or was moved.")}
			action={
				<Button asChild variant="outline">
					<Link to="/">{t("Go to Home")}</Link>
				</Button>
			}
		/>
	);
}

function RouteError() {
	const error = useRouteError();
	return <ErrorState error={error} onRetry={() => window.location.reload()} className="mt-16" />;
}

/** Each screen is its own chunk so phones download only what they open. */
function page<M extends Record<string, unknown>>(load: () => Promise<M>, name: keyof M & string) {
	return () => load().then((m) => ({ Component: m[name] as React.ComponentType }));
}

export const routes: RouteObject[] = [
	{
		element: <AppShell />,
		errorElement: <RouteError />,
		children: [
			{ index: true, lazy: page(() => import("@/features/dashboard/DashboardPage"), "DashboardPage") },
			{ path: "lands", lazy: page(() => import("@/features/lands/LandsPage"), "LandsPage") },
			{ path: "lands/:name", lazy: page(() => import("@/features/lands/LandPage"), "LandPage") },
			{ path: "cases", lazy: page(() => import("@/features/cases/CasesPage"), "CasesPage") },
			{ path: "cases/:name", lazy: page(() => import("@/features/cases/CasePage"), "CasePage") },
			{ path: "followups", lazy: page(() => import("@/features/followups/FollowUpsPage"), "FollowUpsPage") },
			{ path: "tasks", lazy: page(() => import("@/features/tasks/TasksPage"), "TasksPage") },
			{ path: "tasks/:name", lazy: page(() => import("@/features/tasks/TaskPage"), "TaskPage") },
			{ path: "documents", lazy: page(() => import("@/features/documents/LibraryPage"), "DocumentsHome") },
			{ path: "documents/:land", lazy: page(() => import("@/features/documents/LibraryPage"), "LibraryPage") },
			{ path: "reports", lazy: page(() => import("@/features/reports/ReportsPage"), "ReportsPage") },
			{ path: "reports/case/:name", lazy: () => import("@/features/reports/HistoryReportPage").then((m) => ({ element: <m.HistoryReportPage kind="case" /> })) },
			{ path: "reports/land/:name", lazy: () => import("@/features/reports/HistoryReportPage").then((m) => ({ element: <m.HistoryReportPage kind="land" /> })) },
			{ path: "reports/:report", lazy: page(() => import("@/features/reports/ReportView"), "ReportView") },
			{ path: "settings", lazy: page(() => import("@/features/administration/SettingsPage"), "SettingsPage") },
			{ path: "*", element: <NotFound /> },
		],
	},
];
