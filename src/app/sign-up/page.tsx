import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Sign up · Quiz Maker",
};

export default async function SignUpPage() {
	const user = await getCurrentUser();
	if (user) {
		redirect("/dashboard");
	}

	return (
		<AuthShell
			title="Create an account"
			description="Register for Quiz Maker with your name, email, and password."
			footer={
				<p>
					Already have an account?{" "}
					<Link
						href="/sign-in"
						className="font-medium text-primary underline-offset-4 hover:underline"
					>
						Sign in
					</Link>
				</p>
			}
		>
			<SignUpForm />
		</AuthShell>
	);
}
