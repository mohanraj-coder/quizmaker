import { getCloudflareContext } from "@opennextjs/cloudflare";

import { D1AuthStore } from "@/lib/services/d1-auth-store";
import { D1McqStore } from "@/lib/services/d1-mcq-store";

async function getDb() {
	const { env } = await getCloudflareContext({ async: true });
	if (!env.DB) {
		throw new Error("D1 database binding DB is not configured");
	}
	return env.DB;
}

export async function getAuthStore() {
	return new D1AuthStore(await getDb());
}

export async function getMcqStore() {
	return new D1McqStore(await getDb());
}

export async function getSessionSecret() {
	const { env } = await getCloudflareContext({ async: true });
	const secret = env.SESSION_SECRET;
	if (!secret) {
		throw new Error("SESSION_SECRET is not configured");
	}
	return secret;
}
