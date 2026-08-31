-- Migration number: 0002 	 2026-08-31
-- Auth-only database. Drop leftover application tables.
-- Keep: users, sessions, and Wrangler d1_migrations.
-- Do not apply this file with --remote unless the user runs that step.

DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS question_options;
DROP TABLE IF EXISTS options;
DROP TABLE IF EXISTS choices;
DROP TABLE IF EXISTS answers;
DROP TABLE IF EXISTS attempts;
DROP TABLE IF EXISTS quiz_attempts;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS scores;
