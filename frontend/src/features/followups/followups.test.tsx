import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { rememberLang } from "@/i18n";
import { DEMO } from "@/mocks/db";
import { renderApp } from "@/test/render";

beforeEach(() => rememberLang("en"));

describe("follow-ups", () => {
	it("shows counts per scope and filters to overdue", async () => {
		renderApp("/followups?scope=overdue");
		expect(await screen.findByText(DEMO.overdueFollowup)).toBeInTheDocument();
		expect(screen.queryByText(DEMO.upcomingFollowup)).not.toBeInTheDocument();
		expect(screen.getByRole("tab", { name: /Overdue/ })).toHaveAttribute("aria-selected", "true");
	});

	it("completes a follow-up with its outcome and plans the next one in one step (AC-01 step 4)", async () => {
		const { db } = renderApp("/cases/CASE-00001");
		const followup = db.followups.find((f) => f.case === "CASE-00001" && f.status === "Open")!;
		const eventsBefore = db.events.length;
		const followupsBefore = db.followups.length;

		await userEvent.click(await screen.findByRole("button", { name: "Complete" }));
		const dialog = await screen.findByRole("dialog");
		// The outcome is mandatory, even when nothing moved.
		await userEvent.click(within(dialog).getByRole("button", { name: "Complete follow-up" }));
		expect(await within(dialog).findByText(/even if there was no progress/)).toBeInTheDocument();

		await userEvent.type(within(dialog).getByLabelText(/What actually happened/), "Approval still not issued.");
		const submit = within(dialog).getByRole("button", { name: "Complete follow-up" });
		await userEvent.dblClick(submit);
		await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

		expect(db.events.length).toBe(eventsBefore + 1);
		expect(db.followups.length).toBe(followupsBefore + 1);
		const done = db.followups.find((f) => f.name === followup.name)!;
		expect(done.status).toBe("Completed");
		expect(done.outcome).toBe("Approval still not issued.");
		const event = db.events.find((e) => e.name === done.result_event)!;
		expect(event.source_followup).toBe(followup.name);
		expect(event.event_type).toBe("Contact");
		const next = db.followups.find((f) => f.name === done.next_followup)!;
		expect(next.status).toBe("Open");
		expect(next.originating_event).toBe(event.name);
	});

	it("plans a follow-up from the case page", async () => {
		const { db } = renderApp("/cases/CASE-00004");
		await userEvent.click((await screen.findAllByRole("button", { name: "Plan follow-up" }))[0]!);
		const dialog = await screen.findByRole("dialog");
		await userEvent.type(within(dialog).getByLabelText(/Title/), "Call the provider again");
		await userEvent.click(within(dialog).getByRole("button", { name: "Plan follow-up" }));
		await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
		const created = db.followups.find((f) => f.title === "Call the provider again")!;
		expect(created.case).toBe("CASE-00004");
		expect(created.land).toBe("LAND-00001");
	});
});
