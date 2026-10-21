import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { rememberLang } from "@/i18n";
import { DEMO } from "@/mocks/db";
import { renderApp } from "@/test/render";

beforeEach(() => rememberLang("en"));

const pdf = (name: string) => new File(["%PDF-1.4 test"], name, { type: "application/pdf" });

describe("document library", () => {
	it("browses folders with breadcrumbs", async () => {
		renderApp("/documents/LAND-00001");
		// Folder buttons exist both in the tree and in the folder grid; use the grid (last).
		const open = async (name: RegExp) => userEvent.click((await screen.findAllByRole("button", { name })).at(-1)!);
		await open(new RegExp(DEMO.govApprovals));
		await open(new RegExp(DEMO.signatureFolder));
		expect(await screen.findByText(DEMO.signedLetter)).toBeInTheDocument();
		expect(
			within(screen.getByRole("navigation", { name: "Folder path" })).getByText(DEMO.konooz),
		).toBeInTheDocument();
	});

	it("uploads a file once into the current folder (AC-01 step 3)", async () => {
		const { db } = renderApp("/documents/LAND-00001");
		await screen.findAllByRole("button", { name: new RegExp(DEMO.govApprovals) });
		await userEvent.click(screen.getAllByRole("button", { name: "Upload" })[0]!);
		const dialog = await screen.findByRole("dialog");
		await userEvent.upload(within(dialog).getByLabelText(/File/), pdf("formal-approval.pdf"));
		await userEvent.click(within(dialog).getByRole("button", { name: "Upload" }));
		await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
		const doc = db.documents.find((d) => d.title === "formal-approval")!;
		expect(doc.version_count).toBe(1);
		expect(db.versions.filter((v) => v.document === doc.name)).toHaveLength(1);
	});

	it("keeps a historical link pinned when a new version is uploaded (AC-03)", async () => {
		const { db } = renderApp("/documents/LAND-00001?doc=DOC-0000003");
		const dialog = await screen.findByRole("dialog");
		expect(await within(dialog).findAllByText(/pinned to v\W*1\W*$/)).not.toHaveLength(0);
		await userEvent.upload(within(dialog).getByLabelText("Upload new version"), pdf("signed-v2.pdf"));
		await waitFor(() => expect(db.documents.find((d) => d.name === "DOC-0000003")!.version_count).toBe(2));
		// The event still points at version 1.
		const link = db.links.find((l) => l.document === "DOC-0000003" && l.linked_doctype === "Sijil Case Event")!;
		expect(db.versions.find((v) => v.name === link.document_version)!.version_no).toBe(1);
	});

	it("shows a newer-version hint on a development that references an older version", async () => {
		renderApp("/cases/CASE-00001");
		const card = await screen.findByRole("article", { name: DEMO.technicalReview });
		expect(within(card).getByText(DEMO.prelimPlan)).toBeInTheDocument();
		expect(within(card).getByText("Newer version available")).toBeInTheDocument();
	});
});
