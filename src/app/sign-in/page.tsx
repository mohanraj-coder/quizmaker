import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { AUTH_MESSAGES } from "@/lib/auth/messages";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Sign in · Quiz Maker",
};

export default async function SignInPage({
	searchParams,
}: {
	searchParams: Promise<{ registered?: string; signedOut?: string }>;
}) {
	const user = await getCurrentUser();
	if (user) {
		redirect("/dashboard");
	}

	const params = await searchParams;
	const successMessage = params.registered
		? AUTH_MESSAGES.accountCreated
		: params.signedOut
			? AUTH_MESSAGES.signedOut
			: null;

	return (
		<AuthShell
			title="Sign in"
			description="Sign in to Quiz Maker with your email and password."
			footer={
				<p>
					Need an account?{" "}
					<Link
						href="/sign-up"
						className="font-medium text-primary underline-offset-4 hover:underline"
					>
						Sign up
					</Link>
				</p>
			}
		>
			{successMessage ? (
				<p
					role="status"
					className="rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-foreground"
				>
					{successMessage}
				</p>
			) : null}
			<SignInForm />
		</AuthShell>
	);
}
