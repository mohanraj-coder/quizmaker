import { AUTH_MESSAGES } from "@/lib/auth/messages";
import {
	dummyPasswordHash,
	hashPassword,
	verifyPassword,
} from "@/lib/auth/password";
import {
	createSessionId,
	decodeSessionCookie,
	encodeSessionCookie,
} from "@/lib/auth/session";
import type { AuthStore, UserRecord } from "@/lib/auth/store";
import {
	type SignInFields,
	type SignInErrors,
	type SignUpErrors,
	type SignUpFields,
	validateSignIn,
	validateSignUp,
} from "@/lib/auth/validation";

export type PublicUser = {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
};

function toPublicUser(user: UserRecord): PublicUser {
	return {
		id: user.id,
		firstName: user.firstName,
		lastName: user.lastName,
		email: user.email,
	};
}

export async function registerUser(
	store: AuthStore,
	input: SignUpFields,
): Promise<{ ok: true } | { ok: false; errors: SignUpErrors }> {
	const validation = validateSignUp(input);
	if (!validation.ok) {
		return validation;
	}

	const existing = await store.findUserByEmail(validation.data.email);
	if (existing) {
		return { ok: false, errors: { email: AUTH_MESSAGES.emailTaken } };
	}

	await store.insertUser({
		id: crypto.randomUUID(),
		firstName: validation.data.firstName,
		lastName: validation.data.lastName,
		email: validation.data.email,
		passwordHash: await hashPassword(validation.data.password),
	});

	return { ok: true };
}

export async function authenticateUser(
	store: AuthStore,
	input: SignInFields,
	secret: string,
): Promise<
	| { ok: true; cookie: string; user: PublicUser }
	| { ok: false; errors: SignInErrors }
> {
	const validation = validateSignIn(input);
	if (!validation.ok) {
		return validation;
	}

	const user = await store.findUserByEmail(validation.data.email);
	const hash = user?.passwordHash ?? (await dummyPasswordHash());
	const passwordMatches = await verifyPassword(validation.data.password, hash);

	if (!user || !passwordMatches) {
		return { ok: false, errors: { form: AUTH_MESSAGES.invalidCredentials } };
	}

	const sessionId = createSessionId();
	await store.insertSession({ id: sessionId, userId: user.id });
	const cookie = await encodeSessionCookie(sessionId, secret);

	return { ok: true, cookie, user: toPublicUser(user) };
}

export async function getUserForCookie(
	store: AuthStore,
	cookieValue: string | undefined,
	secret: string,
): Promise<PublicUser | null> {
	if (!cookieValue) {
		return null;
	}

	const sessionId = await decodeSessionCookie(cookieValue, secret);
	if (!sessionId) {
		return null;
	}

	const session = await store.findSession(sessionId);
	if (!session) {
		return null;
	}

	const user = await store.findUserById(session.userId);
	if (!user) {
		return null;
	}

	return toPublicUser(user);
}

export async function destroySession(
	store: AuthStore,
	cookieValue: string | undefined,
	secret: string,
): Promise<void> {
	if (!cookieValue) {
		return;
	}

	const sessionId = await decodeSessionCookie(cookieValue, secret);
	if (!sessionId) {
		return;
	}

	await store.deleteSession(sessionId);
}
