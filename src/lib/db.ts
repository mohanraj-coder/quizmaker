import { getCloudflareContext } from "@opennextjs/cloudflare";

import { D1AuthStore } from "@/lib/services/d1-auth-store";

export async function getAuthStore() {
	const { env } = await getCloudflareContext({ async: true });
	if (!env.DB) {
		throw new Error("D1 database binding DB is not configured");
	}
	return new D1AuthStore(env.DB);
}

export async function getSessionSecret() {
	const { env } = await getCloudflareContext({ async: true });
	const secret = env.SESSION_SECRET;
	if (!secret) {
		throw new Error("SESSION_SECRET is not configured");
	}
	return secret;
}
