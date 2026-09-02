import type {
	McqAttemptRecord,
	McqListItem,
	McqRecord,
	McqStore,
	NewMcqRecord,
} from "@/lib/mcq/store";

export class InMemoryMcqStore implements McqStore {
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
