// Test helper: render the real app (routes, boot, query cache) on top of the in-memory mock backend.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { BootGate } from "@/app/boot";
import { ROUTER_FUTURE, routes } from "@/app/routes";
import { setTransport } from "@/lib/api/client";
import { createMockTransport } from "@/mocks";
import { seed, type MockDb } from "@/mocks/db";

export function renderApp(path = "/", db: MockDb = seed()) {
	const transport = createMockTransport(db, 0);
	setTransport(transport);
	const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
	const router = createMemoryRouter(routes, { initialEntries: [path], future: ROUTER_FUTURE });
	const utils = render(
		<QueryClientProvider client={client}>
			<BootGate>
				<RouterProvider router={router} future={{ v7_startTransition: true }} />
			</BootGate>
		</QueryClientProvider>,
	);
	return { ...utils, db, router, client };
}
