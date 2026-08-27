const ITERATIONS = 100_000;
const HASH_BITS = 256;
const SALT_BYTES = 16;

function toBase64(bytes: Uint8Array): string {
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary);
}

function fromBase64(value: string): Uint8Array | null {
	try {
		const binary = atob(value);
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

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
	const copy = new Uint8Array(bytes.byteLength);
	copy.set(bytes);
	return copy.buffer;
}

async function deriveBits(
	password: string,
	salt: Uint8Array,
	iterations: number,
): Promise<Uint8Array> {
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);
	const bits = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt: toArrayBuffer(salt),
			iterations,
			hash: "SHA-256",
		},
		keyMaterial,
		HASH_BITS,
	);
	return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
	const hash = await deriveBits(password, salt, ITERATIONS);
	return `pbkdf2-sha256$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

export async function verifyPassword(
	password: string,
	storedHash: string,
): Promise<boolean> {
	const parts = storedHash.split("$");
	if (parts.length !== 4 || parts[0] !== "pbkdf2-sha256") {
		return false;
	}
	const iterations = Number(parts[1]);
	if (!Number.isInteger(iterations) || iterations < 1) {
		return false;
	}
	const salt = fromBase64(parts[2]);
	const expected = fromBase64(parts[3]);
	if (!salt || !expected) {
		return false;
	}
	const actual = await deriveBits(password, salt, iterations);
	return timingSafeEqual(actual, expected);
}

let dummyHashPromise: Promise<string> | undefined;

export async function dummyPasswordHash(): Promise<string> {
	dummyHashPromise ??= hashPassword("timing-safe-dummy-password");
	return dummyHashPromise;
}
