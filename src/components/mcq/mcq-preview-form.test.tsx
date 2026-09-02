import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { McqPreviewForm } from "@/components/mcq/mcq-preview-form";

vi.mock("@/app/actions/mcq", () => ({
	submitAttemptAction: vi.fn(async () => ({})),
}));

describe("McqPreviewForm", () => {
	it("lists choices without revealing the correct answer", () => {
		render(
			<McqPreviewForm
				mcq={{
					id: "q1",
					name: "Capitals",
					description: "What is the capital of France?",
					choices: [
						{ id: "c1", text: "Paris" },
						{ id: "c2", text: "Lyon" },
					],
				}}
			/>,
		);

		expect(screen.getByRole("heading", { name: "Capitals" })).toBeTruthy();
		expect(screen.getByText("What is the capital of France?")).toBeTruthy();
		expect(screen.getByText("Paris")).toBeTruthy();
		expect(screen.getByText("Lyon")).toBeTruthy();
		expect(screen.queryByText(/correct answer/i)).toBeNull();
		expect(screen.getByRole("button", { name: "Submit answer" })).toBeTruthy();
		expect(JSON.stringify(screen.getByRole("heading").textContent)).not.toContain(
			"isCorrect",
		);
	});

	it("renders user-supplied question copy as text", () => {
		render(
			<McqPreviewForm
				mcq={{
					id: "q1",
					name: "<b>Capitals</b>",
					description: "<img src=x alt=xss>",
					choices: [{ id: "c1", text: "<script>alert(1)</script>" }],
				}}
			/>,
		);

		expect(screen.getByRole("heading", { name: "<b>Capitals</b>" })).toBeTruthy();
		expect(screen.getByText("<img src=x alt=xss>")).toBeTruthy();
		expect(screen.getByText("<script>alert(1)</script>")).toBeTruthy();
		expect(screen.queryByRole("img")).toBeNull();
	});
});
