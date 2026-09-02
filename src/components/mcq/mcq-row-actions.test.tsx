import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { McqRowActions } from "@/components/mcq/mcq-row-actions";
import { MCQ_MESSAGES } from "@/lib/mcq/messages";

vi.mock("@/app/actions/mcq", () => ({
	deleteMcqAction: vi.fn(async () => undefined),
}));

describe("McqRowActions", () => {
	it("shows the delete confirmation copy", async () => {
		const user = userEvent.setup();
		render(<McqRowActions id="q1" />);

		await user.click(screen.getByRole("button", { name: "Question actions" }));
		await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

		expect(
			await screen.findByText(MCQ_MESSAGES.deleteConfirmTitle),
		).toBeTruthy();
		expect(screen.getByText(MCQ_MESSAGES.deleteConfirmDescription)).toBeTruthy();
	});

	it("names the actions trigger for assistive technology", () => {
		render(<McqRowActions id="q1" />);
		expect(
			screen.getByRole("button", { name: "Question actions" }),
		).toBeTruthy();
	});
});
