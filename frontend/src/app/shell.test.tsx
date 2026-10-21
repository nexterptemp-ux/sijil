import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { rememberLang } from "@/i18n";
import { renderApp } from "@/test/render";

describe("app shell", () => {
	it("loads the boot data and shows the navigation and user", async () => {
		rememberLang("en");
		renderApp("/");
		expect(await screen.findByRole("link", { name: "Cases" })).toBeInTheDocument();
		expect(screen.getAllByText("Sara Al-Harbi").length).toBeGreaterThan(0);
		expect(document.documentElement.dir).toBe("ltr");
	});

	it("switches to Arabic and right-to-left", async () => {
		rememberLang("en");
		renderApp("/");
		await userEvent.click(await screen.findByRole("button", { name: "Change language" }));
		await waitFor(() => expect(document.documentElement.dir).toBe("rtl"));
		expect(await screen.findByRole("link", { name: "المعاملات" })).toBeInTheDocument();
		rememberLang(null);
	});

	it("shows a not-found page for unknown routes", async () => {
		rememberLang("en");
		renderApp("/does-not-exist");
		expect(await screen.findByText("Page not found")).toBeInTheDocument();
	});
});
