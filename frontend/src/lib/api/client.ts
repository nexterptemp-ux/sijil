// The only way the app talks to the backend. Contract: docs/architecture/api.md
//
// Every call goes to POST /api/method/sijil.api.<method> on the same origin, authenticated by
// the Frappe session cookie, with the CSRF token in X-Frappe-CSRF-Token.

export type ApiArgs = Record<string, unknown>;

export class ApiError extends Error {
	status: number;
	excType?: string;
	title?: string;

	constructor(message: string, status: number, excType?: string, title?: string) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.excType = excType;
		this.title = title;
	}

	get isPermission() {
		return this.status === 403 || this.excType === "PermissionError";
	}

	get isNotFound() {
		return this.status === 404 || this.excType === "DoesNotExistError";
	}
}

/** A transport performs one call. Replaced by the in-memory mock backend in `--mode mock` and tests. */
export interface Transport {
	call(method: string, args: ApiArgs): Promise<unknown>;
	upload(method: string, form: FormData): Promise<unknown>;
}

declare global {
	interface Window {
		csrf_token?: string;
	}
}

function csrfToken(): string {
	const token = window.csrf_token;
	// The served page renders the token with Jinja; an unrendered "{{ ... }}" means dev mode.
	return token && !token.startsWith("{{") ? token : "";
}

function serverMessage(body: Record<string, unknown>): { message?: string; title?: string } {
	const raw = body._server_messages;
	if (typeof raw === "string") {
		try {
			const list = JSON.parse(raw) as string[];
			for (const item of list) {
				const parsed = JSON.parse(item) as { message?: string; title?: string };
				if (parsed.message) return { message: stripHtml(parsed.message), title: parsed.title };
			}
		} catch {
			/* fall through */
		}
	}
	if (typeof body.message === "string") return { message: body.message };
	if (typeof body.exception === "string") return { message: body.exception.split(":").slice(1).join(":").trim() };
	return {};
}

function stripHtml(text: string): string {
	const div = document.createElement("div");
	div.innerHTML = text;
	return div.textContent || text;
}

export async function parseResponse(res: Response): Promise<unknown> {
	let body: Record<string, unknown> = {};
	try {
		body = (await res.json()) as Record<string, unknown>;
	} catch {
		/* non-JSON (e.g. proxy error page) */
	}
	if (!res.ok) {
		const { message, title } = serverMessage(body);
		throw new ApiError(
			message || res.statusText || "Request failed",
			res.status,
			typeof body.exc_type === "string" ? body.exc_type : undefined,
			title,
		);
	}
	return body.message;
}

export const httpTransport: Transport = {
	async call(method, args) {
		const res = await fetch(`/api/method/sijil.api.${method}`, {
			method: "POST",
			credentials: "same-origin",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				"X-Frappe-CSRF-Token": csrfToken(),
			},
			body: JSON.stringify(args),
		});
		return parseResponse(res);
	},
	async upload(method, form) {
		const res = await fetch(`/api/method/sijil.api.${method}`, {
			method: "POST",
			credentials: "same-origin",
			headers: { Accept: "application/json", "X-Frappe-CSRF-Token": csrfToken() },
			body: form,
		});
		return parseResponse(res);
	},
};

let transport: Transport = httpTransport;

export function setTransport(next: Transport) {
	transport = next;
}

export function call<T>(method: string, args: ApiArgs = {}): Promise<T> {
	return transport.call(method, args) as Promise<T>;
}

export function upload<T>(method: string, form: FormData): Promise<T> {
	return transport.upload(method, form) as Promise<T>;
}

/** End the Frappe session and go to the login page. */
export async function logout(): Promise<void> {
	if (transport === httpTransport) {
		await fetch("/api/method/logout", {
			method: "POST",
			credentials: "same-origin",
			headers: { "X-Frappe-CSRF-Token": csrfToken() },
		}).catch(() => undefined);
	}
	window.location.href = "/login";
}

/** URL of a file download endpoint (GET, uses the session cookie). */
export function methodUrl(method: string, args: Record<string, string>): string {
	return `/api/method/sijil.api.${method}?${new URLSearchParams(args).toString()}`;
}
