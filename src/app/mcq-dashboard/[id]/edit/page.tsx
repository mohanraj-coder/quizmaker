import { redirect } from "next/navigation";

import { getCurrentUser } from "@/app/actions/auth";
import { updateMcqAction } from "@/app/actions/mcq";
import { McqAppShell } from "@/components/mcq/mcq-app-shell";
import { McqForm } from "@/components/mcq/mcq-form";
import { MCQ_DASHBOARD_PATH, SIGN_IN_PATH } from "@/lib/auth/paths";
import { getMcqStore } from "@/lib/db";
import { getMcqForOwner } from "@/lib/services/mcq";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Edit multiple choice question · Quiz Maker",
};

type PageProps = {
	params: Promise<{ id: string }>;
};

export default async function EditMcqPage({ params }: PageProps) {
	const user = await getCurrentUser();
	if (!user) {
		redirect(SIGN_IN_PATH);
	}

	const { id } = await params;
	const result = await getMcqForOwner(await getMcqStore(), user.id, id);
	if (!result.ok) {
		redirect(MCQ_DASHBOARD_PATH);
	}

	return (
		<McqAppShell email={user.email}>
			<McqForm
				title="Edit multiple choice question"
				action={updateMcqAction.bind(null, id)}
				initial={{
					name: result.mcq.name,
					description: result.mcq.description,
					choices: result.mcq.choices.map((choice) => ({
						text: choice.text,
						isCorrect: choice.isCorrect,
					})),
				}}
			/>
		</McqAppShell>
	);
}
