import type {
	McqAttemptRecord,
	McqChoiceRecord,
	McqListItem,
	McqRecord,
	McqStore,
	NewMcqRecord,
} from "@/lib/mcq/store";

type QuestionRow = {
	id: string;
	name: string;
	description: string;
	user_id: string;
	created_at: string;
	updated_at: string;
};

type ChoiceRow = {
	id: string;
	mcq_id: string;
	choice_text: string;
	is_correct: number;
	position: number;
};

type AttemptRow = {
	id: string;
	mcq_id: string;
	user_id: string;
	choice_id: string | null;
	is_correct: number;
	created_at: string;
};

function mapChoice(row: ChoiceRow): McqChoiceRecord {
	return {
		id: row.id,
		mcqId: row.mcq_id,
		text: row.choice_text,
		isCorrect: row.is_correct === 1,
		position: row.position,
	};
}

function mapQuestion(row: QuestionRow, choices: McqChoiceRecord[]): McqRecord {
	return {
		id: row.id,
		userId: row.user_id,
		name: row.name,
		description: row.description,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
		choices: [...choices].sort((left, right) => left.position - right.position),
	};
}

function mapAttempt(row: AttemptRow): McqAttemptRecord {
	return {
		id: row.id,
		mcqId: row.mcq_id,
		userId: row.user_id,
		choiceId: row.choice_id,
		isCorrect: row.is_correct === 1,
		createdAt: row.created_at,
	};
}

export class D1McqStore implements McqStore {
	constructor(private readonly db: D1Database) {}

	async insertMcq(mcq: NewMcqRecord): Promise<McqRecord> {
		const statements = [
			this.db
				.prepare(
					"INSERT INTO mcq_questions (id, name, description, user_id, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, datetime('now'), datetime('now'))",
				)
				.bind(mcq.id, mcq.name, mcq.description, mcq.userId),
			...mcq.choices.map((choice) =>
				this.db
					.prepare(
						"INSERT INTO mcq_choices (id, mcq_id, choice_text, is_correct, position) VALUES (?1, ?2, ?3, ?4, ?5)",
					)
					.bind(
						choice.id,
						mcq.id,
						choice.text,
						choice.isCorrect ? 1 : 0,
						choice.position,
					),
			),
		];
		await this.db.batch(statements);
		const created = await this.findMcqById(mcq.id);
		if (!created) {
			throw new Error("Failed to load MCQ after insert");
		}
		return created;
	}

	async replaceMcq(mcq: NewMcqRecord): Promise<McqRecord | null> {
		const existing = await this.findMcqById(mcq.id);
		if (!existing) {
			return null;
		}

		const statements = [
			this.db
				.prepare(
					"UPDATE mcq_questions SET name = ?1, description = ?2, updated_at = datetime('now') WHERE id = ?3",
				)
				.bind(mcq.name, mcq.description, mcq.id),
			this.db
				.prepare("DELETE FROM mcq_choices WHERE mcq_id = ?1")
				.bind(mcq.id),
			...mcq.choices.map((choice) =>
				this.db
					.prepare(
						"INSERT INTO mcq_choices (id, mcq_id, choice_text, is_correct, position) VALUES (?1, ?2, ?3, ?4, ?5)",
					)
					.bind(
						choice.id,
						mcq.id,
						choice.text,
						choice.isCorrect ? 1 : 0,
						choice.position,
					),
			),
		];
		await this.db.batch(statements);
		return this.findMcqById(mcq.id);
	}

	async findMcqById(id: string): Promise<McqRecord | null> {
		const questionResult = await this.db
			.prepare(
				"SELECT id, name, description, user_id, created_at, updated_at FROM mcq_questions WHERE id = ?1",
			)
			.bind(id)
			.all<QuestionRow>();
		const question = questionResult.results[0];
		if (!question) {
			return null;
		}

		const choiceResult = await this.db
			.prepare(
				"SELECT id, mcq_id, choice_text, is_correct, position FROM mcq_choices WHERE mcq_id = ?1 ORDER BY position ASC",
			)
			.bind(id)
			.all<ChoiceRow>();

		return mapQuestion(question, choiceResult.results.map(mapChoice));
	}

	async listMcqsByUserId(userId: string): Promise<McqListItem[]> {
		const result = await this.db
			.prepare(
				"SELECT id, name, description, created_at, updated_at FROM mcq_questions WHERE user_id = ?1 ORDER BY updated_at DESC, created_at DESC",
			)
			.bind(userId)
			.all<QuestionRow>();

		return result.results.map((row) => ({
			id: row.id,
			name: row.name,
			description: row.description,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		}));
	}

	async deleteMcq(id: string): Promise<boolean> {
		const result = await this.db
			.prepare("DELETE FROM mcq_questions WHERE id = ?1")
			.bind(id)
			.run();
		return (result.meta.changes ?? 0) > 0;
	}

	async insertAttempt(
		attempt: Omit<McqAttemptRecord, "createdAt">,
	): Promise<McqAttemptRecord> {
		await this.db
			.prepare(
				"INSERT INTO mcq_attempts (id, mcq_id, user_id, choice_id, is_correct, created_at) VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))",
			)
			.bind(
				attempt.id,
				attempt.mcqId,
				attempt.userId,
				attempt.choiceId,
				attempt.isCorrect ? 1 : 0,
			)
			.run();

		const result = await this.db
			.prepare(
				"SELECT id, mcq_id, user_id, choice_id, is_correct, created_at FROM mcq_attempts WHERE id = ?1",
			)
			.bind(attempt.id)
			.all<AttemptRow>();
		const row = result.results[0];
		if (!row) {
			throw new Error("Failed to load attempt after insert");
		}
		return mapAttempt(row);
	}

	async listAttemptsByMcqId(mcqId: string): Promise<McqAttemptRecord[]> {
		const result = await this.db
			.prepare(
				"SELECT id, mcq_id, user_id, choice_id, is_correct, created_at FROM mcq_attempts WHERE mcq_id = ?1 ORDER BY created_at ASC",
			)
			.bind(mcqId)
			.all<AttemptRow>();
		return result.results.map(mapAttempt);
	}
}
