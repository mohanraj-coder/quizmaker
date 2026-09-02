import { redirect } from "next/navigation";

import { getCurrentUser } from "@/app/actions/auth";
import { createMcqAction } from "@/app/actions/mcq";
import { McqAppShell } from "@/components/mcq/mcq-app-shell";
import { McqForm } from "@/components/mcq/mcq-form";
import { SIGN_IN_PATH } from "@/lib/auth/paths";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "New multiple choice question · Quiz Maker",
};

export default async function NewMcqPage() {
	const user = await getCurrentUser();
	if (!user) {
		redirect(SIGN_IN_PATH);
	}

	return (
		<McqAppShell email={user.email}>
			<McqForm title="New multiple choice question" action={createMcqAction} />
		</McqAppShell>
	);
}
