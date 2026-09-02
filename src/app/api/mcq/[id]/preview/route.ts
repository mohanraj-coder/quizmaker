import { NextResponse } from "next/server";

import { getCurrentUser } from "@/app/actions/auth";
import { handlePreviewMcq } from "@/lib/mcq/http";
import { getMcqStore } from "@/lib/db";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
	const { id } = await context.params;
	const user = await getCurrentUser();
	const store = await getMcqStore();
	const result = await handlePreviewMcq(store, user, id);
	return NextResponse.json(result.body, { status: result.status });
}
