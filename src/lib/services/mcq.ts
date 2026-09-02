import { MCQ_MESSAGES } from "@/lib/mcq/messages";
import type {
	McqAttemptRecord,
	McqListItem,
	McqRecord,
	McqStore,
} from "@/lib/mcq/store";
import {
	type McqErrors,
	type McqFields,
	validateAttemptInput,
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

export type McqPreview = {
	id: string;
	name: string;
	description: string;
	choices: Array<{ id: string; text: string }>;
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

export async function previewMcqForOwner(
	store: McqStore,
	userId: string,
	id: string,
): Promise<{ ok: true; mcq: McqPreview } | McqNotFoundResult> {
	const owned = await requireOwnedMcq(store, userId, id);
	if (!owned.ok) {
		return owned;
	}

	return {
		ok: true,
		mcq: {
			id: owned.mcq.id,
			name: owned.mcq.name,
			description: owned.mcq.description,
			choices: owned.mcq.choices.map((choice) => ({
				id: choice.id,
				text: choice.text,
			})),
		},
	};
}

export async function recordAttempt(
	store: McqStore,
	userId: string,
	mcqId: string,
	choiceId: string | null | undefined,
): Promise<
	{ ok: true; attempt: McqAttemptRecord } | McqNotFoundResult | { ok: false; error: string }
> {
	const owned = await requireOwnedMcq(store, userId, mcqId);
	if (!owned.ok) {
		return owned;
	}

	const validation = validateAttemptInput({ choiceId });
	if (!validation.ok) {
		return validation;
	}

	const choice = owned.mcq.choices.find(
		(item) => item.id === validation.choiceId,
	);
	if (!choice) {
		return { ok: false, error: MCQ_MESSAGES.choiceNotFound };
	}

	const attempt = await store.insertAttempt({
		id: crypto.randomUUID(),
		mcqId,
		userId,
		choiceId: choice.id,
		isCorrect: choice.isCorrect,
	});

	return { ok: true, attempt };
}

export async function listAttemptsForOwner(
	store: McqStore,
	userId: string,
	mcqId: string,
): Promise<{ ok: true; attempts: McqAttemptRecord[] } | McqNotFoundResult> {
	const owned = await requireOwnedMcq(store, userId, mcqId);
	if (!owned.ok) {
		return owned;
	}

	return {
		ok: true,
		attempts: await store.listAttemptsByMcqId(mcqId),
	};
}
