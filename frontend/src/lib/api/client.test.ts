import { describe, expect, it } from "vitest";
import { ApiError, parseResponse } from "./client";

const json = (status: number, body: unknown) =>
	new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("parseResponse", () => {
	it("returns the message of a successful call", async () => {
		await expect(parseResponse(json(200, { message: { name: "CASE-00001" } }))).resolves.toEqual({
			name: "CASE-00001",
		});
	});

	it("maps a Frappe validation error to ApiError with the translated server message", async () => {
		const body = {
			exc_type: "ValidationError",
			_server_messages: JSON.stringify([
				JSON.stringify({ message: "Please describe the actual outcome of this follow-up.", title: "Message" }),
			]),
		};
		const error = (await parseResponse(json(417, body)).catch((e: unknown) => e)) as ApiError;
		expect(error).toBeInstanceOf(ApiError);
		expect(error.status).toBe(417);
		expect(error.message).toBe("Please describe the actual outcome of this follow-up.");
		expect(error.isPermission).toBe(false);
	});

	it("flags permission errors", async () => {
		const error = (await parseResponse(json(403, { exc_type: "PermissionError" })).catch(
			(e: unknown) => e,
		)) as ApiError;
		expect(error.isPermission).toBe(true);
	});

	it("strips HTML from server messages", async () => {
		const body = { _server_messages: JSON.stringify([JSON.stringify({ message: "Case <b>X</b> not found" })]) };
		const error = (await parseResponse(json(404, body)).catch((e: unknown) => e)) as ApiError;
		expect(error.message).toBe("Case X not found");
		expect(error.isNotFound).toBe(true);
	});
});
