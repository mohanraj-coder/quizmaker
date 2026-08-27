import { describe, expect, it } from "vitest";

import { AUTH_MESSAGES } from "@/lib/auth/messages";
import {
	canonicalizeEmail,
	validateSignIn,
	validateSignUp,
} from "@/lib/auth/validation";

const validSignUp = {
	firstName: "Ada",
	lastName: "Lovelace",
	email: "ada@example.com",
	password: "Password1!",
	confirmPassword: "Password1!",
};

describe("canonicalizeEmail", () => {
	it("trims spaces and ignores letter case", () => {
		expect(canonicalizeEmail("  Alex@Example.com ")).toBe("alex@example.com");
	});
});

describe("validateSignUp", () => {
	it("accepts a complete valid registration", () => {
		const result = validateSignUp(validSignUp);
		expect(result).toEqual({
			ok: true,
			data: {
				firstName: "Ada",
				lastName: "Lovelace",
				email: "ada@example.com",
				password: "Password1!",
			},
		});
	});

	it("trims names and canonicalises email on success", () => {
		const result = validateSignUp({
			...validSignUp,
			firstName: "  Mary-Jane ",
			lastName: "  O'Brien ",
			email: "  Ada@Example.com ",
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.data.firstName).toBe("Mary-Jane");
			expect(result.data.lastName).toBe("O'Brien");
			expect(result.data.email).toBe("ada@example.com");
		}
	});

	it("rejects a missing first name", () => {
		const result = validateSignUp({ ...validSignUp, firstName: "   " });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.firstName).toBe(AUTH_MESSAGES.firstNameRequired);
		}
	});

	it("rejects a first name longer than 50 characters", () => {
		const result = validateSignUp({ ...validSignUp, firstName: "A".repeat(51) });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.firstName).toBe(AUTH_MESSAGES.firstNameTooLong);
		}
	});

	it("rejects a first name with invalid characters", () => {
		const result = validateSignUp({ ...validSignUp, firstName: "Ada3" });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.firstName).toBe(AUTH_MESSAGES.firstNameInvalid);
		}
	});

	it("rejects a missing last name", () => {
		const result = validateSignUp({ ...validSignUp, lastName: "" });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.lastName).toBe(AUTH_MESSAGES.lastNameRequired);
		}
	});

	it("rejects a last name longer than 50 characters", () => {
		const result = validateSignUp({ ...validSignUp, lastName: "B".repeat(51) });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.lastName).toBe(AUTH_MESSAGES.lastNameTooLong);
		}
	});

	it("rejects a last name with invalid characters", () => {
		const result = validateSignUp({ ...validSignUp, lastName: "Love@lace" });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.lastName).toBe(AUTH_MESSAGES.lastNameInvalid);
		}
	});

	it("rejects a missing email", () => {
		const result = validateSignUp({ ...validSignUp, email: " " });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.email).toBe(AUTH_MESSAGES.emailRequired);
		}
	});

	it("rejects an email that is not a valid format", () => {
		const result = validateSignUp({ ...validSignUp, email: "not-an-email" });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.email).toBe(AUTH_MESSAGES.emailInvalid);
		}
	});

	it("rejects an email whose domain has no dot", () => {
		const result = validateSignUp({ ...validSignUp, email: "user@localhost" });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.email).toBe(AUTH_MESSAGES.emailInvalid);
		}
	});

	it("rejects an email longer than 254 characters", () => {
		const local = "a".repeat(64);
		const domain = `${"b".repeat(190)}.com`;
		const email = `${local}@${domain}`;
		expect(email.length).toBeGreaterThan(254);
		const result = validateSignUp({ ...validSignUp, email });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.email).toBe(AUTH_MESSAGES.emailTooLong);
		}
	});

	it("rejects a missing password", () => {
		const result = validateSignUp({
			...validSignUp,
			password: "",
			confirmPassword: "",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.password).toBe(AUTH_MESSAGES.passwordRequired);
		}
	});

	it("rejects a password shorter than 8 characters", () => {
		const result = validateSignUp({
			...validSignUp,
			password: "Ab1!",
			confirmPassword: "Ab1!",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.password).toBe(AUTH_MESSAGES.passwordTooShort);
		}
	});

	it("rejects a password longer than 128 characters", () => {
		const password = `Aa1!${"x".repeat(125)}`;
		const result = validateSignUp({
			...validSignUp,
			password,
			confirmPassword: password,
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.password).toBe(AUTH_MESSAGES.passwordTooLong);
		}
	});

	it("rejects a password missing an uppercase letter", () => {
		const result = validateSignUp({
			...validSignUp,
			password: "password1!",
			confirmPassword: "password1!",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.password).toBe(AUTH_MESSAGES.passwordComplexity);
		}
	});

	it("rejects a password missing a lowercase letter", () => {
		const result = validateSignUp({
			...validSignUp,
			password: "PASSWORD1!",
			confirmPassword: "PASSWORD1!",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.password).toBe(AUTH_MESSAGES.passwordComplexity);
		}
	});

	it("rejects a password missing a number", () => {
		const result = validateSignUp({
			...validSignUp,
			password: "Password!",
			confirmPassword: "Password!",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.password).toBe(AUTH_MESSAGES.passwordComplexity);
		}
	});

	it("rejects a password missing a special character", () => {
		const result = validateSignUp({
			...validSignUp,
			password: "Password1",
			confirmPassword: "Password1",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.password).toBe(AUTH_MESSAGES.passwordComplexity);
		}
	});

	it("rejects a missing confirm password", () => {
		const result = validateSignUp({ ...validSignUp, confirmPassword: "" });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.confirmPassword).toBe(
				AUTH_MESSAGES.confirmPasswordRequired,
			);
		}
	});

	it("rejects sign up when passwords do not match", () => {
		const result = validateSignUp({
			...validSignUp,
			confirmPassword: "Password1?",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.confirmPassword).toBe(
				AUTH_MESSAGES.passwordsDoNotMatch,
			);
		}
	});

	it("reports every invalid field on an empty form", () => {
		const result = validateSignUp({
			firstName: "",
			lastName: "",
			email: "",
			password: "",
			confirmPassword: "",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.firstName).toBe(AUTH_MESSAGES.firstNameRequired);
			expect(result.errors.lastName).toBe(AUTH_MESSAGES.lastNameRequired);
			expect(result.errors.email).toBe(AUTH_MESSAGES.emailRequired);
			expect(result.errors.password).toBe(AUTH_MESSAGES.passwordRequired);
			expect(result.errors.confirmPassword).toBe(
				AUTH_MESSAGES.confirmPasswordRequired,
			);
		}
	});
});

describe("validateSignIn", () => {
	it("accepts a valid email and password", () => {
		const result = validateSignIn({
			email: "  Ada@Example.com ",
			password: "any-secret",
		});
		expect(result).toEqual({
			ok: true,
			data: { email: "ada@example.com", password: "any-secret" },
		});
	});

	it("rejects a missing email", () => {
		const result = validateSignIn({ email: "", password: "secret" });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.email).toBe(AUTH_MESSAGES.signInEmailRequired);
		}
	});

	it("rejects an invalid sign-in email format", () => {
		const result = validateSignIn({ email: "nope", password: "secret" });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.email).toBe(AUTH_MESSAGES.emailInvalid);
		}
	});

	it("rejects a missing password", () => {
		const result = validateSignIn({ email: "ada@example.com", password: "" });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.password).toBe(AUTH_MESSAGES.signInPasswordRequired);
		}
	});
});
