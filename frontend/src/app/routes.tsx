import { Link, useRouteError, type RouteObject } from "react-router-dom";
import { EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
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
			{ path: "lands/*", element: <Placeholder title="Lands and Projects" /> },
			{ path: "cases/*", element: <Placeholder title="Cases" /> },
			{ path: "followups", element: <Placeholder title="Follow-ups" /> },
			{ path: "tasks/*", element: <Placeholder title="Tasks" /> },
			{ path: "documents/*", element: <Placeholder title="Document Library" /> },
			{ path: "reports/*", element: <Placeholder title="Reports" /> },
			{ path: "settings", element: <Placeholder title="Settings" /> },
			{ path: "*", element: <NotFound /> },
		],
	},
];
