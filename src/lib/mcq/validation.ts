import { z } from "zod";

import { MCQ_MESSAGES } from "@/lib/mcq/messages";

export const MIN_CHOICES = 2;
export const MAX_CHOICES = 6;
export const NAME_MAX = 200;
export const DESCRIPTION_MAX = 2000;
export const CHOICE_MAX = 500;

export type McqChoiceInput = {
	text: string;
	isCorrect: boolean;
};

export type McqFields = {
	name: string;
	description: string;
	choices: McqChoiceInput[];
};

export type McqFieldName = "name" | "description" | "choices" | "form";

export type McqErrors = Partial<Record<McqFieldName | `choice-${number}`, string>>;

export type McqSuccess = {
	name: string;
	description: string;
	choices: Array<{ text: string; isCorrect: boolean }>;
};

export const mcqJsonSchema = z.object({
	name: z.string(),
	description: z.string(),
	choices: z.array(
		z.object({
			text: z.string(),
			isCorrect: z.boolean(),
		}),
	),
});

export const attemptJsonSchema = z.object({
	choiceId: z.string(),
});

export function validateMcqInput(
	input: McqFields,
): { ok: true; data: McqSuccess } | { ok: false; errors: McqErrors } {
	const errors: McqErrors = {};
	const name = input.name.trim();
	const description = input.description.trim();

	if (!name) {
		errors.name = MCQ_MESSAGES.nameRequired;
	} else if (name.length > NAME_MAX) {
		errors.name = MCQ_MESSAGES.nameTooLong;
	}

	if (!description) {
		errors.description = MCQ_MESSAGES.descriptionRequired;
	} else if (description.length > DESCRIPTION_MAX) {
		errors.description = MCQ_MESSAGES.descriptionTooLong;
	}

	const choices = input.choices ?? [];
	if (choices.length > MAX_CHOICES) {
		errors.choices = MCQ_MESSAGES.tooManyChoices;
	}

	const normalized: Array<{ text: string; isCorrect: boolean }> = [];
	for (let index = 0; index < choices.length; index += 1) {
		const choice = choices[index];
		const text = (choice?.text ?? "").trim();
		if (!text) {
			errors[`choice-${index}`] = MCQ_MESSAGES.choiceRequired;
			continue;
		}
		if (text.length > CHOICE_MAX) {
			errors[`choice-${index}`] = MCQ_MESSAGES.choiceTooLong;
			continue;
		}
		normalized.push({ text, isCorrect: Boolean(choice?.isCorrect) });
	}

	if (normalized.length < MIN_CHOICES && !errors.choices) {
		errors.choices = MCQ_MESSAGES.tooFewChoices;
	}

	const correctCount = normalized.filter((choice) => choice.isCorrect).length;
	if (
		normalized.length >= MIN_CHOICES &&
		correctCount !== 1 &&
		!errors.choices
	) {
		errors.choices = MCQ_MESSAGES.exactlyOneCorrect;
	}

	if (Object.keys(errors).length > 0) {
		return { ok: false, errors };
	}

	return {
		ok: true,
		data: {
			name,
			description,
			choices: normalized,
		},
	};
}

export function parseMcqFormData(formData: FormData): McqFields {
	const choices: McqChoiceInput[] = [];
	const correctRaw = String(formData.get("correctChoice") ?? "");
	const correctIndex = correctRaw === "" ? -1 : Number(correctRaw);

	for (let index = 0; index < MAX_CHOICES; index += 1) {
		const value = formData.get(`choiceText-${index}`);
		if (value === null) {
			break;
		}
		choices.push({
			text: String(value),
			isCorrect: index === correctIndex,
		});
	}

	return {
		name: String(formData.get("name") ?? ""),
		description: String(formData.get("description") ?? ""),
		choices,
	};
}

export function parseMcqJson(body: unknown): McqFields | null {
	const parsed = mcqJsonSchema.safeParse(body);
	if (!parsed.success) {
		return null;
	}
	return parsed.data;
}

export type AttemptFields = {
	choiceId: string;
};

export function parseAttemptJson(body: unknown): AttemptFields | null {
	const parsed = attemptJsonSchema.safeParse(body);
	if (!parsed.success) {
		return null;
	}
	return parsed.data;
}

export function validateAttemptInput(
	input: { choiceId?: string | null },
): { ok: true; choiceId: string } | { ok: false; error: string } {
	const choiceId = (input.choiceId ?? "").trim();
	if (!choiceId) {
		return { ok: false, error: MCQ_MESSAGES.choiceRequiredOnAttempt };
	}
	return { ok: true, choiceId };
}
