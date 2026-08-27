"use client";

import { useActionState, useEffect, useState } from "react";

import { signInAction, type SignInActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type SignInErrors, validateSignIn } from "@/lib/auth/validation";

const INITIAL_STATE: SignInActionState = { errors: {} };

export function SignInForm() {
	const [serverState, formAction, pending] = useActionState(
		signInAction,
		INITIAL_STATE,
	);
	const [clientErrors, setClientErrors] = useState<SignInErrors>({});
	const errors = { ...serverState.errors, ...clientErrors };
	const emailError = errors.email;
	const passwordError = errors.password;

	useEffect(() => {
		if (emailError) {
			document.getElementById("email")?.focus();
			return;
		}
		if (passwordError) {
			document.getElementById("password")?.focus();
		}
	}, [emailError, passwordError]);

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		const formData = new FormData(event.currentTarget);
		const result = validateSignIn({
			email: String(formData.get("email") ?? ""),
			password: String(formData.get("password") ?? ""),
		});

		if (!result.ok) {
			event.preventDefault();
			setClientErrors(result.errors);
			return;
		}

		setClientErrors({});
	}

	return (
		<form
			action={formAction}
			onSubmit={handleSubmit}
			noValidate
			className="flex flex-col gap-6"
		>
			{errors.form ? (
				<div
					role="alert"
					className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
				>
					{errors.form}
				</div>
			) : null}

			<FieldGroup className="gap-5">
				<Field data-invalid={!!errors.email || undefined}>
					<FieldLabel htmlFor="email">Email</FieldLabel>
					<Input
						id="email"
						name="email"
						type="email"
						autoComplete="email"
						className="h-11"
						aria-invalid={!!errors.email}
						aria-describedby={errors.email ? "email-error" : undefined}
					/>
					<FieldError id="email-error" errors={[{ message: errors.email }]} />
				</Field>

				<Field data-invalid={!!errors.password || undefined}>
					<FieldLabel htmlFor="password">Password</FieldLabel>
					<Input
						id="password"
						name="password"
						type="password"
						autoComplete="current-password"
						className="h-11"
						aria-invalid={!!errors.password}
						aria-describedby={errors.password ? "password-error" : undefined}
					/>
					<FieldError
						id="password-error"
						errors={[{ message: errors.password }]}
					/>
				</Field>
			</FieldGroup>

			<Button
				type="submit"
				className="h-11 min-h-11 w-full"
				disabled={pending}
				aria-busy={pending}
			>
				{pending ? "Signing in…" : "Sign in"}
			</Button>
		</form>
	);
}
