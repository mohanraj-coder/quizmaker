import { MCQ_MESSAGES } from "@/lib/mcq/messages";
import type { McqListItem, McqRecord, McqStore } from "@/lib/mcq/store";
import {
	type McqErrors,
	type McqFields,
	validateMcqInput,
} from "@/lib/mcq/validation";

export type McqNotFoundResult = {
	ok: false;
	error: typeof MCQ_MESSAGES.notFound;
	errors?: undefined;
};

export type McqValidationResult = {
	ok: false;
	errors: McqErrors;
	error?: undefined;
};

async function requireOwnedMcq(
	store: McqStore,
	userId: string,
	id: string,
): Promise<{ ok: true; mcq: McqRecord } | McqNotFoundResult> {
	const mcq = await store.findMcqById(id);
	if (!mcq || mcq.userId !== userId) {
		return { ok: false, error: MCQ_MESSAGES.notFound };
	}
	return { ok: true, mcq };
}

function choicesFromInput(
	choices: Array<{ text: string; isCorrect: boolean }>,
) {
	return choices.map((choice, position) => ({
		id: crypto.randomUUID(),
		text: choice.text,
		isCorrect: choice.isCorrect,
		position,
	}));
}

export async function createMcq(
	store: McqStore,
	userId: string,
	input: McqFields,
): Promise<{ ok: true; mcq: McqRecord } | McqValidationResult> {
	const validation = validateMcqInput(input);
	if (!validation.ok) {
		return validation;
	}

	const mcq = await store.insertMcq({
		id: crypto.randomUUID(),
		userId,
		name: validation.data.name,
		description: validation.data.description,
		choices: choicesFromInput(validation.data.choices),
	});

	return { ok: true, mcq };
}

export async function listMcqsForUser(
	store: McqStore,
	userId: string,
): Promise<McqListItem[]> {
	return store.listMcqsByUserId(userId);
}

export async function getMcqForOwner(
	store: McqStore,
	userId: string,
	id: string,
): Promise<{ ok: true; mcq: McqRecord } | McqNotFoundResult> {
	return requireOwnedMcq(store, userId, id);
}

export async function updateMcqForOwner(
	store: McqStore,
	userId: string,
	id: string,
	input: McqFields,
): Promise<
	{ ok: true; mcq: McqRecord } | McqValidationResult | McqNotFoundResult
> {
	const owned = await requireOwnedMcq(store, userId, id);
	if (!owned.ok) {
		return owned;
	}

	const validation = validateMcqInput(input);
	if (!validation.ok) {
		return validation;
	}

	const replaced = await store.replaceMcq({
		id,
		userId,
		name: validation.data.name,
		description: validation.data.description,
		choices: choicesFromInput(validation.data.choices),
	});

	if (!replaced) {
		return { ok: false, error: MCQ_MESSAGES.notFound };
	}

	return { ok: true, mcq: replaced };
}

export async function deleteMcqForOwner(
	store: McqStore,
	userId: string,
	id: string,
): Promise<{ ok: true } | McqNotFoundResult> {
	const owned = await requireOwnedMcq(store, userId, id);
	if (!owned.ok) {
		return owned;
	}

	await store.deleteMcq(id);
	return { ok: true };
}
