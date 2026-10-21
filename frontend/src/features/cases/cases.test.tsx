import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { rememberLang } from "@/i18n";
import { DEMO, isoDate } from "@/mocks/db";
import { renderApp } from "@/test/render";

beforeEach(() => rememberLang("en"));

const MASTER = "CASE-00001";

describe("cases list", () => {
	it("filters by status from the URL", async () => {
		renderApp("/cases?status=Awaiting+Action");
		expect((await screen.findAllByText(DEMO.utilities)).length).toBeGreaterThan(0);
		expect(screen.queryByText(DEMO.masterPlan)).not.toBeInTheDocument();
	});
});

describe("case workspace", () => {
	it("puts the current situation, next action and history on one screen", async () => {
		renderApp(`/cases/${MASTER}`);
		expect(await screen.findByText(DEMO.situation)).toBeInTheDocument();
		expect(screen.getByText("Next required action")).toBeInTheDocument();
		expect(await screen.findByRole("article", { name: DEMO.signature })).toBeInTheDocument();
		// The superseded original stays visible next to its correction.
		const original = screen.getByRole("article", { name: DEMO.wrongEntry });
		expect(within(original).getByText("Superseded")).toBeInTheDocument();
	});

	it("records a development that updates the current situation (AC-01)", async () => {
		const { db } = renderApp(`/cases/${MASTER}`);
		await userEvent.click(await screen.findByRole("button", { name: "Record development" }));
		const dialog = await screen.findByRole("dialog");
		await userEvent.type(within(dialog).getByLabelText(/Title/), "Formal approval issued");
		await userEvent.click(within(dialog).getByLabelText("This is an important milestone"));
		await userEvent.click(within(dialog).getByLabelText("Update the current situation of the case"));
		const situation = within(dialog).getByLabelText("New current situation");
		await userEvent.clear(situation);
		await userEvent.type(situation, "Formal approval issued.");
		await userEvent.selectOptions(within(dialog).getByLabelText("New status"), "Completed");
		await userEvent.click(within(dialog).getByRole("button", { name: "Record development" }));
		await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
		const c = db.cases.find((x) => x.name === MASTER)!;
		expect(c.current_situation).toBe("Formal approval issued.");
		expect(c.status).toBe("Completed");
		expect(await screen.findByRole("article", { name: "Formal approval issued" })).toBeInTheDocument();
	});

	it("refuses a development dated in the future", async () => {
		const { db } = renderApp(`/cases/${MASTER}`);
		const before = db.events.length;
		await userEvent.click(await screen.findByRole("button", { name: "Record development" }));
		const dialog = await screen.findByRole("dialog");
		fireEvent.change(within(dialog).getByLabelText(/Actual date/), { target: { value: isoDate(3) } });
		await userEvent.type(within(dialog).getByLabelText(/Title/), "Not yet");
		await userEvent.click(within(dialog).getByRole("button", { name: "Record development" }));
		expect(await within(dialog).findByText(/already happened/)).toBeInTheDocument();
		expect(db.events.length).toBe(before);
	});

	it("corrects a development only with a reason, keeping the original (AC-02)", async () => {
		const { db } = renderApp(`/cases/${MASTER}`);
		const card = await screen.findByRole("article", { name: DEMO.signature });
		await userEvent.click(within(card).getByRole("button", { name: "Correct" }));
		const dialog = await screen.findByRole("dialog");
		const title = within(dialog).getByLabelText(/Title/);
		await userEvent.clear(title);
		await userEvent.type(title, `${DEMO.signature} (بتاريخ الخطاب)`);
		await userEvent.click(within(dialog).getByRole("button", { name: "Record correction" }));
		expect(await within(dialog).findByText("This field is required.")).toBeInTheDocument();
		await userEvent.type(within(dialog).getByLabelText(/Reason for correction/), "Added the letter date");
		await userEvent.click(within(dialog).getByRole("button", { name: "Record correction" }));
		await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
		const original = db.events.find((e) => e.title === DEMO.signature)!;
		expect(original.entry_status).toBe("Superseded");
		const corrected = db.events.find((e) => e.name === original.superseded_by)!;
		expect(corrected.corrects).toBe(original.name);
		expect(corrected.correction_reason).toBe("Added the letter date");
		// Documents linked to the original are carried over.
		expect(db.links.some((l) => l.linked_name === corrected.name)).toBe(true);
	});
});
