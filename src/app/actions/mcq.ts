"use server";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/app/actions/auth";
import { MCQ_DASHBOARD_PATH, SIGN_IN_PATH } from "@/lib/auth/paths";
import { getMcqStore } from "@/lib/db";
import { MCQ_MESSAGES } from "@/lib/mcq/messages";
import { type McqErrors, parseMcqFormData } from "@/lib/mcq/validation";
import {
	createMcq,
	deleteMcqForOwner,
	recordAttempt,
	updateMcqForOwner,
} from "@/lib/services/mcq";

export type McqActionState = {
	errors: McqErrors;
};

export type AttemptActionState = {
	error?: string;
	isCorrect?: boolean;
};

async function requireUser() {
	const user = await getCurrentUser();
	if (!user) {
		redirect(SIGN_IN_PATH);
	}
	return user;
}

export async function createMcqAction(
	_previous: McqActionState,
	formData: FormData,
): Promise<McqActionState> {
	const user = await requireUser();
	try {
		const store = await getMcqStore();
		const result = await createMcq(store, user.id, parseMcqFormData(formData));
		if (!result.ok) {
			return { errors: result.errors };
		}
	} catch {
		return { errors: { form: MCQ_MESSAGES.systemError } };
	}
	redirect(MCQ_DASHBOARD_PATH);
}

export async function updateMcqAction(
	id: string,
	_previous: McqActionState,
	formData: FormData,
): Promise<McqActionState> {
	const user = await requireUser();
	try {
		const store = await getMcqStore();
		const result = await updateMcqForOwner(
			store,
			user.id,
			id,
			parseMcqFormData(formData),
		);
		if (!result.ok) {
			if (result.error) {
				redirect(MCQ_DASHBOARD_PATH);
			}
			return { errors: result.errors ?? {} };
		}
	} catch {
		return { errors: { form: MCQ_MESSAGES.systemError } };
	}
	redirect(MCQ_DASHBOARD_PATH);
}

export async function deleteMcqAction(id: string): Promise<void> {
	const user = await requireUser();
	const store = await getMcqStore();
	await deleteMcqForOwner(store, user.id, id);
	redirect(MCQ_DASHBOARD_PATH);
}

export async function submitAttemptAction(
	id: string,
	_previous: AttemptActionState,
	formData: FormData,
): Promise<AttemptActionState> {
	const user = await requireUser();
	try {
		const store = await getMcqStore();
		const result = await recordAttempt(
			store,
			user.id,
			id,
			String(formData.get("choiceId") ?? ""),
		);
		if (!result.ok) {
			if (result.error === MCQ_MESSAGES.notFound) {
				redirect(MCQ_DASHBOARD_PATH);
			}
			return { error: result.error };
		}
		return { isCorrect: result.attempt.isCorrect };
	} catch {
		return { error: MCQ_MESSAGES.systemError };
	}
}
