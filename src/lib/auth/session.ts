const SESSION_COOKIE_NAME = "qm_session";

export { SESSION_COOKIE_NAME };

function toBase64Url(bytes: Uint8Array): string {
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value: string): Uint8Array | null {
	try {
		const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
		const base64 = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
		const binary = atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes;
	} catch {
		return null;
	}
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
	if (a.length !== b.length) {
		return false;
	}
	let diff = 0;
	for (let i = 0; i < a.length; i++) {
		diff |= a[i] ^ b[i];
	}
	return diff === 0;
}

async function sign(secret: string, value: string): Promise<Uint8Array> {
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const signature = await crypto.subtle.sign(
		"HMAC",
		key,
		new TextEncoder().encode(value),
	);
	return new Uint8Array(signature);
}

export function createSessionId(): string {
	return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function encodeSessionCookie(
	sessionId: string,
	secret: string,
): Promise<string> {
	const signature = await sign(secret, sessionId);
	return `${sessionId}.${toBase64Url(signature)}`;
}

export async function decodeSessionCookie(
	cookieValue: string,
	secret: string,
): Promise<string | null> {
	const separator = cookieValue.lastIndexOf(".");
	if (separator <= 0) {
		return null;
	}
	const sessionId = cookieValue.slice(0, separator);
	const provided = fromBase64Url(cookieValue.slice(separator + 1));
	if (!sessionId || !provided) {
		return null;
	}
	const expected = await sign(secret, sessionId);
	if (!timingSafeEqual(provided, expected)) {
		return null;
	}
	return sessionId;
}

export function sessionCookieOptions(isHttps: boolean) {
	return {
		httpOnly: true,
		secure: isHttps,
		sameSite: "lax" as const,
		path: "/",
		name: SESSION_COOKIE_NAME,
	};
}
