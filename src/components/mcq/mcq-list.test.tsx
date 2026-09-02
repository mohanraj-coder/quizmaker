import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { McqList } from "@/components/mcq/mcq-list";

vi.mock("@/app/actions/mcq", () => ({
	deleteMcqAction: vi.fn(async () => undefined),
}));

describe("McqList", () => {
	it("shows a New Multiple Choice Question control", () => {
		render(<McqList questions={[]} />);
		const link = screen.getByRole("link", { name: "New Multiple Choice Question" });
		expect(link.getAttribute("href")).toBe("/mcq-dashboard/new");
	});

	it("shows an empty state when there are no questions", () => {
		render(<McqList questions={[]} />);
		expect(
			screen.getByText("You have no multiple-choice questions yet."),
		).toBeTruthy();
	});

	it("renders Name, Description, and Actions columns", () => {
		render(
			<McqList
				questions={[
					{
						id: "q1",
						name: "Capitals",
						description: "What is the capital of France?",
						createdAt: "2026-09-02",
						updatedAt: "2026-09-02",
					},
				]}
			/>,
		);
		expect(screen.getByRole("columnheader", { name: "Name" })).toBeTruthy();
		expect(
			screen.getByRole("columnheader", { name: "Description" }),
		).toBeTruthy();
		expect(screen.getByRole("columnheader", { name: "Actions" })).toBeTruthy();
		expect(screen.getByText("Capitals")).toBeTruthy();
	});

	it("renders user-supplied name and description as text", () => {
		render(
			<McqList
				questions={[
					{
						id: "q1",
						name: "<img src=x alt=xss>",
						description: "<script>alert(1)</script>",
						createdAt: "2026-09-02",
						updatedAt: "2026-09-02",
					},
				]}
			/>,
		);

		expect(screen.getByText("<img src=x alt=xss>")).toBeTruthy();
		expect(screen.getByText("<script>alert(1)</script>")).toBeTruthy();
		expect(screen.queryByRole("img")).toBeNull();
	});
});

describe("McqList row actions", () => {
	it("opens a menu with Edit, Preview, and Delete", async () => {
		const user = userEvent.setup();
		render(
			<McqList
				questions={[
					{
						id: "q1",
						name: "Capitals",
						description: "What is the capital of France?",
						createdAt: "2026-09-02",
						updatedAt: "2026-09-02",
					},
				]}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Question actions" }));
		expect(await screen.findByRole("menuitem", { name: "Edit" })).toBeTruthy();
		expect(screen.getByRole("menuitem", { name: "Preview" })).toBeTruthy();
		expect(screen.getByRole("menuitem", { name: "Delete" })).toBeTruthy();
	});
});
