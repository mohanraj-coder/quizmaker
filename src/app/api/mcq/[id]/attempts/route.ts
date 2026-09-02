import { NextResponse } from "next/server";

import { getCurrentUser } from "@/app/actions/auth";
import { handleCreateAttempt, handleListAttempts } from "@/lib/mcq/http";
import { getMcqStore } from "@/lib/db";

export const dynamic = "force-dynamic";

function toResponse(result: {
	status: number;
	body?: Record<string, unknown>;
}) {
	if (result.status === 204) {
		return new NextResponse(null, { status: 204 });
	}
	return NextResponse.json(result.body, { status: result.status });
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
	const { id } = await context.params;
	const user = await getCurrentUser();
	const store = await getMcqStore();
	return toResponse(await handleListAttempts(store, user, id));
}

export async function POST(request: Request, context: RouteContext) {
	const { id } = await context.params;
	const user = await getCurrentUser();
	const store = await getMcqStore();
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		body = null;
	}
	return toResponse(await handleCreateAttempt(store, user, id, body));
}
