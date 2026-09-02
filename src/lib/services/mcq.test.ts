import { beforeEach, describe, expect, it } from "vitest";

import { MCQ_MESSAGES } from "@/lib/mcq/messages";
import type {
	McqAttemptRecord,
	McqListItem,
	McqRecord,
	McqStore,
	NewMcqRecord,
} from "@/lib/mcq/store";
import type { McqFields } from "@/lib/mcq/validation";
import {
	createMcq,
	deleteMcqForOwner,
	getMcqForOwner,
	listMcqsForUser,
	updateMcqForOwner,
} from "@/lib/services/mcq";

const OWNER = "user-owner";
const OTHER = "user-other";

const validInput: McqFields = {
	name: "Capitals",
	description: "What is the capital of France?",
	choices: [
		{ text: "Paris", isCorrect: true },
		{ text: "Lyon", isCorrect: false },
	],
};

class InMemoryMcqStore implements McqStore {
	questions: McqRecord[] = [];
	attempts: McqAttemptRecord[] = [];

	async insertMcq(mcq: NewMcqRecord): Promise<McqRecord> {
		const now = "2026-09-02T00:00:00.000Z";
		const record: McqRecord = {
			id: mcq.id,
			userId: mcq.userId,
			name: mcq.name,
			description: mcq.description,
			createdAt: now,
			updatedAt: now,
			choices: mcq.choices.map((choice) => ({
				...choice,
				mcqId: mcq.id,
			})),
		};
		this.questions.push(record);
		return structuredClone(record);
	}

	async replaceMcq(mcq: NewMcqRecord): Promise<McqRecord | null> {
		const index = this.questions.findIndex((row) => row.id === mcq.id);
		if (index < 0) {
			return null;
		}
		const existing = this.questions[index]!;
		const nextChoiceIds = new Set(mcq.choices.map((choice) => choice.id));
		for (const attempt of this.attempts) {
			if (
				attempt.mcqId === mcq.id &&
				attempt.choiceId &&
				!nextChoiceIds.has(attempt.choiceId)
			) {
				attempt.choiceId = null;
			}
		}
		const record: McqRecord = {
			id: mcq.id,
			userId: mcq.userId,
			name: mcq.name,
			description: mcq.description,
			createdAt: existing.createdAt,
			updatedAt: "2026-09-02T01:00:00.000Z",
			choices: mcq.choices.map((choice) => ({
				...choice,
				mcqId: mcq.id,
			})),
		};
		this.questions[index] = record;
		return structuredClone(record);
	}

	async findMcqById(id: string): Promise<McqRecord | null> {
		const record = this.questions.find((row) => row.id === id);
		return record ? structuredClone(record) : null;
	}

	async listMcqsByUserId(userId: string): Promise<McqListItem[]> {
		return this.questions
			.filter((row) => row.userId === userId)
			.map((row) => ({
				id: row.id,
				name: row.name,
				description: row.description,
				createdAt: row.createdAt,
				updatedAt: row.updatedAt,
			}));
	}

	async deleteMcq(id: string): Promise<boolean> {
		const before = this.questions.length;
		this.questions = this.questions.filter((row) => row.id !== id);
		this.attempts = this.attempts.filter((row) => row.mcqId !== id);
		return this.questions.length < before;
	}

	async insertAttempt(
		attempt: Omit<McqAttemptRecord, "createdAt">,
	): Promise<McqAttemptRecord> {
		const record: McqAttemptRecord = {
			...attempt,
			createdAt: "2026-09-02T00:30:00.000Z",
		};
		this.attempts.push(record);
		return structuredClone(record);
	}

	async listAttemptsByMcqId(mcqId: string): Promise<McqAttemptRecord[]> {
		return this.attempts
			.filter((row) => row.mcqId === mcqId)
			.map((row) => structuredClone(row));
	}
}

let store: InMemoryMcqStore;

beforeEach(() => {
	store = new InMemoryMcqStore();
});

describe("createMcq", () => {
	it("persists a valid question with two to six choices for the owner", async () => {
		const result = await createMcq(store, OWNER, validInput);
		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}
		expect(result.mcq.userId).toBe(OWNER);
		expect(result.mcq.name).toBe("Capitals");
		expect(result.mcq.description).toBe("What is the capital of France?");
		expect(result.mcq.choices).toHaveLength(2);
		expect(result.mcq.choices.filter((choice) => choice.isCorrect)).toHaveLength(
			1,
		);
		expect(store.questions).toHaveLength(1);
	});

	it("rejects invalid input without inserting a row", async () => {
		const result = await createMcq(store, OWNER, {
			...validInput,
			choices: [{ text: "Paris", isCorrect: true }],
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.choices).toBe(MCQ_MESSAGES.tooFewChoices);
		}
		expect(store.questions).toHaveLength(0);
	});
});

describe("listMcqsForUser", () => {
	it("returns only the current user's questions", async () => {
		await createMcq(store, OWNER, validInput);
		await createMcq(store, OTHER, {
			...validInput,
			name: "Other question",
		});
		const list = await listMcqsForUser(store, OWNER);
		expect(list).toHaveLength(1);
		expect(list[0]?.name).toBe("Capitals");
		expect(list[0]).not.toHaveProperty("choices");
	});
});

