import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { rememberLang } from "@/i18n";
import { DEMO, seed } from "@/mocks/db";
import { renderApp } from "@/test/render";

beforeEach(() => rememberLang("en"));

describe("lands", () => {
	it("lists lands and filters by search", async () => {
		renderApp("/lands");
		expect(await screen.findByText(DEMO.konooz)).toBeInTheDocument();
		await userEvent.type(screen.getByRole("searchbox"), "الرياض");
		await waitFor(() => expect(screen.queryByText(DEMO.konooz)).not.toBeInTheDocument());
		expect(screen.getByText(DEMO.riyadh)).toBeInTheDocument();
	});

	it("shows a land with its open cases and responsible employees", async () => {
		renderApp("/lands/LAND-00001");
		expect(await screen.findByRole("heading", { name: new RegExp(DEMO.konooz) })).toBeInTheDocument();
		const cases = (await screen.findAllByText(DEMO.masterPlan))[0]!;
		expect(cases).toBeInTheDocument();
		expect(screen.getAllByText(DEMO.ahmed).length).toBeGreaterThan(0);
	});

	it("lets a manager create a land; the name is required", async () => {
		const { db, router } = renderApp("/lands");
		await userEvent.click(await screen.findByRole("button", { name: /New Land \/ Project/ }));
		const dialog = await screen.findByRole("dialog");
		await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
		expect(await within(dialog).findByText("This field is required.")).toBeInTheDocument();
		await userEvent.type(within(dialog).getByLabelText(/Land \/ Project Name/), "Jazan Coastal Plot");
		await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
		await screen.findByRole("heading", { name: /Jazan Coastal Plot/ });
		const created = db.lands.find((l) => l.land_name === "Jazan Coastal Plot");
		expect(created).toBeTruthy();
		expect(router.state.location.pathname).toBe(`/lands/${created!.name}`);
	});

	it("hides land creation from non-managers", async () => {
		const db = seed();
		db.manager = false;
		renderApp("/lands", db);
		await screen.findByText(DEMO.konooz);
		expect(screen.queryByRole("button", { name: /New Land \/ Project/ })).not.toBeInTheDocument();
	});
});
