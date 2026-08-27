import { describe, expect, it } from "vitest";

import {
	createSessionId,
	decodeSessionCookie,
	encodeSessionCookie,
} from "@/lib/auth/session";

const SECRET = "test-session-secret-value";

describe("session cookie encoding", () => {
	it("creates an unguessable session id", () => {
		const first = createSessionId();
		const second = createSessionId();
		expect(first).not.toBe(second);
		expect(first.length).toBeGreaterThan(32);
	});

	it("round-trips a signed session cookie", async () => {
		const sessionId = createSessionId();
		const cookie = await encodeSessionCookie(sessionId, SECRET);
		await expect(decodeSessionCookie(cookie, SECRET)).resolves.toBe(sessionId);
	});

	it("rejects a tampered cookie", async () => {
		const cookie = await encodeSessionCookie(createSessionId(), SECRET);
		await expect(decodeSessionCookie(`${cookie}x`, SECRET)).resolves.toBe(null);
	});

	it("rejects a cookie signed with a different secret", async () => {
		const cookie = await encodeSessionCookie(createSessionId(), SECRET);
		await expect(decodeSessionCookie(cookie, "other-secret")).resolves.toBe(null);
	});

	it("rejects a malformed cookie", async () => {
		await expect(decodeSessionCookie("not-valid", SECRET)).resolves.toBe(null);
	});
});
