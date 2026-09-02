export type McqChoiceRecord = {
	id: string;
	mcqId: string;
	text: string;
	isCorrect: boolean;
	position: number;
};

export type McqRecord = {
	id: string;
	userId: string;
	name: string;
	description: string;
	createdAt: string;
	updatedAt: string;
	choices: McqChoiceRecord[];
};

export type McqListItem = {
	id: string;
	name: string;
	description: string;
	createdAt: string;
	updatedAt: string;
};

export type McqAttemptRecord = {
	id: string;
	mcqId: string;
	userId: string;
	choiceId: string | null;
	isCorrect: boolean;
	createdAt: string;
};

export type NewMcqRecord = {
	id: string;
	userId: string;
	name: string;
	description: string;
	choices: Array<Omit<McqChoiceRecord, "mcqId">>;
};

export type McqStore = {
	insertMcq(mcq: NewMcqRecord): Promise<McqRecord>;
	replaceMcq(mcq: NewMcqRecord): Promise<McqRecord | null>;
	findMcqById(id: string): Promise<McqRecord | null>;
	listMcqsByUserId(userId: string): Promise<McqListItem[]>;
	deleteMcq(id: string): Promise<boolean>;
	insertAttempt(
		attempt: Omit<McqAttemptRecord, "createdAt">,
	): Promise<McqAttemptRecord>;
	listAttemptsByMcqId(mcqId: string): Promise<McqAttemptRecord[]>;
};
