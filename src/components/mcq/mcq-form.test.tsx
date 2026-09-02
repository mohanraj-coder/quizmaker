import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { McqForm } from "@/components/mcq/mcq-form";
import { MCQ_MESSAGES } from "@/lib/mcq/messages";

describe("McqForm", () => {
	it("shows Save and Cancel", () => {
		render(<McqForm title="New multiple choice question" action={vi.fn()} />);
		expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
		expect(screen.getByRole("link", { name: "Cancel" }).getAttribute("href")).toBe(
			"/mcq-dashboard",
		);
	});

	it("blocks submit when the name is missing", async () => {
		const action = vi.fn(async () => ({ errors: {} }));
		const user = userEvent.setup();
		render(<McqForm title="New multiple choice question" action={action} />);

		await user.type(screen.getByLabelText("Choice 1"), "Paris");
		await user.type(screen.getByLabelText("Choice 2"), "Lyon");
		await user.click(screen.getByRole("button", { name: "Save" }));

		expect(await screen.findByText(MCQ_MESSAGES.nameRequired)).toBeTruthy();
		expect(action).not.toHaveBeenCalled();
	});

	it("associates field errors with inputs for assistive technology", async () => {
		const user = userEvent.setup();
		render(<McqForm title="New multiple choice question" action={vi.fn()} />);

		await user.click(screen.getByRole("button", { name: "Save" }));

		const name = await screen.findByLabelText("Question name");
		expect(name.getAttribute("aria-invalid")).toBe("true");
		expect(name.getAttribute("aria-describedby")).toBe("name-error");
		expect(document.getElementById("name-error")?.textContent).toBe(
			MCQ_MESSAGES.nameRequired,
		);
		expect(document.activeElement).toBe(name);
	});
});
