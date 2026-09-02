import { createMcqAction } from "@/app/actions/mcq";
import { McqAppShell } from "@/components/mcq/mcq-app-shell";
import { McqForm } from "@/components/mcq/mcq-form";
import { requireMcqUser } from "@/lib/mcq/require-user";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "New multiple choice question · Quiz Maker",
};

export default async function NewMcqPage() {
	const user = await requireMcqUser();

	return (
		<McqAppShell email={user.email}>
			<McqForm title="New multiple choice question" action={createMcqAction} />
		</McqAppShell>
	);
}
