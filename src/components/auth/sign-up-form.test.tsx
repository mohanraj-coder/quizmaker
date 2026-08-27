import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { AUTH_MESSAGES } from "@/lib/auth/messages";

vi.mock("@/app/actions/auth", () => ({
	signUpAction: vi.fn(async () => ({ errors: {} })),
}));

describe("SignUpForm", () => {
	it("shows inline required errors and does not submit an empty form", async () => {
		const user = userEvent.setup();
		render(<SignUpForm />);

		await user.click(screen.getByRole("button", { name: /sign up/i }));

		expect(screen.getByText(AUTH_MESSAGES.firstNameRequired)).toBeTruthy();
		expect(screen.getByText(AUTH_MESSAGES.lastNameRequired)).toBeTruthy();
		expect(screen.getByText(AUTH_MESSAGES.emailRequired)).toBeTruthy();
		expect(screen.getByText(AUTH_MESSAGES.passwordRequired)).toBeTruthy();
		expect(screen.getByText(AUTH_MESSAGES.confirmPasswordRequired)).toBeTruthy();
	});

	it("shows an inline error when passwords do not match", async () => {
		const user = userEvent.setup();
		render(<SignUpForm />);

		await user.type(screen.getByLabelText(/^first name$/i), "Ada");
		await user.type(screen.getByLabelText(/^last name$/i), "Lovelace");
		await user.type(screen.getByLabelText(/email address/i), "ada@example.com");
		await user.type(screen.getByLabelText(/^password$/i), "Password1!");
		await user.type(screen.getByLabelText(/confirm password/i), "Password1?");
		await user.click(screen.getByRole("button", { name: /sign up/i }));

		expect(screen.getByText(AUTH_MESSAGES.passwordsDoNotMatch)).toBeTruthy();
	});
});
