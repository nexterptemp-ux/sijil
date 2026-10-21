import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { rememberLang } from "@/i18n";
import { renderApp } from "@/test/render";

beforeEach(() => rememberLang("en"));

describe("tasks", () => {
	it("creates a task without a case", async () => {
		const { db, router } = renderApp("/tasks");
		await userEvent.click(await screen.findByRole("button", { name: "New Task" }));
		const dialog = await screen.findByRole("dialog");
		await userEvent.type(within(dialog).getByLabelText(/Title/), "Prepare the board pack");
		await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
		await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/tasks\/STK-/));
		const task = db.tasks.find((x) => x.title === "Prepare the board pack")!;
		expect(task.case).toBeNull();
		expect(task.land).toBeNull();
		expect(await screen.findByRole("heading", { name: "Prepare the board pack" })).toBeInTheDocument();
	});

	it("shows overdue tasks and completes one with notes", async () => {
		const { db } = renderApp("/tasks?scope=overdue");
		await userEvent.click(await screen.findByText("Review consultant submission for the master plan"));
		await userEvent.click(await screen.findByRole("button", { name: "Mark complete" }));
		const dialog = await screen.findByRole("dialog");
		await userEvent.type(within(dialog).getByLabelText("Completion notes"), "Reviewed and sent comments.");
		await userEvent.click(within(dialog).getByRole("button", { name: "Mark complete" }));
		await waitFor(() => expect(db.tasks.find((x) => x.name === "STK-00002")!.status).toBe("Completed"));
		expect(db.tasks.find((x) => x.name === "STK-00002")!.completion_notes).toBe("Reviewed and sent comments.");
	});

	it("adds a progress note", async () => {
		const { db } = renderApp("/tasks/STK-00001");
		await userEvent.type(await screen.findByLabelText("Progress note"), "Slides drafted.");
		await userEvent.click(screen.getByRole("button", { name: "Add note" }));
		expect(await screen.findByText("Slides drafted.")).toBeInTheDocument();
		expect(db.tasks[0]!.updates.at(-1).note).toBe("Slides drafted.");
	});
});
