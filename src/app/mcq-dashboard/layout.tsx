import type { ReactNode } from "react";

import { requireMcqUser } from "@/lib/mcq/require-user";

export const dynamic = "force-dynamic";

export default async function McqDashboardLayout({
	children,
}: {
	children: ReactNode;
}) {
	await requireMcqUser();
	return children;
}
