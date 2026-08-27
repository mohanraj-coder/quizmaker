import { beforeEach, describe, expect, it } from "vitest";

import { AUTH_MESSAGES } from "@/lib/auth/messages";
import { verifyPassword } from "@/lib/auth/password";
import type { AuthStore, SessionRecord, UserRecord } from "@/lib/auth/store";
import {
	authenticateUser,
	destroySession,
	getUserForCookie,
	registerUser,
} from "@/lib/services/auth";

const SECRET = "test-session-secret-value";

const validSignUp = {
	firstName: "Ada",
	lastName: "Lovelace",
	email: "ada@example.com",
	password: "Password1!",
	confirmPassword: "Password1!",
};

class InMemoryAuthStore implements AuthStore {
	users: UserRecord[] = [];
	sessions: SessionRecord[] = [];

	async findUserByEmail(email: string) {
		return this.users.find((user) => user.email === email) ?? null;
	}

	async findUserById(id: string) {
		return this.users.find((user) => user.id === id) ?? null;
	}

	async insertUser(user: UserRecord) {
		this.users.push(user);
	}

	async insertSession(session: SessionRecord) {
		this.sessions.push(session);
	}

	async findSession(id: string) {
		return this.sessions.find((session) => session.id === id) ?? null;
	}

	async deleteSession(id: string) {
		this.sessions = this.sessions.filter((session) => session.id !== id);
	}
}

let store: InMemoryAuthStore;

beforeEach(() => {
	store = new InMemoryAuthStore();
});

describe("registerUser", () => {
	it("creates an account without starting a session", async () => {
		const result = await registerUser(store, validSignUp);
		expect(result).toEqual({ ok: true });
		expect(store.users).toHaveLength(1);
		expect(store.sessions).toHaveLength(0);
		expect(store.users[0]?.email).toBe("ada@example.com");
		expect(store.users[0]?.passwordHash).not.toBe(validSignUp.password);
		await expect(
			verifyPassword(validSignUp.password, store.users[0]!.passwordHash),
		).resolves.toBe(true);
	});

	it("rejects invalid sign-up input without writing a user", async () => {
		const result = await registerUser(store, {
			...validSignUp,
			confirmPassword: "nope",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.confirmPassword).toBe(
				AUTH_MESSAGES.passwordsDoNotMatch,
			);
		}
		expect(store.users).toHaveLength(0);
	});

	it("rejects a duplicate email regardless of letter case", async () => {
		await registerUser(store, validSignUp);
		const result = await registerUser(store, {
			...validSignUp,
			email: "  ADA@example.com ",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.email).toBe(AUTH_MESSAGES.emailTaken);
		}
		expect(store.users).toHaveLength(1);
	});
});

describe("authenticateUser", () => {
	it("starts a session for valid credentials", async () => {
		await registerUser(store, validSignUp);
		const result = await authenticateUser(
			store,
			{ email: "Ada@example.com", password: "Password1!" },
			SECRET,
		);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.user.firstName).toBe("Ada");
			expect(result.cookie.includes(".")).toBe(true);
			expect(store.sessions).toHaveLength(1);
			const current = await getUserForCookie(store, result.cookie, SECRET);
			expect(current?.email).toBe("ada@example.com");
		}
	});

	it("returns a generic error for an unknown email", async () => {
		const result = await authenticateUser(
			store,
			{ email: "missing@example.com", password: "Password1!" },
			SECRET,
		);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.form).toBe(AUTH_MESSAGES.invalidCredentials);
			expect(result.errors.form).not.toMatch(/not found/i);
		}
		expect(store.sessions).toHaveLength(0);
	});

	it("returns a generic error for a wrong password", async () => {
		await registerUser(store, validSignUp);
		const result = await authenticateUser(
			store,
			{ email: "ada@example.com", password: "WrongPass1!" },
			SECRET,
		);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.form).toBe(AUTH_MESSAGES.invalidCredentials);
		}
		expect(store.sessions).toHaveLength(0);
	});

	it("does not start a session when sign-in fields are invalid", async () => {
		const result = await authenticateUser(
			store,
			{ email: "", password: "" },
			SECRET,
		);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.email).toBe(AUTH_MESSAGES.signInEmailRequired);
			expect(result.errors.password).toBe(AUTH_MESSAGES.signInPasswordRequired);
		}
		expect(store.sessions).toHaveLength(0);
	});
});

describe("destroySession", () => {
	it("invalidates the server session so the cookie can no longer open the account", async () => {
		await registerUser(store, validSignUp);
		const login = await authenticateUser(
			store,
			{ email: "ada@example.com", password: "Password1!" },
			SECRET,
		);
		expect(login.ok).toBe(true);
		if (!login.ok) {
			return;
		}

		await destroySession(store, login.cookie, SECRET);
		expect(store.sessions).toHaveLength(0);
		await expect(getUserForCookie(store, login.cookie, SECRET)).resolves.toBe(
			null,
		);
	});
});
