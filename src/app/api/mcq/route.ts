import { NextResponse } from "next/server";

import { getCurrentUser } from "@/app/actions/auth";
import { handleCreateMcq, handleListMcqs } from "@/lib/mcq/http";
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

export async function GET() {
	const user = await getCurrentUser();
	const store = await getMcqStore();
	return toResponse(await handleListMcqs(store, user));
}

export async function POST(request: Request) {
	const user = await getCurrentUser();
	const store = await getMcqStore();
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		body = null;
	}
	return toResponse(await handleCreateMcq(store, user, body));
}
