import { beforeEach, describe, expect, it } from "vitest";

import {
	handleCreateAttempt,
	handleCreateMcq,
	handleDeleteMcq,
	handleGetMcq,
	handleListAttempts,
	handleListMcqs,
	handlePreviewMcq,
	handleUpdateMcq,
} from "@/lib/mcq/http";
import { InMemoryMcqStore } from "@/lib/mcq/in-memory-store";
import { MCQ_MESSAGES } from "@/lib/mcq/messages";
import { createMcq } from "@/lib/services/mcq";

const OWNER = { id: "user-owner" };
const OTHER = { id: "user-other" };

const validBody = {
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

describe("MCQ HTTP handlers", () => {
	it("returns 401 without a session", async () => {
		const result = await handleListMcqs(store, null);
		expect(result.status).toBe(401);
		expect(result.body).toEqual({ error: MCQ_MESSAGES.signInRequired });
		const create = await handleCreateMcq(store, null, validBody);
		expect(create.status).toBe(401);
	});

	it("creates with 201 and lists with 200", async () => {
		const created = await handleCreateMcq(store, OWNER, validBody);
		expect(created.status).toBe(201);
		expect(created.body && "mcq" in created.body).toBe(true);

		const list = await handleListMcqs(store, OWNER);
		expect(list.status).toBe(200);
		if (list.status !== 204) {
			expect((list.body.mcqs as unknown[]).length).toBe(1);
		}
	});

	it("returns 400 for invalid create payloads", async () => {
		const result = await handleCreateMcq(store, OWNER, {
			...validBody,
			name: "",
		});
		expect(result.status).toBe(400);
		if (result.status !== 204) {
			expect(result.body.errors).toEqual({ name: MCQ_MESSAGES.nameRequired });
		}
	});

	it("returns 404 for an unowned id", async () => {
		const created = await createMcq(store, OWNER.id, validBody);
		expect(created.ok).toBe(true);
		if (!created.ok) {
			return;
		}
		const result = await handleGetMcq(store, OTHER, created.mcq.id);
		expect(result.status).toBe(404);
		expect(result.body).toEqual({ error: MCQ_MESSAGES.notFound });
	});

	it("updates with 200 and deletes with 204", async () => {
		const created = await createMcq(store, OWNER.id, validBody);
		expect(created.ok).toBe(true);
		if (!created.ok) {
			return;
		}
		const updated = await handleUpdateMcq(store, OWNER, created.mcq.id, {
			...validBody,
			name: "Renamed",
		});
		expect(updated.status).toBe(200);
		const deleted = await handleDeleteMcq(store, OWNER, created.mcq.id);
		expect(deleted.status).toBe(204);
	});

	it("preview JSON has no isCorrect", async () => {
		const created = await createMcq(store, OWNER.id, validBody);
		expect(created.ok).toBe(true);
		if (!created.ok) {
			return;
		}
		const result = await handlePreviewMcq(store, OWNER, created.mcq.id);
		expect(result.status).toBe(200);
		expect(JSON.stringify(result.body)).not.toContain("isCorrect");
	});

	it("records an attempt with 201 and lists attempts with 200", async () => {
		const created = await createMcq(store, OWNER.id, validBody);
		expect(created.ok).toBe(true);
		if (!created.ok) {
			return;
		}
		const posted = await handleCreateAttempt(store, OWNER, created.mcq.id, {
			choiceId: created.mcq.choices[0]!.id,
		});
		expect(posted.status).toBe(201);
		const listed = await handleListAttempts(store, OWNER, created.mcq.id);
		expect(listed.status).toBe(200);
		if (listed.status !== 204) {
			expect((listed.body.attempts as unknown[]).length).toBe(1);
		}
	});

	it("returns 400 for an invalid attempt choice", async () => {
		const created = await createMcq(store, OWNER.id, validBody);
		expect(created.ok).toBe(true);
		if (!created.ok) {
			return;
		}
		const result = await handleCreateAttempt(store, OWNER, created.mcq.id, {
			choiceId: "missing",
		});
		expect(result.status).toBe(400);
		expect(result.body).toEqual({ error: MCQ_MESSAGES.choiceNotFound });
	});
});
