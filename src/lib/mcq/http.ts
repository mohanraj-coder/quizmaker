import { MCQ_MESSAGES } from "@/lib/mcq/messages";
import type { McqStore } from "@/lib/mcq/store";
import { parseAttemptJson, parseMcqJson } from "@/lib/mcq/validation";
import {
	createMcq,
	deleteMcqForOwner,
	getMcqForOwner,
	listAttemptsForOwner,
	listMcqsForUser,
	previewMcqForOwner,
	recordAttempt,
	updateMcqForOwner,
} from "@/lib/services/mcq";

export type ApiUser = { id: string };

export type HttpResult =
	| { status: 204; body?: undefined }
	| { status: number; body: Record<string, unknown> };

function unauthorized(): HttpResult {
	return { status: 401, body: { error: MCQ_MESSAGES.signInRequired } };
}

function notFound(): HttpResult {
	return { status: 404, body: { error: MCQ_MESSAGES.notFound } };
}

function validationFailure(errors: Record<string, string | undefined>): HttpResult {
	const first = Object.values(errors).find((value) => Boolean(value));
	return {
		status: 400,
		body: {
			error: first ?? MCQ_MESSAGES.systemError,
			errors,
		},
	};
}

export async function handleListMcqs(
	store: McqStore,
	user: ApiUser | null,
): Promise<HttpResult> {
	if (!user) {
		return unauthorized();
	}
	return {
		status: 200,
		body: { mcqs: await listMcqsForUser(store, user.id) },
	};
}

export async function handleCreateMcq(
	store: McqStore,
	user: ApiUser | null,
	body: unknown,
): Promise<HttpResult> {
	if (!user) {
		return unauthorized();
	}
	const parsed = parseMcqJson(body);
	if (!parsed) {
		return { status: 400, body: { error: MCQ_MESSAGES.systemError } };
	}
	const result = await createMcq(store, user.id, parsed);
	if (!result.ok) {
		return validationFailure(result.errors);
	}
	return { status: 201, body: { mcq: result.mcq } };
}

export async function handleGetMcq(
	store: McqStore,
	user: ApiUser | null,
	id: string,
): Promise<HttpResult> {
	if (!user) {
		return unauthorized();
	}
	const result = await getMcqForOwner(store, user.id, id);
	if (!result.ok) {
		return notFound();
	}
	return { status: 200, body: { mcq: result.mcq } };
}

export async function handleUpdateMcq(
	store: McqStore,
	user: ApiUser | null,
	id: string,
	body: unknown,
): Promise<HttpResult> {
	if (!user) {
		return unauthorized();
	}
	const parsed = parseMcqJson(body);
	if (!parsed) {
		return { status: 400, body: { error: MCQ_MESSAGES.systemError } };
	}
	const result = await updateMcqForOwner(store, user.id, id, parsed);
	if (!result.ok) {
		if (result.error) {
			return notFound();
		}
		return validationFailure(result.errors ?? {});
	}
	return { status: 200, body: { mcq: result.mcq } };
}

export async function handleDeleteMcq(
	store: McqStore,
	user: ApiUser | null,
	id: string,
): Promise<HttpResult> {
	if (!user) {
		return unauthorized();
	}
	const result = await deleteMcqForOwner(store, user.id, id);
	if (!result.ok) {
		return notFound();
	}
	return { status: 204 };
}

export async function handlePreviewMcq(
	store: McqStore,
	user: ApiUser | null,
	id: string,
): Promise<HttpResult> {
	if (!user) {
		return unauthorized();
	}
	const result = await previewMcqForOwner(store, user.id, id);
	if (!result.ok) {
		return notFound();
	}
	return { status: 200, body: { mcq: result.mcq } };
}

export async function handleListAttempts(
	store: McqStore,
	user: ApiUser | null,
	id: string,
): Promise<HttpResult> {
	if (!user) {
		return unauthorized();
	}
	const result = await listAttemptsForOwner(store, user.id, id);
	if (!result.ok) {
		return notFound();
	}
	return { status: 200, body: { attempts: result.attempts } };
}

export async function handleCreateAttempt(
	store: McqStore,
	user: ApiUser | null,
	id: string,
	body: unknown,
): Promise<HttpResult> {
	if (!user) {
		return unauthorized();
	}
	const parsed = parseAttemptJson(body);
	const result = await recordAttempt(
		store,
		user.id,
		id,
		parsed?.choiceId,
	);
	if (!result.ok) {
		if (result.error === MCQ_MESSAGES.notFound) {
			return notFound();
		}
		return { status: 400, body: { error: result.error } };
	}
	return { status: 201, body: { attempt: result.attempt } };
}
