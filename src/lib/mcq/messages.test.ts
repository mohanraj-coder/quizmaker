import { describe, expect, it } from "vitest";

import { MCQ_MESSAGES } from "@/lib/mcq/messages";

describe("MCQ_MESSAGES", () => {
	it("uses the PRD copy for validation and system errors", () => {
		expect(MCQ_MESSAGES.nameRequired).toBe("Name is required.");
		expect(MCQ_MESSAGES.nameTooLong).toBe("Name must be 200 characters or fewer.");
		expect(MCQ_MESSAGES.descriptionRequired).toBe(
			"Question / description is required.",
		);
		expect(MCQ_MESSAGES.descriptionTooLong).toBe(
			"Question / description must be 2000 characters or fewer.",
		);
		expect(MCQ_MESSAGES.tooFewChoices).toBe("Add at least two choices.");
		expect(MCQ_MESSAGES.tooManyChoices).toBe(
			"A question can have at most six choices.",
		);
		expect(MCQ_MESSAGES.choiceRequired).toBe("Choice text is required.");
		expect(MCQ_MESSAGES.choiceTooLong).toBe(
			"Choice text must be 500 characters or fewer.",
		);
		expect(MCQ_MESSAGES.exactlyOneCorrect).toBe(
			"Mark exactly one choice as the correct answer.",
		);
		expect(MCQ_MESSAGES.notFound).toBe("Multiple choice question not found.");
		expect(MCQ_MESSAGES.choiceNotFound).toBe(
			"That choice is not available for this question.",
		);
		expect(MCQ_MESSAGES.choiceRequiredOnAttempt).toBe(
			"Select a choice before submitting your answer.",
		);
		expect(MCQ_MESSAGES.signInRequired).toBe("Sign in required.");
		expect(MCQ_MESSAGES.systemError).toBe(
			"Something went wrong. Please try again.",
		);
	});

	it("uses the PRD copy for delete confirmation and preview feedback", () => {
		expect(MCQ_MESSAGES.deleteConfirmTitle).toBe(
			"Delete this multiple choice question?",
		);
		expect(MCQ_MESSAGES.deleteConfirmDescription).toBe(
			"This will permanently remove the question, its choices, and recorded attempts.",
		);
		expect(MCQ_MESSAGES.correctFeedback).toBe("Correct.");
		expect(MCQ_MESSAGES.incorrectFeedback).toBe("Incorrect.");
	});
});
