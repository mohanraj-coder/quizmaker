import type { AuthStore, SessionRecord, UserRecord } from "@/lib/auth/store";

type UserRow = {
	id: string;
	first_name: string;
	last_name: string;
	email: string;
	password_hash: string;
};

type SessionRow = {
	id: string;
	user_id: string;
};

function mapUser(row: UserRow): UserRecord {
	return {
		id: row.id,
		firstName: row.first_name,
		lastName: row.last_name,
		email: row.email,
		passwordHash: row.password_hash,
	};
}

export class D1AuthStore implements AuthStore {
	constructor(private readonly db: D1Database) {}

	async findUserByEmail(email: string): Promise<UserRecord | null> {
		const result = await this.db
			.prepare("SELECT id, first_name, last_name, email, password_hash FROM users WHERE email = ?1")
			.bind(email)
			.all<UserRow>();
		const row = result.results[0];
		return row ? mapUser(row) : null;
	}

	async findUserById(id: string): Promise<UserRecord | null> {
		const result = await this.db
			.prepare("SELECT id, first_name, last_name, email, password_hash FROM users WHERE id = ?1")
			.bind(id)
			.all<UserRow>();
		const row = result.results[0];
		return row ? mapUser(row) : null;
	}

	async insertUser(user: UserRecord): Promise<void> {
		await this.db
			.prepare(
				"INSERT INTO users (id, first_name, last_name, email, password_hash, created_at) VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))",
			)
			.bind(user.id, user.firstName, user.lastName, user.email, user.passwordHash)
			.run();
	}

	async insertSession(session: SessionRecord): Promise<void> {
		await this.db
			.prepare("INSERT INTO sessions (id, user_id, created_at) VALUES (?1, ?2, datetime('now'))")
			.bind(session.id, session.userId)
			.run();
	}

	async findSession(id: string): Promise<SessionRecord | null> {
		const result = await this.db
			.prepare("SELECT id, user_id FROM sessions WHERE id = ?1")
			.bind(id)
			.all<SessionRow>();
		const row = result.results[0];
		return row ? { id: row.id, userId: row.user_id } : null;
	}

	async deleteSession(id: string): Promise<void> {
		await this.db.prepare("DELETE FROM sessions WHERE id = ?1").bind(id).run();
	}
}
