import { Link, useRouteError, type RouteObject } from "react-router-dom";
import { EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { CasePage } from "@/features/cases/CasePage";
import { CasesPage } from "@/features/cases/CasesPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { DocumentsHome, LibraryPage } from "@/features/documents/LibraryPage";
import { FollowUpsPage } from "@/features/followups/FollowUpsPage";
import { LandPage } from "@/features/lands/LandPage";
import { LandsPage } from "@/features/lands/LandsPage";
import { TaskPage } from "@/features/tasks/TaskPage";
import { TasksPage } from "@/features/tasks/TasksPage";
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

function Placeholder({ title }: { title: string }) {
	return <EmptyState className="mt-16" title={t(title)} hint={t("This screen is being built.")} />;
}

export const routes: RouteObject[] = [
	{
		element: <AppShell />,
		errorElement: <RouteError />,
		children: [
			{ index: true, element: <DashboardPage /> },
			{ path: "lands", element: <LandsPage /> },
			{ path: "lands/:name", element: <LandPage /> },
			{ path: "cases", element: <CasesPage /> },
			{ path: "cases/:name", element: <CasePage /> },
			{ path: "followups", element: <FollowUpsPage /> },
			{ path: "tasks", element: <TasksPage /> },
			{ path: "tasks/:name", element: <TaskPage /> },
			{ path: "documents", element: <DocumentsHome /> },
			{ path: "documents/:land", element: <LibraryPage /> },
			{ path: "reports/*", element: <Placeholder title="Reports" /> },
			{ path: "settings", element: <Placeholder title="Settings" /> },
			{ path: "*", element: <NotFound /> },
		],
	},
];
