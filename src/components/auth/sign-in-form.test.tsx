import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SignInForm } from "@/components/auth/sign-in-form";
import { AUTH_MESSAGES } from "@/lib/auth/messages";

vi.mock("@/app/actions/auth", () => ({
	signInAction: vi.fn(async () => ({ errors: {} })),
}));

describe("SignInForm", () => {
	it("shows field errors for a missing email and password", async () => {
		const user = userEvent.setup();
		render(<SignInForm />);

		await user.click(screen.getByRole("button", { name: /sign in/i }));

		expect(screen.getByText(AUTH_MESSAGES.signInEmailRequired)).toBeTruthy();
		expect(screen.getByText(AUTH_MESSAGES.signInPasswordRequired)).toBeTruthy();
	});
});
