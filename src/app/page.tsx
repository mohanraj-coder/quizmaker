import { redirect } from "next/navigation";

import { getCurrentUser } from "@/app/actions/auth";
import { MCQ_DASHBOARD_PATH, SIGN_IN_PATH } from "@/lib/auth/paths";

export const dynamic = "force-dynamic";

export default async function HomePage() {
	const user = await getCurrentUser();
	redirect(user ? MCQ_DASHBOARD_PATH : SIGN_IN_PATH);
}
