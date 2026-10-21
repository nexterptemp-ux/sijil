// In-memory backend for `npm run dev:mock` and tests. Never bundled into the production build
// (loaded only through a dynamic import guarded by the "mock" mode).
import { ApiError, setTransport, type Transport } from "@/lib/api/client";
import { seed, type MockDb } from "./db";
import { handlers, uploadHandler } from "./handlers";

export function createMockTransport(db: MockDb = seed(), latency = 120): Transport & { db: MockDb } {
	const wait = () => new Promise((r) => setTimeout(r, latency));
	const clone = <T>(v: T): T => (v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T));
	return {
		db,
		async call(method, args) {
			await wait();
			const handler = handlers[method];
			if (!handler) throw new ApiError(`Mock backend: ${method} is not implemented`, 404, "DoesNotExistError");
			return clone(handler(db, args));
		},
		async upload(method, form) {
			await wait();
			return clone(uploadHandler(db, method, form));
		},
	};
}

export function installMockBackend(): MockDb {
	const transport = createMockTransport();
	setTransport(transport);
	return transport.db;
}
