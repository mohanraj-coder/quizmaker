"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_MESSAGES } from "@/lib/auth/messages";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";
import type { SignInErrors, SignUpErrors } from "@/lib/auth/validation";
import { parseSignInFormData, parseSignUpFormData } from "@/lib/auth/validation";
import { getAuthStore, getSessionSecret } from "@/lib/db";
import {
	authenticateUser,
	destroySession,
	getUserForCookie,
	registerUser,
} from "@/lib/services/auth";

export type SignUpActionState = {
	errors: SignUpErrors;
};

export type SignInActionState = {
	errors: SignInErrors;
};

function isHttps(headerList: Headers): boolean {
	const forwarded = headerList.get("x-forwarded-proto");
	if (forwarded) {
		return forwarded.split(",")[0]?.trim() === "https";
	}
	return false;
}

async function readSessionCookie(): Promise<string | undefined> {
	const jar = await cookies();
	return jar.get(SESSION_COOKIE_NAME)?.value;
}

export async function getCurrentUser() {
	const store = await getAuthStore();
	const secret = await getSessionSecret();
	return getUserForCookie(store, await readSessionCookie(), secret);
}

export async function signUpAction(
	_previous: SignUpActionState,
	formData: FormData,
): Promise<SignUpActionState> {
	try {
		const store = await getAuthStore();
		const result = await registerUser(store, parseSignUpFormData(formData));
		if (!result.ok) {
			return { errors: result.errors };
		}
	} catch {
		return { errors: { form: AUTH_MESSAGES.systemError } };
	}

	redirect("/sign-in?registered=1");
}

export async function signInAction(
	_previous: SignInActionState,
	formData: FormData,
): Promise<SignInActionState> {
	let cookieValue: string | undefined;

	try {
		const store = await getAuthStore();
		const secret = await getSessionSecret();
		const result = await authenticateUser(
			store,
			parseSignInFormData(formData),
			secret,
		);
		if (!result.ok) {
			return { errors: result.errors };
		}
		cookieValue = result.cookie;
	} catch {
		return { errors: { form: AUTH_MESSAGES.systemError } };
	}

	const headerList = await headers();
	const jar = await cookies();
	const options = sessionCookieOptions(isHttps(headerList));
	jar.set({
		name: options.name,
		value: cookieValue,
		httpOnly: options.httpOnly,
		secure: options.secure,
		sameSite: options.sameSite,
		path: options.path,
	});

	redirect("/dashboard");
}

export async function signOutAction() {
	const store = await getAuthStore();
	const secret = await getSessionSecret();
	const headerList = await headers();
	const jar = await cookies();
	const existing = jar.get(SESSION_COOKIE_NAME)?.value;

	await destroySession(store, existing, secret);

	const options = sessionCookieOptions(isHttps(headerList));
	jar.set({
		name: options.name,
		value: "",
		httpOnly: options.httpOnly,
		secure: options.secure,
		sameSite: options.sameSite,
		path: options.path,
		maxAge: 0,
	});

	redirect("/sign-in?signedOut=1");
}
