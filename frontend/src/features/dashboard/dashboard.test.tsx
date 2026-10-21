import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { rememberLang } from "@/i18n";
import { DEMO } from "@/mocks/db";
import { renderApp } from "@/test/render";

beforeEach(() => rememberLang("en"));

describe("dashboard", () => {
	it("shows counts and the follow-ups that need attention", async () => {
		const { db } = renderApp("/");
		const tile = await screen.findByRole("link", { name: /Overdue follow-ups/ });
		const today = new Date();
		const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
		const overdue = db.followups.filter((f) => f.status === "Open" && f.due_date < iso).length;
		expect(within(tile).getByText(String(overdue))).toBeInTheDocument();
		expect(tile).toHaveAttribute("href", "/followups?scope=overdue");
		expect(screen.getByText(DEMO.overdueFollowup)).toBeInTheDocument();
	});

	it("searches globally and navigates to a case", async () => {
		const { router } = renderApp("/");
		await userEvent.click(await screen.findByRole("button", { name: "Search" }));
		await userEvent.type(screen.getByRole("combobox"), "المخطط");
		await userEvent.click((await screen.findAllByRole("option", { name: new RegExp(DEMO.masterPlan) }))[0]!);
		await waitFor(() => expect(router.state.location.pathname).toBe("/cases/CASE-00001"));
	});
});
