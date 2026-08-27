import { z } from "zod";

import { AUTH_MESSAGES } from "@/lib/auth/messages";

export type SignUpFields = {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	confirmPassword: string;
};

export type SignInFields = {
	email: string;
	password: string;
};

export type SignUpFieldName = keyof SignUpFields;
export type SignInFieldName = keyof SignInFields | "form";

export type SignUpErrors = Partial<Record<SignUpFieldName | "form", string>>;
export type SignInErrors = Partial<Record<SignInFieldName, string>>;

export type SignUpSuccess = {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
};

export type SignInSuccess = {
	email: string;
	password: string;
};

const NAME_PATTERN = /^[\p{L}]+(?:[ '\-][\p{L}]+)*$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_SPECIAL = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

export const signUpFormSchema = z.object({
	firstName: z.string(),
	lastName: z.string(),
	email: z.string(),
	password: z.string(),
	confirmPassword: z.string(),
});

export const signInFormSchema = z.object({
	email: z.string(),
	password: z.string(),
});

export function canonicalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

function validateName(
	raw: string,
	messages: { required: string; tooLong: string; invalid: string },
): { ok: true; value: string } | { ok: false; error: string } {
	const value = raw.trim();
	if (!value) {
		return { ok: false, error: messages.required };
	}
	if (value.length > 50) {
		return { ok: false, error: messages.tooLong };
	}
	if (!NAME_PATTERN.test(value)) {
		return { ok: false, error: messages.invalid };
	}
	return { ok: true, value };
}

function validateEmailFormat(
	raw: string,
	requiredMessage: string,
): { ok: true; value: string } | { ok: false; error: string } {
	const trimmed = raw.trim();
	if (!trimmed) {
		return { ok: false, error: requiredMessage };
	}
	if (!EMAIL_PATTERN.test(trimmed)) {
		return { ok: false, error: AUTH_MESSAGES.emailInvalid };
	}
	if (trimmed.length > 254) {
		return { ok: false, error: AUTH_MESSAGES.emailTooLong };
	}
	return { ok: true, value: canonicalizeEmail(trimmed) };
}

function validatePassword(password: string): string | undefined {
	if (!password) {
		return AUTH_MESSAGES.passwordRequired;
	}
	if (password.length < 8) {
		return AUTH_MESSAGES.passwordTooShort;
	}
	if (password.length > 128) {
		return AUTH_MESSAGES.passwordTooLong;
	}
	const hasUpper = /[A-Z]/.test(password);
	const hasLower = /[a-z]/.test(password);
	const hasNumber = /[0-9]/.test(password);
	const hasSpecial = PASSWORD_SPECIAL.test(password);
	if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
		return AUTH_MESSAGES.passwordComplexity;
	}
	return undefined;
}

export function validateSignUp(
	input: SignUpFields,
): { ok: true; data: SignUpSuccess } | { ok: false; errors: SignUpErrors } {
	const errors: SignUpErrors = {};

	const firstName = validateName(input.firstName, {
		required: AUTH_MESSAGES.firstNameRequired,
		tooLong: AUTH_MESSAGES.firstNameTooLong,
		invalid: AUTH_MESSAGES.firstNameInvalid,
	});
	if (!firstName.ok) {
		errors.firstName = firstName.error;
	}

	const lastName = validateName(input.lastName, {
		required: AUTH_MESSAGES.lastNameRequired,
		tooLong: AUTH_MESSAGES.lastNameTooLong,
		invalid: AUTH_MESSAGES.lastNameInvalid,
	});
	if (!lastName.ok) {
		errors.lastName = lastName.error;
	}

	const email = validateEmailFormat(input.email, AUTH_MESSAGES.emailRequired);
	if (!email.ok) {
		errors.email = email.error;
	}

	const passwordError = validatePassword(input.password);
	if (passwordError) {
		errors.password = passwordError;
	}

	if (!input.confirmPassword) {
		errors.confirmPassword = AUTH_MESSAGES.confirmPasswordRequired;
	} else if (input.confirmPassword !== input.password) {
		errors.confirmPassword = AUTH_MESSAGES.passwordsDoNotMatch;
	}

	if (Object.keys(errors).length > 0) {
		return { ok: false, errors };
	}

	if (!firstName.ok || !lastName.ok || !email.ok) {
		return { ok: false, errors };
	}

	return {
		ok: true,
		data: {
			firstName: firstName.value,
			lastName: lastName.value,
			email: email.value,
			password: input.password,
		},
	};
}

export function validateSignIn(
	input: SignInFields,
): { ok: true; data: SignInSuccess } | { ok: false; errors: SignInErrors } {
	const errors: SignInErrors = {};

	const email = validateEmailFormat(input.email, AUTH_MESSAGES.signInEmailRequired);
	if (!email.ok) {
		errors.email = email.error;
	}

	if (!input.password) {
		errors.password = AUTH_MESSAGES.signInPasswordRequired;
	}

	if (Object.keys(errors).length > 0) {
		return { ok: false, errors };
	}

	if (!email.ok) {
		return { ok: false, errors };
	}

	return {
		ok: true,
		data: {
			email: email.value,
			password: input.password,
		},
	};
}

export function parseSignUpFormData(formData: FormData): SignUpFields {
	const parsed = signUpFormSchema.parse({
		firstName: String(formData.get("firstName") ?? ""),
		lastName: String(formData.get("lastName") ?? ""),
		email: String(formData.get("email") ?? ""),
		password: String(formData.get("password") ?? ""),
		confirmPassword: String(formData.get("confirmPassword") ?? ""),
	});
	return parsed;
}

export function parseSignInFormData(formData: FormData): SignInFields {
	const parsed = signInFormSchema.parse({
		email: String(formData.get("email") ?? ""),
		password: String(formData.get("password") ?? ""),
	});
	return parsed;
}
