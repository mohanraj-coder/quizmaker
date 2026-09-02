import { SignOutButton } from "@/components/auth/sign-out-button";
import type { ReactNode } from "react";

type McqAppShellProps = {
	email: string;
	children: ReactNode;
};

export function McqAppShell({ email, children }: McqAppShellProps) {
	return (
		<div className="flex min-h-screen flex-col bg-muted/40">
			<header className="border-b border-border bg-card">
				<div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
					<p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
						Quiz Maker
					</p>
					<div className="flex min-w-0 items-center gap-3">
						<p className="hidden truncate text-sm text-muted-foreground sm:block">
							{email}
						</p>
						<SignOutButton />
					</div>
				</div>
			</header>
			<main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
				{children}
			</main>
		</div>
	);
}
