import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { BootGate } from "@/app/boot";
import { BASENAME, ROUTER_FUTURE, routes } from "@/app/routes";
import { ApiError } from "@/lib/api/client";
import "@fontsource-variable/cairo/wght.css";
import "@/styles/index.css";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 30_000,
			refetchOnWindowFocus: false,
			// Don't retry what will fail again.
			retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
		},
	},
});

const router = createBrowserRouter(routes, { basename: BASENAME, future: ROUTER_FUTURE });

async function start() {
	if (import.meta.env.MODE === "mock") {
		const { installMockBackend } = await import("@/mocks");
		installMockBackend();
	}
	createRoot(document.getElementById("root")!).render(
		<StrictMode>
			<QueryClientProvider client={queryClient}>
				<BootGate>
					<RouterProvider router={router} future={{ v7_startTransition: true }} />
				</BootGate>
				<Toaster position="bottom-center" richColors closeButton />
			</QueryClientProvider>
		</StrictMode>,
	);
}

void start();
