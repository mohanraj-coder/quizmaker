import type { ReactNode } from "react";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

type AuthShellProps = {
	title: string;
	description: string;
	footer: ReactNode;
	children: ReactNode;
};

export function AuthShell({ title, description, footer, children }: AuthShellProps) {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-10 sm:py-16">
			<div className="mb-8 text-center">
				<p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
					Quiz Maker
				</p>
			</div>
			<Card className="w-full max-w-md shadow-sm">
				<CardHeader className="gap-2">
					<CardTitle className="text-2xl font-semibold tracking-tight">
						<h1>{title}</h1>
					</CardTitle>
					<CardDescription className="text-sm leading-6">
						{description}
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-6">{children}</CardContent>
				<CardFooter className="justify-center text-center text-sm text-muted-foreground">
					{footer}
				</CardFooter>
			</Card>
		</main>
	);
}
