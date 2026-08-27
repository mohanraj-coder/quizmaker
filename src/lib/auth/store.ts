export type UserRecord = {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	passwordHash: string;
};

export type SessionRecord = {
	id: string;
	userId: string;
};

export type AuthStore = {
	findUserByEmail(email: string): Promise<UserRecord | null>;
	findUserById(id: string): Promise<UserRecord | null>;
	insertUser(user: UserRecord): Promise<void>;
	insertSession(session: SessionRecord): Promise<void>;
	findSession(id: string): Promise<SessionRecord | null>;
	deleteSession(id: string): Promise<void>;
};
