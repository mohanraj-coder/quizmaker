-- Migration number: 0003 	 2026-09-02
-- MCQ CRUD schema. Application tables added: mcq_questions, mcq_choices, mcq_attempts.
-- Keep: users, sessions. Do not apply this file with --remote unless the user runs that step.

CREATE TABLE mcq_questions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE mcq_choices (
  id TEXT PRIMARY KEY,
  mcq_id TEXT NOT NULL,
  choice_text TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL,
  FOREIGN KEY (mcq_id) REFERENCES mcq_questions(id) ON DELETE CASCADE
);

CREATE TABLE mcq_attempts (
  id TEXT PRIMARY KEY,
  mcq_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  choice_id TEXT,
  is_correct INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (mcq_id) REFERENCES mcq_questions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (choice_id) REFERENCES mcq_choices(id) ON DELETE SET NULL
);

CREATE INDEX idx_mcq_questions_user_id ON mcq_questions(user_id);
CREATE INDEX idx_mcq_choices_mcq_id ON mcq_choices(mcq_id);
CREATE INDEX idx_mcq_attempts_mcq_id ON mcq_attempts(mcq_id);
CREATE INDEX idx_mcq_attempts_user_id ON mcq_attempts(user_id);
