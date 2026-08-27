import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("hashPassword / verifyPassword", () => {
	it("hashes a password so the original secret is not stored", async () => {
		const password = "Password1!";
		const hash = await hashPassword(password);
		expect(hash).not.toContain(password);
		expect(hash.startsWith("pbkdf2-sha256$")).toBe(true);
	});

	it("verifies the correct password against its hash", async () => {
		const password = "Password1!";
		const hash = await hashPassword(password);
		await expect(verifyPassword(password, hash)).resolves.toBe(true);
	});

	it("rejects an incorrect password", async () => {
		const hash = await hashPassword("Password1!");
		await expect(verifyPassword("Password2!", hash)).resolves.toBe(false);
	});

	it("uses a unique salt so two hashes of the same password differ", async () => {
		const first = await hashPassword("Password1!");
		const second = await hashPassword("Password1!");
		expect(first).not.toBe(second);
	});

	it("rejects a malformed stored hash", async () => {
		await expect(verifyPassword("Password1!", "not-a-hash")).resolves.toBe(
			false,
		);
	});
});
