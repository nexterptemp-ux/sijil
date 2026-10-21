import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { rememberLang } from "@/i18n";
import { seed } from "@/mocks/db";
import { renderApp } from "@/test/render";

beforeEach(() => rememberLang("en"));

describe("reports", () => {
	it("lists the operational reports and runs one", async () => {
		renderApp("/reports");
		await userEvent.click(await screen.findByRole("link", { name: /Sijil Overdue Follow Ups/ }));
		expect(await screen.findAllByText("Ask Saudi Electricity for the site visit date")).not.toHaveLength(0);
		expect(screen.getByRole("button", { name: "Export CSV" })).toBeEnabled();
	});

	it("shows the case history report with a PDF download link", async () => {
		renderApp("/reports/case/CASE-00001");
		expect(await screen.findByRole("heading", { name: /Case History Report - Master Plan Approval/ })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Download PDF" })).toHaveAttribute("href", "/api/method/sijil.api.reports.case_history_pdf?case=CASE-00001");
		expect(screen.getByTitle(/Case History Report/)).toBeInTheDocument();
	});
});

describe("settings", () => {
	it("lets a manager switch an integration on", async () => {
		const { db } = renderApp("/settings");
		const toggle = await screen.findByRole("switch", { name: "Two-way task sync" });
		expect(toggle).toHaveAttribute("aria-checked", "false");
		await userEvent.click(toggle);
		await waitFor(() => expect(db.settings.enable_task_sync).toBe(1));
		expect(await screen.findByRole("switch", { name: "Two-way task sync" })).toHaveAttribute("aria-checked", "true");
	});

	it("shows integrations read-only to non-managers", async () => {
		const db = seed();
		db.manager = false;
		renderApp("/settings", db);
		const toggle = await screen.findByRole("switch", { name: "ToDo for assignees" });
		expect(toggle).toBeDisabled();
		expect(within(document.body).getByText("Only managers can change these settings.")).toBeInTheDocument();
	});
});
