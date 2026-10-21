import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());

// React Router's data router builds a fetch Request (Node's undici) for every navigation and passes
// jsdom's AbortSignal, which undici rejects. The app has no loaders, so the signal is not needed in tests.
const NodeRequest = globalThis.Request;
class TestRequest extends NodeRequest {
	constructor(input: RequestInfo | URL, init?: RequestInit) {
		const { signal: _signal, ...rest } = init ?? {};
		super(input, rest);
	}
}
globalThis.Request = TestRequest as typeof Request;
