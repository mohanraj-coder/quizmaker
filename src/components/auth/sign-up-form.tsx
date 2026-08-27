"use client";

import { useActionState, useEffect, useState } from "react";

import { signUpAction, type SignUpActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AUTH_MESSAGES } from "@/lib/auth/messages";
import {
	type SignUpErrors,
	type SignUpFieldName,
	validateSignUp,
} from "@/lib/auth/validation";

const INITIAL_STATE: SignUpActionState = { errors: {} };

const FIELD_ORDER: SignUpFieldName[] = [
	"firstName",
	"lastName",
	"email",
	"password",
	"confirmPassword",
];

export function SignUpForm() {
	const [serverState, formAction, pending] = useActionState(
		signUpAction,
		INITIAL_STATE,
	);
	const [clientErrors, setClientErrors] = useState<SignUpErrors>({});
	const errors = { ...serverState.errors, ...clientErrors };
	const firstErrorField = FIELD_ORDER.find((field) => errors[field]);
	const firstErrorMessage = firstErrorField ? errors[firstErrorField] : undefined;

	useEffect(() => {
		if (firstErrorField) {
			document.getElementById(firstErrorField)?.focus();
		}
	}, [firstErrorField, firstErrorMessage]);

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		const formData = new FormData(event.currentTarget);
		const result = validateSignUp({
			firstName: String(formData.get("firstName") ?? ""),
			lastName: String(formData.get("lastName") ?? ""),
			email: String(formData.get("email") ?? ""),
			password: String(formData.get("password") ?? ""),
			confirmPassword: String(formData.get("confirmPassword") ?? ""),
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
				<div className="grid gap-5 sm:grid-cols-2">
					<Field data-invalid={!!errors.firstName || undefined}>
						<FieldLabel htmlFor="firstName">First name</FieldLabel>
						<Input
							id="firstName"
							name="firstName"
							autoComplete="given-name"
							maxLength={50}
							className="h-11"
							aria-invalid={!!errors.firstName}
							aria-describedby={errors.firstName ? "firstName-error" : undefined}
						/>
						<FieldError id="firstName-error" errors={[{ message: errors.firstName }]} />
					</Field>

					<Field data-invalid={!!errors.lastName || undefined}>
						<FieldLabel htmlFor="lastName">Last name</FieldLabel>
						<Input
							id="lastName"
							name="lastName"
							autoComplete="family-name"
							maxLength={50}
							className="h-11"
							aria-invalid={!!errors.lastName}
							aria-describedby={errors.lastName ? "lastName-error" : undefined}
						/>
						<FieldError id="lastName-error" errors={[{ message: errors.lastName }]} />
					</Field>
				</div>

				<Field data-invalid={!!errors.email || undefined}>
					<FieldLabel htmlFor="email">Email address</FieldLabel>
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
						autoComplete="new-password"
						className="h-11"
						aria-invalid={!!errors.password}
						aria-describedby={
							errors.password ? "password-error" : "password-hint"
						}
					/>
					<FieldDescription id="password-hint" className="text-muted-foreground">
						Use at least 8 characters, including one uppercase letter, one
						lowercase letter, one number, and one special character.
					</FieldDescription>
					<FieldError id="password-error" errors={[{ message: errors.password }]} />
				</Field>

				<Field data-invalid={!!errors.confirmPassword || undefined}>
					<FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
					<Input
						id="confirmPassword"
						name="confirmPassword"
						type="password"
						autoComplete="new-password"
						className="h-11"
						aria-invalid={!!errors.confirmPassword}
						aria-describedby={
							errors.confirmPassword ? "confirmPassword-error" : undefined
						}
					/>
					<FieldError
						id="confirmPassword-error"
						errors={[{ message: errors.confirmPassword }]}
					/>
				</Field>
			</FieldGroup>

			<Button
				type="submit"
				className="h-11 min-h-11 w-full"
				disabled={pending}
				aria-busy={pending}
			>
				{pending ? "Signing up…" : "Sign up"}
			</Button>
			<p className="sr-only">{AUTH_MESSAGES.passwordComplexity}</p>
		</form>
	);
}
