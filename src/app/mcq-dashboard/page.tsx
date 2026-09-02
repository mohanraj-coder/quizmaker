import { McqAppShell } from "@/components/mcq/mcq-app-shell";
import { McqList } from "@/components/mcq/mcq-list";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getMcqStore } from "@/lib/db";
import { requireMcqUser } from "@/lib/mcq/require-user";
import { listMcqsForUser } from "@/lib/services/mcq";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "MCQ Dashboard · Quiz Maker",
};

export default async function McqDashboardPage() {
	const user = await requireMcqUser();

	const questions = await listMcqsForUser(await getMcqStore(), user.id);

	return (
		<McqAppShell email={user.email}>
			<Card className="max-w-lg shadow-sm">
				<CardHeader className="gap-2">
					<CardTitle className="text-2xl font-semibold tracking-tight">
						<h1>MCQ Dashboard</h1>
					</CardTitle>
					<CardDescription className="text-sm leading-6">
						Welcome, {user.firstName}. You are signed in as {user.email}.
					</CardDescription>
				</CardHeader>
			</Card>
			<McqList questions={questions} />
		</McqAppShell>
	);
}
