import { redirect } from "next/navigation";

import { McqAppShell } from "@/components/mcq/mcq-app-shell";
import { McqPreviewForm } from "@/components/mcq/mcq-preview-form";
import { MCQ_DASHBOARD_PATH } from "@/lib/auth/paths";
import { getMcqStore } from "@/lib/db";
import { requireMcqUser } from "@/lib/mcq/require-user";
import { previewMcqForOwner } from "@/lib/services/mcq";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Preview multiple choice question · Quiz Maker",
};

type PageProps = {
	params: Promise<{ id: string }>;
};

export default async function PreviewMcqPage({ params }: PageProps) {
	const user = await requireMcqUser();

	const { id } = await params;
	const result = await previewMcqForOwner(await getMcqStore(), user.id, id);
	if (!result.ok) {
		redirect(MCQ_DASHBOARD_PATH);
	}

	return (
		<McqAppShell email={user.email}>
			<McqPreviewForm mcq={result.mcq} />
		</McqAppShell>
	);
}
