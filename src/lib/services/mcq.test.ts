import { beforeEach, describe, expect, it } from "vitest";

import { InMemoryMcqStore } from "@/lib/mcq/in-memory-store";
import { MCQ_MESSAGES } from "@/lib/mcq/messages";
import type { McqFields } from "@/lib/mcq/validation";
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

describe("previewMcqForOwner", () => {
	it("omits isCorrect from choices", async () => {
		const created = await createMcq(store, OWNER, validInput);
		expect(created.ok).toBe(true);
		if (!created.ok) {
			return;
		}
		const result = await previewMcqForOwner(store, OWNER, created.mcq.id);
		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}
		expect(result.mcq.choices[0]).toEqual({
			id: created.mcq.choices[0]?.id,
			text: "Paris",
		});
		expect(JSON.stringify(result.mcq)).not.toContain("isCorrect");
	});

	it("treats another user's question as not found", async () => {
		const created = await createMcq(store, OWNER, validInput);
		expect(created.ok).toBe(true);
		if (!created.ok) {
			return;
		}
		const result = await previewMcqForOwner(store, OTHER, created.mcq.id);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toBe(MCQ_MESSAGES.notFound);
		}
	});
});

describe("recordAttempt", () => {
	it("stores the user, choice, and correctness snapshot", async () => {
		const created = await createMcq(store, OWNER, validInput);
		expect(created.ok).toBe(true);
		if (!created.ok) {
			return;
		}
		const wrong = created.mcq.choices.find((choice) => !choice.isCorrect);
		const result = await recordAttempt(
			store,
			OWNER,
			created.mcq.id,
			wrong!.id,
		);
		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}
		expect(result.attempt.userId).toBe(OWNER);
		expect(result.attempt.choiceId).toBe(wrong!.id);
		expect(result.attempt.isCorrect).toBe(false);
	});

	it("rejects a choice that does not belong to the question", async () => {
		const created = await createMcq(store, OWNER, validInput);
		expect(created.ok).toBe(true);
		if (!created.ok) {
			return;
		}
		const result = await recordAttempt(
			store,
			OWNER,
			created.mcq.id,
			"foreign-choice",
		);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toBe(MCQ_MESSAGES.choiceNotFound);
		}
		expect(store.attempts).toHaveLength(0);
	});

	it("rejects an empty choice id", async () => {
		const created = await createMcq(store, OWNER, validInput);
		expect(created.ok).toBe(true);
		if (!created.ok) {
			return;
		}
		const result = await recordAttempt(store, OWNER, created.mcq.id, "  ");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toBe(MCQ_MESSAGES.choiceRequiredOnAttempt);
		}
	});
});

describe("listAttemptsForOwner", () => {
	it("lists attempts only for the owner", async () => {
		const created = await createMcq(store, OWNER, validInput);
		expect(created.ok).toBe(true);
		if (!created.ok) {
			return;
		}
		await recordAttempt(
			store,
			OWNER,
			created.mcq.id,
			created.mcq.choices[0]!.id,
		);
		const ownerList = await listAttemptsForOwner(store, OWNER, created.mcq.id);
		expect(ownerList.ok).toBe(true);
		if (ownerList.ok) {
			expect(ownerList.attempts).toHaveLength(1);
		}
		const otherList = await listAttemptsForOwner(store, OTHER, created.mcq.id);
		expect(otherList.ok).toBe(false);
		if (!otherList.ok) {
			expect(otherList.error).toBe(MCQ_MESSAGES.notFound);
		}
	});
});
