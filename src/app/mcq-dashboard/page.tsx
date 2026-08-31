import { redirect } from "next/navigation";

import { getCurrentUser } from "@/app/actions/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { SIGN_IN_PATH } from "@/lib/auth/paths";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "MCQ Dashboard · Quiz Maker",
};

export default async function McqDashboardPage() {
	const user = await getCurrentUser();
	if (!user) {
		redirect(SIGN_IN_PATH);
	}

	return (
		<div className="flex min-h-screen flex-col bg-muted/40">
			<header className="border-b border-border bg-card">
				<div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
					<p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
						Quiz Maker
					</p>
					<div className="flex min-w-0 items-center gap-3">
						<p className="hidden truncate text-sm text-muted-foreground sm:block">
							{user.email}
						</p>
						<SignOutButton />
					</div>
				</div>
			</header>
			<main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
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
				<Card className="max-w-lg shadow-sm">
					<CardHeader className="gap-2">
						<CardTitle className="text-base font-semibold tracking-tight">
							Your multiple-choice quizzes
						</CardTitle>
						<CardDescription className="text-sm leading-6">
							You have no MCQs yet. Creating, managing, and attempting quizzes
							will live here in a later sprint.
						</CardDescription>
					</CardHeader>
				</Card>
			</main>
		</div>
	);
}
