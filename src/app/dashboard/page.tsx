import { redirect } from "next/navigation";

import { MCQ_DASHBOARD_PATH } from "@/lib/auth/paths";

export const dynamic = "force-dynamic";

/** Legacy path: Sign In lands on the MCQ Dashboard. */
export default function DashboardAliasPage() {
	redirect(MCQ_DASHBOARD_PATH);
}
