import { redirect } from "next/navigation";

import { getCurrentUser } from "@/app/actions/auth";
import { SIGN_IN_PATH } from "@/lib/auth/paths";

export async function requireMcqUser() {
	const user = await getCurrentUser();
	if (!user) {
		redirect(SIGN_IN_PATH);
	}
	return user;
}
