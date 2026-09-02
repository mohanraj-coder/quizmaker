import { describe, expect, it } from "vitest";

import { MCQ_MESSAGES } from "@/lib/mcq/messages";
import {
	parseAttemptJson,
	parseMcqFormData,
	parseMcqJson,
	validateAttemptInput,
	validateMcqInput,
} from "@/lib/mcq/validation";

const validMcq = {
	name: "Capitals",
	description: "What is the capital of France?",
	choices: [
		{ text: "Paris", isCorrect: true },
		{ text: "Lyon", isCorrect: false },
	],
};

describe("validateMcqInput", () => {
	it("accepts a complete valid question with two choices", () => {
		const result = validateMcqInput(validMcq);
		expect(result).toEqual({
			ok: true,
			data: {
				name: "Capitals",
				description: "What is the capital of France?",
				choices: [
					{ text: "Paris", isCorrect: true },
					{ text: "Lyon", isCorrect: false },
				],
			},
		});
	});

	it("trims name, description, and choice text on success", () => {
		const result = validateMcqInput({
			name: "  Capitals ",
			description: "  What is the capital of France? ",
			choices: [
				{ text: "  Paris ", isCorrect: true },
				{ text: " Lyon", isCorrect: false },
			],
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.data.name).toBe("Capitals");
			expect(result.data.description).toBe("What is the capital of France?");
			expect(result.data.choices[0]?.text).toBe("Paris");
			expect(result.data.choices[1]?.text).toBe("Lyon");
		}
	});

	it("accepts six choices when exactly one is correct", () => {
		const result = validateMcqInput({
			...validMcq,
			choices: [
				{ text: "A", isCorrect: false },
				{ text: "B", isCorrect: true },
				{ text: "C", isCorrect: false },
				{ text: "D", isCorrect: false },
				{ text: "E", isCorrect: false },
				{ text: "F", isCorrect: false },
			],
		});
		expect(result.ok).toBe(true);
	});

	it("rejects a missing name", () => {
		const result = validateMcqInput({ ...validMcq, name: "   " });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.name).toBe(MCQ_MESSAGES.nameRequired);
		}
	});

	it("rejects a name longer than 200 characters", () => {
		const result = validateMcqInput({ ...validMcq, name: "N".repeat(201) });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.name).toBe(MCQ_MESSAGES.nameTooLong);
		}
	});

	it("rejects a missing question / description", () => {
		const result = validateMcqInput({ ...validMcq, description: " " });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.description).toBe(MCQ_MESSAGES.descriptionRequired);
		}
	});

	it("rejects a question / description longer than 2000 characters", () => {
		const result = validateMcqInput({
			...validMcq,
			description: "Q".repeat(2001),
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.description).toBe(MCQ_MESSAGES.descriptionTooLong);
		}
	});

	it("rejects create when only one choice is provided", () => {
		const result = validateMcqInput({
			...validMcq,
			choices: [{ text: "Paris", isCorrect: true }],
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.choices).toBe(MCQ_MESSAGES.tooFewChoices);
		}
	});

	it("rejects more than six choices", () => {
		const result = validateMcqInput({
			...validMcq,
			choices: [
				{ text: "A", isCorrect: true },
				{ text: "B", isCorrect: false },
				{ text: "C", isCorrect: false },
				{ text: "D", isCorrect: false },
				{ text: "E", isCorrect: false },
				{ text: "F", isCorrect: false },
				{ text: "G", isCorrect: false },
			],
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.choices).toBe(MCQ_MESSAGES.tooManyChoices);
		}
	});

	it("rejects empty choice text", () => {
		const result = validateMcqInput({
			...validMcq,
			choices: [
				{ text: "Paris", isCorrect: true },
				{ text: "   ", isCorrect: false },
			],
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors["choice-1"]).toBe(MCQ_MESSAGES.choiceRequired);
		}
	});

	it("rejects choice text longer than 500 characters", () => {
		const result = validateMcqInput({
			...validMcq,
			choices: [
				{ text: "Paris", isCorrect: true },
				{ text: "L".repeat(501), isCorrect: false },
			],
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors["choice-1"]).toBe(MCQ_MESSAGES.choiceTooLong);
		}
	});

	it("rejects when no choice is marked correct", () => {
		const result = validateMcqInput({
			...validMcq,
			choices: [
				{ text: "Paris", isCorrect: false },
				{ text: "Lyon", isCorrect: false },
			],
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.choices).toBe(MCQ_MESSAGES.exactlyOneCorrect);
		}
	});

	it("rejects when more than one choice is marked correct", () => {
		const result = validateMcqInput({
			...validMcq,
			choices: [
				{ text: "Paris", isCorrect: true },
				{ text: "Lyon", isCorrect: true },
			],
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.choices).toBe(MCQ_MESSAGES.exactlyOneCorrect);
		}
	});
});

describe("validateAttemptInput", () => {
	it("accepts a non-empty choice id", () => {
		const result = validateAttemptInput({ choiceId: " choice-1 " });
		expect(result).toEqual({ ok: true, choiceId: "choice-1" });
	});

	it("rejects an attempt submitted with no choice", () => {
		const result = validateAttemptInput({ choiceId: "  " });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toBe(MCQ_MESSAGES.choiceRequiredOnAttempt);
		}
	});
});

describe("parseMcqJson", () => {
	it("returns fields when the JSON shape matches", () => {
		expect(parseMcqJson(validMcq)).toEqual(validMcq);
	});

	it("returns null when required fields are missing", () => {
		expect(parseMcqJson({ name: "Capitals" })).toBeNull();
	});
});

describe("parseAttemptJson", () => {
	it("returns choiceId when present", () => {
		expect(parseAttemptJson({ choiceId: "abc" })).toEqual({ choiceId: "abc" });
	});

	it("returns null when choiceId is missing", () => {
		expect(parseAttemptJson({})).toBeNull();
	});
});

describe("parseMcqFormData", () => {
	it("reads name, description, choices, and the selected correct index", () => {
		const formData = new FormData();
		formData.set("name", "Capitals");
		formData.set("description", "What is the capital of France?");
		formData.set("choiceText-0", "Paris");
		formData.set("choiceText-1", "Lyon");
		formData.set("correctChoice", "0");

		expect(parseMcqFormData(formData)).toEqual(validMcq);
	});
});