describe("getMcqForOwner", () => {
	it("returns the owner's question including which choice is correct", async () => {
		const created = await createMcq(store, OWNER, validInput);
		expect(created.ok).toBe(true);
		if (!created.ok) {
			return;
		}
		const result = await getMcqForOwner(store, OWNER, created.mcq.id);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.mcq.choices.some((choice) => choice.isCorrect)).toBe(true);
		}
	});

	it("treats another user's question id as not found", async () => {
		const created = await createMcq(store, OWNER, validInput);
		expect(created.ok).toBe(true);
		if (!created.ok) {
			return;
		}
		const result = await getMcqForOwner(store, OTHER, created.mcq.id);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toBe(MCQ_MESSAGES.notFound);
		}
	});

	it("treats an unknown id as not found", async () => {
		const result = await getMcqForOwner(store, OWNER, "missing-id");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toBe(MCQ_MESSAGES.notFound);
		}
	});
});

describe("updateMcqForOwner", () => {
	it("replaces name, description, and the full choice set for the owner", async () => {
		const created = await createMcq(store, OWNER, validInput);
		expect(created.ok).toBe(true);
		if (!created.ok) {
			return;
		}
		const result = await updateMcqForOwner(store, OWNER, created.mcq.id, {
			name: "Updated capitals",
			description: "Which city is the capital?",
			choices: [
				{ text: "Paris", isCorrect: true },
				{ text: "Marseille", isCorrect: false },
				{ text: "Nice", isCorrect: false },
			],
		});
		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}
		expect(result.mcq.name).toBe("Updated capitals");
		expect(result.mcq.choices).toHaveLength(3);
		expect(result.mcq.choices.map((choice) => choice.text)).toEqual([
			"Paris",
			"Marseille",
			"Nice",
		]);
		expect(result.mcq.updatedAt).not.toBe(created.mcq.createdAt);
	});

	it("does not update another user's question", async () => {
		const created = await createMcq(store, OWNER, validInput);
		expect(created.ok).toBe(true);
		if (!created.ok) {
			return;
		}
		const result = await updateMcqForOwner(store, OTHER, created.mcq.id, {
			...validInput,
			name: "Hijacked",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toBe(MCQ_MESSAGES.notFound);
		}
		const ownerView = await getMcqForOwner(store, OWNER, created.mcq.id);
		expect(ownerView.ok).toBe(true);
		if (ownerView.ok) {
			expect(ownerView.mcq.name).toBe("Capitals");
		}
	});

	it("rejects invalid updates without changing the stored question", async () => {
		const created = await createMcq(store, OWNER, validInput);
		expect(created.ok).toBe(true);
		if (!created.ok) {
			return;
		}
		const result = await updateMcqForOwner(store, OWNER, created.mcq.id, {
			...validInput,
			name: "",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors?.name).toBe(MCQ_MESSAGES.nameRequired);
		}
		const stored = await getMcqForOwner(store, OWNER, created.mcq.id);
		expect(stored.ok).toBe(true);
		if (stored.ok) {
			expect(stored.mcq.name).toBe("Capitals");
		}
	});

	it("keeps historical attempt correctness after choices are replaced", async () => {
		const created = await createMcq(store, OWNER, validInput);
		expect(created.ok).toBe(true);
		if (!created.ok) {
			return;
		}
		const correct = created.mcq.choices.find((choice) => choice.isCorrect);
		expect(correct).toBeDefined();
		await store.insertAttempt({
			id: "attempt-1",
			mcqId: created.mcq.id,
			userId: OWNER,
			choiceId: correct!.id,
			isCorrect: true,
		});

		const updated = await updateMcqForOwner(store, OWNER, created.mcq.id, {
			...validInput,
			choices: [
				{ text: "Paris", isCorrect: true },
				{ text: "Toulouse", isCorrect: false },
			],
		});
		expect(updated.ok).toBe(true);

		const attempts = await store.listAttemptsByMcqId(created.mcq.id);
		expect(attempts).toHaveLength(1);
		expect(attempts[0]?.isCorrect).toBe(true);
		expect(attempts[0]?.choiceId).toBeNull();
	});
});

describe("deleteMcqForOwner", () => {
	it("deletes the owner's question and cascaded attempts", async () => {
		const created = await createMcq(store, OWNER, validInput);
		expect(created.ok).toBe(true);
		if (!created.ok) {
			return;
		}
		await store.insertAttempt({
			id: "attempt-1",
			mcqId: created.mcq.id,
			userId: OWNER,
			choiceId: created.mcq.choices[0]!.id,
			isCorrect: true,
		});
		const result = await deleteMcqForOwner(store, OWNER, created.mcq.id);
		expect(result).toEqual({ ok: true });
		expect(store.questions).toHaveLength(0);
		expect(store.attempts).toHaveLength(0);
	});

	it("does not delete another user's question", async () => {
		const created = await createMcq(store, OWNER, validInput);
		expect(created.ok).toBe(true);
		if (!created.ok) {
			return;
		}
		const result = await deleteMcqForOwner(store, OTHER, created.mcq.id);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toBe(MCQ_MESSAGES.notFound);
		}
		expect(store.questions).toHaveLength(1);
	});
});
