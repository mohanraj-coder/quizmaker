Date created: 2026-09-02
Date last modified: 2026-09-02 (release gates: review → local deploy → feature-branch push; Cloudflare only on explicit confirmation)

# Multiple Choice Question CRUD - Technical PRD

**Document type**: Technical Product Requirements Document  
**Project**: Quiz Maker  
**Sprint**: MCQ CRUD (create, list, edit, delete, preview, and per-question attempts)  
**Audience**: Developers, reviewers, and AI-driven workflows  
**Status**: DESIGN — this document is the behaviour contract for implementation. Do not treat it as implemented until Current Status and Acceptance Criteria say so.  
**Depends on**: `ai-workspace/AUTHENTICATION_TECHNICAL_PRD.md` (also referenced as `ai-workspace/Authentication_Technical_PRD.md`)  
**Template**: `ai-workspace/TEMPLATE_TECHNICAL_PRD.md`

This document is the source of truth for the Multiple Choice Question (MCQ) module. Implementation must follow this PRD with Test-Driven Development, the same way Sign Up, Sign In, Sign Out, and sessions followed the Authentication Technical PRD.

Do **not** rebuild Sign Up, Sign In, Sign Out, or sessions as a second system. Reuse `getCurrentUser`, Server Actions, the `qm_session` cookie, and the D1 `users` / `sessions` tables. After Sign In the user still lands on the **MCQ Dashboard**. This sprint fills that dashboard with real MCQ CRUD; it does not change how identity works.

Full multi-question quizzes, shared banks, reports, and leaderboards remain out of scope here.

---

## Overview / Problem

Quiz Maker can identify a signed-in Account Holder, but that user still cannot create or manage multiple-choice questions. The MCQ Dashboard only confirms identity and shows an empty list. Without this feature, teachers and learners have no way to store a named question with answer choices, return to a list of their questions, preview how an attempt will look, or record whether a selected choice was correct.

This sprint attaches MCQ records, choices, and per-question attempts to the existing `users` identity in Cloudflare D1, using the same service-and-store pattern already used for authentication.

---

## Project Overview

Quiz Maker is a web-based application. Authentication is already implemented. Over time the product will let users create quizzes, manage quizzes, attempt quizzes, and track results. This sprint is the first quiz-data slice: **standalone multiple-choice questions** owned by the signed-in user.

The intended outcome of this module is:

- A signed-in user can create a multiple-choice question with between two and six choices.
- The user can see all of their questions in a table on the MCQ Dashboard.
- The user can edit, preview, and delete a question from a row-actions menu.
- Preview presents the choices as they would appear when answering.
- Submitting an answer records an attempt: which user, which choice, and whether it was correct.
- Unauthenticated visitors cannot open MCQ pages or call MCQ APIs.

### Current application state (inherited)

These facts come from the Authentication Technical PRD and remain true:

- Next.js 16 (App Router) and React 19.
- Hosted on Cloudflare Workers through `@opennextjs/cloudflare`.
- **Cloudflare D1** stores users and sessions (binding `DB`, database `quizmaker`).
- Tailwind CSS v4 and shadcn/ui (Base UI, `base-nova`, Lucide icons).
- TypeScript in strict mode.
- **Zod** parses untrusted form and JSON input.
- **Vitest** and Testing Library (`npm test`).
- Passwords are hashed with **PBKDF2-SHA256** via Web Crypto. Sessions are server-side D1 rows plus a signed HttpOnly cookie (`qm_session`).
- Pages: `/` (redirects by session), `/sign-up`, `/sign-in`, `/mcq-dashboard` (protected home after Sign In). `/dashboard` redirects to `/mcq-dashboard`.
- Sign Up and Sign In share `AuthShell`. The MCQ Dashboard has a header with identity and Sign Out, plus an empty-list stub.
- shadcn `Table` (and related table primitives) already exist in `src/components/ui/table.tsx` and must be used for the MCQ list. Do not introduce a different table pattern.
- Application tables today are **`users` and `sessions`**. This sprint **adds** `mcq_questions`, `mcq_choices`, and `mcq_attempts`. It does not alter the auth tables.
- Mutations for auth use Server Actions. This sprint keeps that pattern for the UI and **also** exposes HTTP route handlers that call the same MCQ service.
- No AI SDK is required for this sprint.

### Primary user for this sprint

The same **Account Holder** defined in authentication. There are still no roles, plans, or permissions beyond “signed in” and “signed out”. The author of a question is also the person who can list, edit, delete, preview, and attempt it.

---

## Business Goal

Give each authenticated user a durable place to create and manage their own multiple-choice questions, and a way to record attempts against those questions, so later quiz-set and reporting sprints have records they can attach to.

Without MCQ CRUD, the product cannot:

- Attribute a question to its author.
- Present choices when answering.
- Record whether an answer was correct.

---

## Hypothesis

We believe that a session-protected MCQ CRUD flow — list table, dedicated create/edit page, three-dot row actions, preview, and recorded attempts — will let Account Holders manage their own multiple-choice questions without changing how they sign in or stay signed in.

---

## Sprint Goal

Design (this document) and then implement in **Phases 1–5**, with TDD:

- Create, retrieve, update, and delete multiple-choice questions.
- Manage 2–6 choices per question, with choices available when answering.
- List questions on the MCQ Dashboard.
- Preview a question as an attempt surface.
- Record attempts (user, selected choice, correct or incorrect).
- An MCQ service layer and HTTP endpoints, following the auth store/service pattern.
- UI that reuses shadcn/ui, the existing dashboard chrome, and the existing table primitives.

After **each** of Phases 1–5, stop for **user review**. After that review, **deploy locally** (`npm run preview` and related local checks). After the user **approves** the phase, **push** the approved commits to the **feature branch**. Run `npm run deploy` to Cloudflare **only** after a separate, explicit confirmation — never as a default end-of-phase step.

---

## Assumptions

1. Authentication behaviour in the Authentication Technical PRD is unchanged. This sprint consumes `getCurrentUser()`; it does not add a second login system.
2. After Sign In the user still lands on `/mcq-dashboard`. Successful MCQ save also returns to `/mcq-dashboard`.
3. A question belongs to the signed-in user who created it. Other users’ questions are treated as **not found** (no existence leak).
4. Each question has **at least two and at most six** choices.
5. Exactly **one** choice is the correct answer. Multi-select scoring is out of scope so “correct / incorrect” is unambiguous.
6. Preview is an answering surface for the owner. Submitting a preview answer creates an `mcq_attempts` row.
7. Attempts require a valid session. There are no anonymous attempts.
8. English is the only language for labels, validation, and errors.
9. Further npm dependencies still need to be proposed first. Prefer existing shadcn components (`table`, `button`, `card`, `field`, `input`, `dialog`). Add `dropdown-menu` and `textarea` via `npx shadcn@latest add @shadcn/...` if they are not already in `src/components/ui/`. Do not introduce `react-hook-form`.
10. Local D1 migrations only. Do not apply `--remote` unless the user runs that step. Do not run `npm run deploy` (Cloudflare) unless the user gives **explicit confirmation** for production deploy. End-of-phase work is review → local deploy → push to the feature branch (see **Release and review gates**).
11. “Current application” means this Quiz Maker repository on the stack in `AGENTS.md`.
12. Unauthenticated users who later Sign In still land on the MCQ Dashboard (Authentication assumption 4). Deep-link return after login is not required in this sprint.

---

## Scope

### In Scope

- Three D1 tables: `mcq_questions`, `mcq_choices`, `mcq_attempts`.
- An MCQ **service layer** (same pattern as `src/lib/services/auth.ts`) over a store interface and a D1 implementation.
- HTTP endpoints and App Router routes for create, retrieve, update, delete, list, preview, and attempts.
- Server Actions for the browser UI that call the same service (auth mutation pattern).
- Protected pages to list, create, edit, delete, and preview the current user’s MCQs.
- A **New Multiple Choice Question** button on the list that navigates to a create page.
- Create and edit pages that manage the question and its choices, with **Save** and **Cancel**.
- After save, redirect to the list table (question name, description, actions).
- Row actions behind a **three-dot (vertical ellipsis)** menu: **Edit**, **Preview**, **Delete**.
- Preview that presents choices for answering and records an attempt (user, selected choice, correct/incorrect).
- Zod validation on client (usability) and server (authority).
- Vitest coverage for validation rules, CRUD, service/API behaviour, and attempts, plus UI tests for the form and row menu.
- Local D1 migration only.
- Accessibility, security, and performance requirements for these pages, consistent with the Authentication PRD (server-side protection, no private-content flash, labelled fields, associated errors).

### Out of Scope

- Full multi-question quizzes, quiz sets, or sharing a question with another user.
- Reports, scores, leaderboards, or analytics dashboards.
- Timed attempts, attempt limits, or a dedicated “review all attempts” history page (the attempts **API** is in scope; a rich history UI is not).
- Roles (teacher vs student) or answering another author’s question bank.
- AI-generated questions.
- Changing authentication, password reset, profile editing, or email verification.
- Remote D1 migration unless the user runs that step.
- Cloudflare production deploy unless the user gives **explicit confirmation** after review (not implied by finishing a phase or by pushing the feature branch).

### Cut

- **Multi-select (more than one correct choice)** — Cut so scoring is a single correct/incorrect outcome.
- **Automatic sign-in after Sign Up** — Already cut in authentication; unchanged.
- **Public/anonymous attempts** — Cut; attempts require the existing session.
- **Idle session timeout** — Unchanged from authentication.
- **Return-to-original-URL after Sign In** — Still a future auth enhancement; deep links to `/mcq-dashboard/new` after login are not required (unauthenticated users go to Sign In; after Sign In they land on the dashboard).

---

## User Stories

Each story is written from the Account Holder’s point of view. Acceptance of a story requires the matching Acceptance Criteria later in this document.

| ID | Story | Priority |
| --- | --- | --- |
| US-MCQ-01 | As a signed-in user, I want to open the MCQ Dashboard and see my questions in a table so that I can manage them. | Must |
| US-MCQ-02 | As a signed-in user, I want a New Multiple Choice Question button that takes me to a create page. | Must |
| US-MCQ-03 | As a signed-in user, I want to enter a name, question/description, and 2–6 choices with one correct answer, then Save. | Must |
| US-MCQ-04 | As a signed-in user, I want Save to return me to the list showing the new or updated row. | Must |
| US-MCQ-05 | As a signed-in user, I want Cancel to return me to the list without saving. | Must |
| US-MCQ-06 | As a signed-in user, I want a three-dot menu per row with Edit, Preview, and Delete. | Must |
| US-MCQ-07 | As a signed-in user, I want Edit to load the question and choices so I can change them and Save. | Must |
| US-MCQ-08 | As a signed-in user, I want Preview to show the question and choices as if answering. | Must |
| US-MCQ-09 | As a signed-in user, I want submitting a preview answer to store an attempt (who, which choice, correct or not). | Must |
| US-MCQ-10 | As a visitor who is not signed in, I want MCQ pages and APIs blocked the same way as the MCQ Dashboard. | Must |
| US-MCQ-11 | As a signed-in user, I want delete to ask for confirmation so I do not remove a question by accident. | Must |
| US-MCQ-12 | As a signed-in user, I want another person’s question id to behave as not found so I cannot edit or attempt their work. | Must |

---

## User Flow

Authentication flows (Sign Up → Sign In → MCQ Dashboard, Sign Out, protected-page redirect) are unchanged. See the Authentication Technical PRD **User Flow**. This sprint adds the following.

### 1. Create a question

1. The signed-in user is on the MCQ Dashboard.
2. The user chooses **New Multiple Choice Question**.
3. The application opens the create page.
4. The user enters name, question/description, and choices (starts with two; may add up to six).
5. The user marks exactly one choice as correct.
6. If validation fails, the user stays on the page with inline errors. Nothing is stored.
7. The user chooses **Save**. The server validates again, persists the question and choices, and redirects to the MCQ Dashboard list.
8. The new row appears in the table.

### 2. Cancel create or edit

1. The user is on create or edit.
2. The user chooses **Cancel**.
3. No write occurs. The user returns to the list.

### 3. Edit a question

1. From a table row, the user opens the three-dot menu and chooses **Edit**.
2. The edit page loads the question and its choices.
3. The user changes fields and/or choices (still 2–6, exactly one correct).
4. **Save** updates the record and returns to the list. **Cancel** discards the form.

### 4. Preview and attempt

1. From a table row, the user opens the three-dot menu and chooses **Preview**.
2. The page shows the name, the question/description, and the choices **without** marking which is correct.
3. The user selects a choice and submits.
4. The application stores an attempt (user id, choice id, correct/incorrect) and shows whether the answer was correct.
5. The user can return to the list.

### 5. Delete a question

1. From a table row, the user opens the three-dot menu and chooses **Delete**.
2. A confirmation dialog explains that the question, its choices, and recorded attempts will be removed.
3. Confirm deletes the question (cascade) and stays on the list. Cancel closes the dialog.

### 6. Unauthenticated access

1. A signed-out user requests any MCQ page or MCQ API.
2. Pages redirect to Sign In without flashing MCQ content (same rule as the Authentication PRD).
3. APIs return **401** and do not leak records.

---

## Navigation Flow

Public pages (no session required) — unchanged:

- Sign In (`/sign-in`)
- Sign Up (`/sign-up`)

Protected pages (session required):

- MCQ Dashboard list (`/mcq-dashboard`; `/dashboard` is still an alias)
- Create MCQ (`/mcq-dashboard/new`)
- Edit MCQ (`/mcq-dashboard/[id]/edit`)
- Preview MCQ (`/mcq-dashboard/[id]/preview`)

| Starting point | User state | Destination |
| --- | --- | --- |
| Application root | Signed out | Sign In |
| Application root | Signed in | MCQ Dashboard |
| Sign In / Sign Up | Signed in | MCQ Dashboard |
| Any MCQ page | Signed out | Sign In |
| **New Multiple Choice Question** | Signed in | Create page |
| Save (create or edit) | Signed in | MCQ Dashboard list |
| Cancel (create or edit) | Signed in | MCQ Dashboard list |
| Row menu Edit | Signed in | Edit page for that id |
| Row menu Preview | Signed in | Preview page for that id |
| Sign Out | Session cleared | Sign In |

Logical page names:

- **MCQ Dashboard (list)**
- **Create Multiple Choice Question**
- **Edit Multiple Choice Question**
- **Preview Multiple Choice Question**

---

## Functional Requirements

| ID | Requirement |
| --- | --- |
| FR-MCQ-01 | The MCQ Dashboard shall list the signed-in user’s questions in a shadcn `Table` with columns **Name**, **Description**, and **Actions**. |
| FR-MCQ-02 | The list shall include a primary control labelled **New Multiple Choice Question** that navigates to the create page. |
| FR-MCQ-03 | When the user has no questions, the list shall show an empty state. The New button remains available. |
| FR-MCQ-04 | The create page shall collect question name, question/description, and 2–6 choices, with Save and Cancel. |
| FR-MCQ-05 | The edit page shall load the owner’s question and choices and use the same fields and Save / Cancel behaviour as create. |
| FR-MCQ-06 | Save shall persist only when every validation rule passes on the server. |
| FR-MCQ-07 | Successful Save shall redirect to `/mcq-dashboard`. |
| FR-MCQ-08 | Cancel shall not write to the database and shall return to `/mcq-dashboard`. |
| FR-MCQ-09 | Each table row shall expose a three-dot control whose menu contains **Edit**, **Preview**, and **Delete**. |
| FR-MCQ-10 | Delete shall require confirmation, then remove the question for the owner only (choices and attempts cascade). |
| FR-MCQ-11 | Preview shall show the question and its choices without revealing which choice is correct until after submit. |
| FR-MCQ-12 | Submitting a preview answer shall store `user_id`, selected `choice_id`, and whether the answer was correct. |
| FR-MCQ-13 | Each question shall have at least two and at most six choices. |
| FR-MCQ-14 | Exactly one choice shall be marked correct. |
| FR-MCQ-15 | Validation errors shall appear inline (or as a form-level alert for system failures). Invalid data shall not be stored. |
| FR-MCQ-16 | All MCQ pages shall be available only to authenticated users (server-side check, same as Authentication FR-19 / FR-20). |
| FR-MCQ-17 | MCQ HTTP endpoints shall require a valid session. Missing session → 401. |
| FR-MCQ-18 | Retrieve, update, delete, preview, and attempts shall succeed only for questions owned by the session user. Otherwise respond as not found. |
| FR-MCQ-19 | The MCQ service shall be the single behaviour contract used by Server Actions and HTTP route handlers. |
| FR-MCQ-20 | `users` and `sessions` schema and auth flows shall remain unchanged. |
| FR-MCQ-21 | Client-side validation does not skip server-side validation (Authentication FR-24 applied to MCQ input). |
| FR-MCQ-22 | User-supplied name, description, and choice text shall be stored as text and escaped/encoded when rendered so they cannot run as HTML or script (Authentication SR-13 applied to MCQ fields). |

---

## Authentication and authorisation (inherited)

These Authentication PRD rules still apply and are not redesigned here:

- Email-and-password accounts and server-side D1 sessions (`qm_session` HttpOnly cookie).
- After Sign In the user lands on `/mcq-dashboard`.
- Unauthenticated requests to protected pages redirect to `/sign-in` and must not first flash private content.
- Authenticated users who open Sign Up or Sign In redirect to `/mcq-dashboard`.
- Sign Out invalidates the server session and cookie, then redirects to Sign In.
- There is a single user type (Account Holder). No roles yet.
- Passwords stay hashed with PBKDF2. Do not add a second auth library.
- CSRF: state-changing MCQ actions must use the framework’s request-forgery defences (Server Actions; same origin checks as auth).
- Rate limiting of Sign In remains an open auth gap; this sprint does not add an MCQ-specific limiter unless a dependency is proposed and accepted.

MCQ-specific authorisation:

- Ownership is enforced in the **service**, not only by hiding UI.
- A signed-in user must not read, edit, delete, preview, or attempt another user’s MCQ. Use the same not-found message for unknown ids and unowned ids.

---

## UI Requirements

UI here means **page content, fields, copy, and behaviour**. Visual implementation must use the existing design system (Tailwind theme tokens and shadcn/ui). Do not invent a parallel visual language. Reuse the MCQ Dashboard chrome (Quiz Maker wordmark, signed-in email from `sm` breakpoint, outline **Sign out**).

Use shadcn `Card`, `Button`, `Table` (`TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`), `Field` / `FieldError`, `Input`, `Textarea`, `DropdownMenu`, and `Dialog`. Primary actions `h-11` where the auth pages already use that height.

### MCQ Dashboard — list (`/mcq-dashboard`)

Purpose: signed-in home; list and manage the user’s questions.

The page shall include:

- Title **MCQ Dashboard**.
- Short welcome that includes the user’s first name or email (unchanged from authentication).
- **Sign out**.
- Primary button **New Multiple Choice Question**.
- Empty state when there are no rows, for example that the user has no multiple-choice questions yet.
- When rows exist, a table:

| Column | Content |
| --- | --- |
| Name | Question name |
| Description | Question / description text (may truncate visually; full text remains on edit/preview) |
| Actions | Icon-only control showing three vertical dots (`MoreHorizontal` or equivalent Lucide icon). Accessible name such as **Question actions**. |

Menu items, in this order:

1. **Edit**
2. **Preview**
3. **Delete** (destructive styling allowed)

Delete opens a `Dialog` using the delete confirmation copy in Error / Success Messages.

### Create page (`/mcq-dashboard/new`)

Purpose: create one MCQ and its choices.

- Page title **New multiple choice question** (or equivalent clear heading).
- Fields listed under Input Fields.
- **Add choice** until six choices exist; **Remove** on a choice disabled when only two remain.
- Radio (or equivalent single-select) **Correct answer** across choices.
- **Save** (primary) and **Cancel**.
- Inline field errors. Form-level alert for unexpected failures.
- Submit blocked while client-side validation fails; Save shows a busy/disabled state during submission.

### Edit page (`/mcq-dashboard/[id]/edit`)

Same layout and controls as create, titled **Edit multiple choice question**. Prefills name, description, choices, and which choice is correct. If the id is missing or not owned, redirect to the list (do not show another user’s data).

### Preview page (`/mcq-dashboard/[id]/preview`)

- Heading uses the question **name**.
- Body uses **question / description** as the prompt.
- Choices listed without indicating the correct one.
- User selects one choice and submits **Submit answer**.
- After submit, show **Correct.** or **Incorrect.** (exact strings in the message table).
- Control to return to the list (link or button).

### Shared UI rules (from Authentication PRD)

- Every input has a visible label. Placeholder is not a substitute.
- Errors are associated with the field they describe.
- Keyboard access to the three-dot menu, dialog, and forms.
- Pages work at typical laptop and mobile widths.
- Colour is not the only error signal.

---

## Input Fields

### Create / Edit

| Field | Required | Type | Notes |
| --- | --- | --- | --- |
| Question name | Yes | Text | Trim leading and trailing spaces. Max 200. |
| Question / description | Yes | Textarea | Trim. This is the prompt shown in preview. Max 2000. |
| Choice text (each) | Yes | Text | Trim. Max 500. Count of choices 2–6. |
| Correct answer | Yes | Single choice among the listed choices | Exactly one must be selected. |

### Preview

| Field | Required | Type | Notes |
| --- | --- | --- | --- |
| Selected choice | Yes | Radio / selectable list of choice ids | Must belong to this question. |

### Display-only (list)

| Item | Notes |
| --- | --- |
| Name | From `mcq_questions.name` |
| Description | From `mcq_questions.description` |
| Actions menu | Edit, Preview, Delete |

---

## Field Validation Rules

Validation runs on the client for fast feedback and **again on the server** as the source of truth.

### Question name

1. Required. After trim, length at least 1.
2. Maximum length 200 characters after trim.

### Question / description

1. Required. After trim, length at least 1.
2. Maximum length 2000 characters after trim.

### Choices

1. At least two choices with non-empty text after trim.
2. At most six choices.
3. Each choice text required after trim.
4. Each choice text maximum 500 characters after trim.
5. Exactly one choice marked `isCorrect`.

### Attempt

1. `choiceId` required.
2. The choice must belong to the question being attempted.

---

## Error Messages

Use these exact user-facing strings unless a later change is recorded in this PRD.

| Condition | Message |
| --- | --- |
| Name missing | Name is required. |
| Name too long | Name must be 200 characters or fewer. |
| Description missing | Question / description is required. |
| Description too long | Question / description must be 2000 characters or fewer. |
| Fewer than two valid choices | Add at least two choices. |
| More than six choices | A question can have at most six choices. |
| Choice text missing | Choice text is required. |
| Choice text too long | Choice text must be 500 characters or fewer. |
| Zero or more than one correct choice | Mark exactly one choice as the correct answer. |
| MCQ not found or not owned | Multiple choice question not found. |
| Choice missing or not on this question | That choice is not available for this question. |
| Attempt submitted with no choice | Select a choice before submitting your answer. |
| Unauthenticated API | Sign in required. |
| Unexpected server failure | Something went wrong. Please try again. |

System errors are form-level (or JSON `{ "error" }`). They must not include stack traces, SQL, or internal identifiers.

Delete confirmation (dialog, not a validation error):

| Item | Copy |
| --- | --- |
| Title | Delete this multiple choice question? |
| Description | This will permanently remove the question, its choices, and recorded attempts. |

---

## Success Messages

| Event | Message | Where |
| --- | --- | --- |
| Create or update saved | None required. The list is the success state. | MCQ Dashboard |
| Preview correct | Correct. | Preview page after submit |
| Preview incorrect | Incorrect. | Preview page after submit |
| Delete confirmed | None required. The row disappears from the list. | MCQ Dashboard |

Do not show the correct choice label on preview until after the user has submitted.

---

## Security Requirements

In addition to Authentication SR-01 through SR-15:

| ID | Requirement |
| --- | --- |
| SR-MCQ-01 | Authorisation is server-side. Hiding a menu item is not access control. |
| SR-MCQ-02 | Preview payloads and the preview page must omit `isCorrect` on choices. Owner retrieve (GET by id / edit) may include `isCorrect` so the author can edit. |
| SR-MCQ-03 | Store `is_correct` on the **attempt** at insert time. Later edits to choices must not rewrite historical attempts. |
| SR-MCQ-04 | Prepared statements with numbered placeholders (`?1`, `?2`) for all D1 SQL. Never concatenate user input into SQL. |
| SR-MCQ-05 | Constrain lengths on name, description, and choice text (validation table) to reduce abuse. |
| SR-MCQ-06 | Do not put session tokens in URLs. MCQ ids in paths are fine; they are not secrets, but unowned ids still return not found. |

---

## Non-Functional Requirements

### Performance

| ID | Requirement |
| --- | --- |
| NFR-MCQ-P01 | List, create, and edit pages should become interactive quickly on typical broadband (same spirit as auth: first useful render under 3 seconds in local development). |
| NFR-MCQ-P02 | Save and delete round trips should complete within 2 seconds under normal local or preview load. |
| NFR-MCQ-P03 | Signed-out redirect to MCQ pages must not flash list, create, or preview content. |

### Accessibility

Meet WCAG 2.2 Level AA for the MCQ pages, consistent with Authentication NFR-A01–A11: keyboard, visible focus, labels, error association, contrast, `lang="en"`, adequate target size for primary controls. The three-dot trigger must have an accessible name. Menu items must be reachable by keyboard.

### Reliability and operability

| ID | Requirement |
| --- | --- |
| NFR-MCQ-R01 | Unexpected failures show the generic system error, not a blank page. |
| NFR-MCQ-R02 | Implementation must pass `npm run lint` and `npm run build` before this sprint is called complete. |
| NFR-MCQ-R03 | Runtime-sensitive D1 behaviour must be verified with `npm run preview` in addition to `npm run dev`. |
| NFR-MCQ-R04 | After each phase: wait for user review, then local deploy (`npm run preview` and related checks). Push approved changes to the feature branch. `npm run deploy` (Cloudflare) only after explicit confirmation. |
| NFR-MCQ-R05 | Apply D1 migrations locally only (`npx wrangler d1 migrations apply quizmaker --local`). Never `--remote` unless the user runs that step. |

### Maintainability

- Behaviour in this PRD is the contract. Tests describe that contract.
- The MCQ service is the domain API. Route handlers and Server Actions stay thin.

---

## Test-Driven Development (TDD)

MCQ CRUD **must be built with TDD**, following `.cursor/skills/testing/SKILL.md` and the same process as authentication.

### Process (mandatory)

1. **Red** — Write a failing test that expresses one requirement from this PRD.
2. **Green** — Write the smallest production change that makes that test pass.
3. **Refactor** — Clean up without changing behaviour. Tests stay green.
4. Do not add production behaviour that has no test.
5. Do not write tests that cannot fail.
6. Name tests so a failure message states the broken rule (for example, `rejects create when only one choice is provided`).

Colocate tests with the subject. Mock network, D1, and Cloudflare bindings. Use an in-memory `McqStore` for service tests (same idea as auth service tests).

### What to test first (order)

1. Validation rules (pure functions): name, description, 2–6 choices, exactly one correct, length limits.
2. Create success and rejection (invalid payload does not insert).
3. List returns only the current user’s questions.
4. Retrieve / update / delete: owner success; other user or unknown id → not found; no leak.
5. Preview DTO omits `isCorrect`.
6. Record attempt: user id, choice id, correctness copied at insert; invalid choice rejected.
7. HTTP handlers map service results to 200/201/204/400/401/404 as specified.
8. UI: New button navigates; table columns; three-dot menu has Edit, Preview, Delete; Save/Cancel; confirmation before delete.

### Test categories

| Category | Proves | Examples |
| --- | --- | --- |
| Unit | Validation in isolation | Empty name fails; seven choices fail; two correct flags fail |
| Integration / service | CRUD and attempts against a mocked store | Create then list; update replaces choices; delete cascades in store behaviour |
| HTTP | Route status codes and JSON shape | 401 without cookie; 404 for unowned id; preview JSON has no `isCorrect` |
| UI / component | What the user can see and do | Menu items; Save blocked while invalid; dialog copy |
| Access control | Server-side protection | Signed-out dashboard still redirects; API 401 |

### Coverage expectations (behaviour, not a percentage)

Every validation row has at least one failing-input test and the happy path has a passing-input test.

Every Error Message in this PRD that the service or UI produces is asserted where that condition is produced.

CRUD, ownership, preview stripping, and attempts are covered.

### Definition of done for TDD on this feature

- Tests are written before the production code they lock.
- `npm test` is green.
- A reviewer can map each Must user story to tests.
- Failure paths are covered, not only the happy path.

---

## Technical Requirements

### Database Schema

Add a new local migration (next number after existing auth migrations, for example `0003_create_mcq_tables.sql`). Do not apply with `--remote` unless the user runs that step. Do not modify `users` or `sessions`.

```sql
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
```

**Rules**:

- `mcq_questions.id` is the multiple-choice question id (opaque text, e.g. UUID).
- `name` is the question name shown in the list.
- `description` is the question / description (the prompt).
- `user_id` is the creator (`users.id`).
- `created_at` / `updated_at` are timestamps (`updated_at` changes on edit).
- Choices reference `mcq_questions.id`. `position` preserves display order. `is_correct` is `0` or `1`.
- The service (not SQLite CHECK) enforces 2–6 choices and exactly one correct choice.
- Attempts record which user attempted the question, which choice they selected, and whether it was correct (`is_correct` on the attempt row).
- Deleting a question cascades to choices and attempts.
- Replacing choices on edit may `SET NULL` on old `choice_id` values for historical attempts; the attempt’s stored `is_correct` remains the source of truth for that attempt.

### API Endpoints

All endpoints require a valid session. Missing or invalid session: **401** `{ "error": "Sign in required." }`.

Service functions (for example in `src/lib/services/mcq.ts`) are the behaviour contract. Route handlers under `src/app/api/mcq/` parse JSON with Zod, call the service, and map results to HTTP status codes. The UI uses Server Actions (for example `src/app/actions/mcq.ts`) against the **same** service — analogous to `src/app/actions/auth.ts` + `src/lib/services/auth.ts`.

`McqDetail` = `{ id, userId, name, description, createdAt, updatedAt, choices: [{ id, text, isCorrect, position }] }`.

#### GET /api/mcq

List the current user’s questions (no choice payload required).

**Response**

- 200: `{ "mcqs": [ { "id", "name", "description", "createdAt", "updatedAt" } ] }`
- 401

#### POST /api/mcq

**Request body:**

```json
{
  "name": "Capitals",
  "description": "What is the capital of France?",
  "choices": [
    { "text": "Paris", "isCorrect": true },
    { "text": "Lyon", "isCorrect": false }
  ]
}
```

**Response**

- 201: `{ "mcq": McqDetail }`
- 400: `{ "error", "errors" }` (field errors from validation)
- 401

#### GET /api/mcq/:id

Owner retrieve, including which choice is correct (for edit).

- 200: `{ "mcq": McqDetail }`
- 404: `{ "error": "Multiple choice question not found." }`
- 401

#### PUT /api/mcq/:id

Same body as POST. Replaces name, description, and the full choice set. Sets `updated_at`.

- 200: `{ "mcq": McqDetail }`
- 400 / 401 / 404

#### DELETE /api/mcq/:id

- 204 empty body
- 401 / 404

#### GET /api/mcq/:id/preview

Choices **omit** `isCorrect`.

- 200: `{ "mcq": { "id", "name", "description", "choices": [ { "id", "text" } ] } }`
- 401 / 404

#### GET /api/mcq/:id/attempts

Owner list of attempts for that question.

- 200: `{ "attempts": [ { "id", "mcqId", "userId", "choiceId", "isCorrect", "createdAt" } ] }`
- 401 / 404

#### POST /api/mcq/:id/attempts

**Request body:** `{ "choiceId": "<choice id>" }`

**Response**

- 201: `{ "attempt": { "id", "mcqId", "userId", "choiceId", "isCorrect", "createdAt" } }`
- 400 if the choice is missing or does not belong to the question
- 401 / 404

### User Interface Requirements (routes)

| Page | Route | Notes |
| --- | --- | --- |
| List | `/mcq-dashboard` | Replace empty-list stub with table + New button; keep header and Sign Out |
| Create | `/mcq-dashboard/new` | Full question + choices form |
| Edit | `/mcq-dashboard/[id]/edit` | Same form, prefilled |
| Preview | `/mcq-dashboard/[id]/preview` | Attempt surface |

Canonical path helpers should live next to auth paths (for example `src/lib/mcq/paths.ts` using `MCQ_DASHBOARD_PATH`).

### Platform constraints

- Cloudflare Workers via OpenNext. No Node-only modules that fail on Workers.
- Prefer Server Actions for browser mutations; HTTP routes exist because this sprint requires endpoints.
- Validate with Zod, then apply the field rules in a `validateMcqInput` (or equivalent) function — same two-step pattern as `signUpFormSchema` + `validateSignUp`.
- `getCloudflareContext()` for D1. Centralize queries in `src/lib/`, not in client components.
- Bindings and secrets follow Wrangler conventions; never commit secrets.

---

## Release and review gates

These rules apply to **every** implementation phase (1–5). They override any impulse to push, preview, or deploy “because the phase looks done.”

### Sequence (mandatory)

1. **Implement** the phase with TDD. Mark the phase **IN PROGRESS**. Do not mark it **COMPLETED**.
2. **Stop for user review.** Present what changed, test results, and anything uncertain. Do not local-deploy, commit-for-release, or push until the user has reviewed (or has asked you to apply review feedback first).
3. **Local deploy after review.** When the user has reviewed (and any requested fixes are in), prove the phase **locally**:
   - `npm test` (or the phase-relevant subset if the full suite is not yet applicable)
   - `npm run lint` and `npm run build` when the phase includes enough app surface to make them meaningful
   - `npm run preview` (local Cloudflare Workers runtime) when the phase touches sessions, D1, routes, or UI
   - Apply D1 migrations **locally only** (`npx wrangler d1 migrations apply quizmaker --local`)
   - Do **not** apply migrations with `--remote`
4. **Push approved changes to the feature branch.** User **approval of the phase** authorises commit and **push to the feature branch** for this MCQ sprint. Do not merge to `main`/`master` unless they explicitly ask. Do not push unreviewed work.
5. **Cloudflare production deploy is a separate gate.** Run `npm run deploy` **only** after the user gives **explicit confirmation** for Cloudflare (for example “deploy this to Cloudflare”). Approving a phase, asking for local preview, or asking to push the feature branch **does not** authorise production deploy.

### Local deploy (what it means)

| Command | Role after a phase review |
| --- | --- |
| `npm run dev` | Convenience on Node at `localhost:3000` |
| `npm run preview` | Required local Workers deploy for runtime-sensitive work |
| `npm run build` / `npm run lint` | Quality bar before calling local deploy done |
| `npx wrangler d1 migrations apply quizmaker --local` | Schema for this sprint; local only |

### Cloudflare deploy (what it is not)

- Not part of Phases 1–5 by default.
- Not implied by a green local preview.
- Not implied by a feature-branch push.
- Remote D1 schema changes remain the user’s decision; agents must not run remote migrations.

### Feature branch

Implementation work for this sprint lives on a **feature branch** (create one if the work is not already on one). End-of-phase pushes go to that branch after approval.

---

## Implementation Phases

Implementation is **Phases 1–5**. This document is the design contract (equivalent to Authentication Phase 0). Do not start production code until the corresponding tests fail, then implement.

After each phase, follow **Release and review gates**: user review → local deploy → push approved changes to the feature branch. Cloudflare `npm run deploy` only with explicit confirmation.

**Status markers**: PLANNED | IN PROGRESS | COMPLETED (COMPLETED only after user approval of that phase)

**Phase gate (repeat on Phases 1–5)**: Review → local deploy → feature-branch push. Cloudflare only if the user separately confirms.

### Phase 1: Validation, schema, and store contract — COMPLETED

**Objective**: Lock the copy and field rules with tests, persist the three D1 tables locally, and define the `McqStore` interface the same way `AuthStore` is defined — without yet exposing HTTP or UI.

**Tasks**:

1. Write failing Vitest cases for every validation rule and user-facing message in this PRD (name, description, 2–6 choices, choice length, exactly one correct, attempt `choiceId` required).
2. Implement `validateMcqInput` (and Zod parse helpers for JSON / FormData) so those tests pass.
3. Add a D1 migration for `mcq_questions`, `mcq_choices`, and `mcq_attempts` (do not change `users` or `sessions`).
4. Apply the migration **locally only**.
5. Define record types and `McqStore` methods (insert, replace, find, list by user, delete, insert attempt, list attempts).
6. Centralise canonical paths and message constants.

**Deliverables**:

- Green unit suite for MCQ validation
- Local migration for the three tables
- Store interface and message/path modules ready for the service

**Maps to**: Field Validation Rules, Error Messages, Database Schema

**Phase gate**: After user review of Phase 1, local deploy (tests; apply migration locally; `npm run preview` if D1 is exercised). After approval, push to the feature branch. No Cloudflare deploy unless explicitly confirmed.

### Phase 2: MCQ service CRUD — COMPLETED

**Objective**: Domain operations for create, list, retrieve, update, and delete, with ownership enforced in the service — following `src/lib/services/auth.ts` + `d1-auth-store.ts`.

**Tasks**:

1. In-memory store tests: create success; invalid payload does not insert; list is scoped to `userId`; get/update/delete succeed for the owner; unknown or other-user id returns not found with no leak.
2. Implement `src/lib/services/mcq.ts` (or equivalent) as the single behaviour contract.
3. Implement `D1McqStore` with prepared statements (`?1`, `?2`).
4. Wire store access next to existing `getAuthStore()` / `getCloudflareContext()` usage.
5. On update, replace the full choice set, set `updated_at`, and leave historical attempt correctness intact.

**Deliverables**:

- Service covering FR-MCQ-13, FR-MCQ-14, FR-MCQ-18 for CRUD
- Tests a reviewer can map to US-MCQ-03, US-MCQ-07, US-MCQ-12 (write paths)

**Maps to**: FR-MCQ-06, FR-MCQ-10 (service delete), FR-MCQ-19 (service exists; HTTP still Phase 3)

**Phase gate**: After user review of Phase 2, local deploy (`npm test`, lint/build as applicable, `npm run preview` for D1). After approval, push to the feature branch. No Cloudflare deploy unless explicitly confirmed.

### Phase 3: Preview, attempts, HTTP routes, and Server Actions — COMPLETED

**Objective**: Preview without the answer key; record and list attempts; expose thin HTTP handlers and browser Server Actions that call the same service and require a session.

**Tasks**:

1. Tests: preview DTO omits `isCorrect`; valid attempt stores user, choice, and correctness snapshot; invalid or foreign `choiceId` is rejected; listing attempts is owner-only.
2. Service methods for preview and `recordAttempt` / `listAttempts`.
3. Tests for HTTP status codes: 401 without session; 400 validation; 404 unowned/unknown; 201 create / attempt; 200 get/list/preview; 204 delete.
4. Route handlers under `src/app/api/mcq/` as specified in API Endpoints.
5. Server Actions in `src/app/actions/mcq.ts` for create, update, delete, and submit-attempt, calling the **same** service (auth pattern).
6. Resolve the current user from the existing session; never invent a second cookie.

**Deliverables**:

- Endpoints listed in Technical Requirements
- FR-MCQ-11, FR-MCQ-12, FR-MCQ-16, FR-MCQ-17 at the API/action boundary

**Maps to**: US-MCQ-08, US-MCQ-09, US-MCQ-10 (API half)

**Phase gate**: After user review of Phase 3, local deploy including `npm run preview` (session + API on Workers). After approval, push to the feature branch. No Cloudflare deploy unless explicitly confirmed.

### Phase 4: UI — list, create/edit, row menu, preview — COMPLETED

**Objective**: Replace the empty MCQ Dashboard stub with the list table and complete the create, edit, and preview pages using shadcn and existing dashboard chrome.

**Tasks**:

1. Component tests: **New Multiple Choice Question** control; table columns Name, Description, Actions; three-dot menu items Edit, Preview, Delete; Save/Cancel; delete confirmation copy; preview hides the correct flag until submit.
2. List page: keep header (wordmark, email, Sign Out); add New button; empty state vs shadcn `Table`.
3. Create page `/mcq-dashboard/new` and edit page `/mcq-dashboard/[id]/edit` sharing one form: name, description, 2–6 choices, correct marker, Save, Cancel.
4. Row `DropdownMenu` (three vertical ellipses) for Edit, Preview, Delete; Delete uses `Dialog`.
5. Preview page: choices as answer options; **Submit answer**; then **Correct.** or **Incorrect.**; return to list.
6. After Save, redirect to `/mcq-dashboard`. Cancel is a navigation with no write.
7. Unowned edit/preview ids: redirect to list; do not render another user’s content.

**Deliverables**:

- US-MCQ-01 through US-MCQ-08, US-MCQ-11
- Pages under `src/app/mcq-dashboard/`

**Maps to**: UI Requirements, FR-MCQ-01 through FR-MCQ-09

**Phase gate**: After user review of Phase 4, local deploy (`npm run preview` plus browser verification of list/create/edit/preview). After approval, push to the feature branch. No Cloudflare deploy unless explicitly confirmed.

### Phase 5: Access control, accessibility, hardening, and verification — PLANNED

**Objective**: Meet the same quality bar Authentication Phase 5 used: server-side protection, a11y, lint/build, and proof on Node plus local Workers. Cloudflare production deploy is **not** automatic at the end of this phase.

**Tasks**:

1. Confirm every MCQ page calls `getCurrentUser()` on the server and redirects to Sign In without flashing private content (NFR-MCQ-P03).
2. Keyboard, labels, `FieldError` association, accessible name on the three-dot trigger, dialog, and contrast consistent with Authentication NFR-A01–A11.
3. Confirm user-supplied text is rendered as text (SR-MCQ / Authentication SR-13).
4. Confirm `npm test` covers validation, CRUD, service, HTTP/actions, attempts, and UI cases listed in TDD.
5. Run `npm run lint` and `npm run build` and record the actual result.
6. Browser (or closest substitute) flow: Sign In → create → list row → edit → preview attempt → delete confirm.
7. `npm run preview` for session cookie + local D1 on Workers; apply migrations locally if needed.
8. Update **Current Status**, tick **Acceptance Criteria** only when proven, and add **Troubleshooting Guide** entries for real failures.

**Deliverables**:

- Module ready for a later quiz-set sprint to depend on
- Written verification; open gaps listed honestly
- After user review: local deploy (`npm run preview` and related checks)
- After approval: push to the feature branch
- `npm run deploy` to Cloudflare **only** if the user gives explicit confirmation after this review (or later)

**Maps to**: US-MCQ-10, quality Acceptance Criteria, NFR-MCQ-R02, NFR-MCQ-R03

**Phase gate**: After user review of Phase 5, local deploy (`npm run preview` and related checks). After approval, push to the feature branch. Cloudflare `npm run deploy` only if the user gives explicit confirmation.

---

## Technical Implementation Details

Fill this section during implementation. The following is the **intended** layout so agents do not invent a second structure. If files already exist as scaffolding, align them to this PRD with tests; do not add a parallel MCQ module.

### Key files (intended)

Phase 1 (present):

- `migrations/0003_create_mcq_tables.sql` — D1 schema (`mcq_questions`, `mcq_choices`, `mcq_attempts`); applied locally
- `src/lib/mcq/store.ts` — Records and `McqStore` interface (mirror `src/lib/auth/store.ts`)
- `src/lib/mcq/messages.ts` — User-facing strings from this PRD
- `src/lib/mcq/messages.test.ts` — Copy contract
- `src/lib/mcq/validation.ts` — Zod parse, `validateMcqInput`, `validateAttemptInput`
- `src/lib/mcq/validation.test.ts` — Field rules and parsers
- `src/lib/mcq/paths.ts` — Canonical MCQ routes
- `src/lib/mcq/paths.test.ts` — Dashboard-nested create/edit/preview paths

Phase 2 (present):

- `src/lib/services/mcq.ts` — create, list, get, update, delete, preview, and attempts with ownership
- `src/lib/services/mcq.test.ts` — In-memory store coverage for CRUD, preview, and attempts
- `src/lib/services/d1-mcq-store.ts` — D1 implementation (`?1`, `?2`)
- `src/lib/db.ts` — `getMcqStore()` next to `getAuthStore()`
- `src/lib/mcq/in-memory-store.ts` — Test store

Phase 3 (present):

- `src/lib/mcq/http.ts` — Session-aware HTTP status mapping over the MCQ service
- `src/lib/mcq/http.test.ts` — 401 / 400 / 404 / 200 / 201 / 204
- `src/app/actions/mcq.ts` — Server Actions
- `src/app/api/mcq/route.ts` — GET list, POST create
- `src/app/api/mcq/[id]/route.ts` — GET / PUT / DELETE
- `src/app/api/mcq/[id]/preview/route.ts` — GET preview
- `src/app/api/mcq/[id]/attempts/route.ts` — GET list, POST attempt

Later phases (not built in Phase 3):
- (none remaining for UI pages; Phase 5 is verification)

Phase 4 (present):

- `src/components/mcq/mcq-app-shell.tsx` — Dashboard chrome
- `src/components/mcq/mcq-list.tsx` — Table, empty state, New button
- `src/components/mcq/mcq-row-actions.tsx` — Three-dot menu and delete dialog
- `src/components/mcq/mcq-form.tsx` — Create/edit form
- `src/components/mcq/mcq-preview-form.tsx` — Attempt surface
- `src/app/mcq-dashboard/page.tsx` — List
- `src/app/mcq-dashboard/new/page.tsx` — Create
- `src/app/mcq-dashboard/[id]/edit/page.tsx` — Edit
- `src/app/mcq-dashboard/[id]/preview/page.tsx` — Preview

Colocated `*.test.ts` / `*.test.tsx` for validation, service, routes, and UI.

### Implementation patterns

```typescript
// Pattern (illustrative): service owns rules; store persists.
// listMcqsForUser(store, userId)
// createMcq(store, userId, input) -> validateMcqInput then insert
// getMcqForOwner(store, userId, id) -> null if missing or other owner
// previewMcqForOwner(...) -> choices without isCorrect
// recordAttempt(store, userId, mcqId, choiceId) -> persist isCorrect snapshot
```

- Prepared statements with `?1`, `?2`.
- Ownership checks in the service, not in React.
- Tests mock stores; they do not call live D1.
- Browser mutations go through Server Actions; HTTP routes are thin JSON adapters over the same service.

### Important notes

- `npm run dev` will not catch all Workers/D1 issues; use `npm run preview`.
- Cloud agents have no Cloudflare credentials and no `.dev.vars`; they must not try to authenticate Wrangler.
- Do not edit generated files (`cloudflare-env.d.ts`, `package-lock.json` by hand for unrelated reasons).
- Ask before adding npm dependencies.
- Do not hand-edit generated shadcn primitives unless the user asks for a design-system change.

---

## Acceptance Criteria

A criterion is met only when it is demonstrated (tests and, for UI, a real browser flow), not when the page merely exists.

### List and create

- [ ] Signed-in user sees **New Multiple Choice Question** on `/mcq-dashboard`.
- [ ] Clicking it opens the create page.
- [ ] Create collects name, description, and 2–6 choices with exactly one correct.
- [ ] Invalid create shows the specified messages and inserts no rows.
- [ ] Save redirects to the list; the table shows name and description.
- [ ] Cancel returns to the list without persisting.

### Edit, preview, delete

- [ ] Three-dot menu per row contains Edit, Preview, and Delete.
- [ ] Edit loads the owner’s question and choices; Save updates and returns to the list.
- [ ] Preview hides which choice is correct until an answer is submitted.
- [ ] Submitting a preview answer stores user id, choice id, and correctness.
- [ ] Preview shows “Correct.” or “Incorrect.” after submit.
- [ ] Delete confirms, then removes the question (and cascaded choices/attempts) for the owner only.

### API and service

- [ ] Endpoints exist for create, retrieve, update, delete, list, preview, and attempts as specified.
- [ ] Unauthenticated API calls return 401 with “Sign in required.”
- [ ] Unowned or unknown ids return 404 with “Multiple choice question not found.”
- [ ] Validation, CRUD, service, and attempts are covered by tests.

### Auth unchanged

- [ ] Signed-out users cannot see MCQ pages (redirect to Sign In, no content flash).
- [ ] Sign Up, Sign In, Sign Out, and session cookie behaviour are unchanged.
- [ ] `users` and `sessions` tables are not redesigned.

### Quality

- [ ] TDD order was followed (Phases 1–5).
- [ ] `npm run lint` and `npm run build` succeed.
- [ ] Session and D1 behaviour checked with `npm run preview` where possible.
- [ ] Each completed phase was reviewed, then locally deployed, then pushed to the feature branch only after approval.
- [ ] Cloudflare `npm run deploy` was not run without explicit confirmation.
- [ ] No quiz-set, report, or second auth system shipped in this feature.

---

## Success Metrics

| Metric | Target | How Measured |
| --- | --- | --- |
| Create-to-list round trip | User sees the new row after Save without signing in again | Automated + browser |
| Validation catch rate | Invalid MCQs never inserted | Service tests |
| Choice bounds | Questions with fewer than 2 or more than 6 choices never stored | Service tests |
| Attempt integrity | Every stored attempt has user, choice (or null after choice delete), and correctness | Service tests |
| Session reuse | No second login system | Auth PRD still holds |
| Engineering health | Lint and production build clean | `npm run lint`, `npm run build` |

---

## Dependencies

### External dependencies

- **Cloudflare D1** (`DB` binding, database `quizmaker`) — persist questions, choices, attempts.
- **Cloudflare Workers / Wrangler** — runtime, local preview, local migrations.
- Existing session secret `SESSION_SECRET` — unchanged.

### Internal dependencies

- `getCurrentUser` / auth store — session identity.
- Authentication Technical PRD — redirects, cookie flags, protected pages.
- shadcn/ui already in the repo (`table`, `button`, `card`, `field`, `input`, `dialog`, …).
- Vitest + Testing Library.
- Zod.

No new npm runtime libraries are required. Adding shadcn source files (`dropdown-menu`, `textarea`) is allowed via the project’s shadcn CLI convention.

### Environment variables

None new. Continue to use `SESSION_SECRET` and `NEXTJS_ENV` as in the Authentication PRD.

---

## Risks and Mitigation

### Technical risks

- **Risk**: Foreign keys disabled in a local SQLite file.  
  **Mitigation**: Declare FKs in the migration; service still validates 2–6 choices and ownership.

- **Risk**: Preview leaking `isCorrect` through the retrieve API.  
  **Mitigation**: Preview page and `/preview` omit the flag; retrieve remains owner-only for editing.

- **Risk**: Client-only route guards flash private MCQ content.  
  **Mitigation**: Same as auth — `getCurrentUser()` on the server before render.

- **Risk**: Editing choices orphans attempt `choice_id`.  
  **Mitigation**: `ON DELETE SET NULL`; persist `is_correct` on the attempt at insert time.

- **Risk**: New libraries break the teaching-repo rule or Workers.  
  **Mitigation**: Propose each dependency; prefer existing shadcn and Web Crypto.

### User experience risks

- **Risk**: Accidental delete.  
  **Mitigation**: Confirm dialog before Delete.

- **Risk**: Users expect a full quiz of many questions.  
  **Mitigation**: Scope is one MCQ at a time; quiz sets are a later PRD.

- **Risk**: Users expect to stay on the create page after save.  
  **Mitigation**: This PRD requires redirect to the list after save.

---

## Future Enhancements

Not in this sprint:

- Multi-question quizzes and sharing
- Teacher vs learner roles and attempting another user’s bank
- Attempt history UI and reports
- Timed attempts and attempt limits
- Multiple correct choices
- AI-generated questions
- Auth enhancements listed in the Authentication PRD (password reset, MFA, etc.)

---

## Troubleshooting Guide

Populate during implementation when real failures appear.

### D1 table missing locally

**Problem**: Queries fail with `no such table: mcq_questions`.  
**Cause**: MCQ migration not applied to local D1.  
**Solution**: `npx wrangler d1 migrations apply quizmaker --local`  
**Code reference**: `migrations/` MCQ migration file

### Signed-in list still empty after Save

**Problem**: Insert succeeded but list is empty.  
**Cause**: `user_id` mismatch or a different D1 file (`dev` vs `preview`).  
**Solution**: Confirm the same Wrangler local DB; list filters on session user id.

### Preview shows the correct answer

**Problem**: Correct choice is visually marked before submit.  
**Cause**: UI used retrieve (`McqDetail`) instead of preview DTO.  
**Solution**: Preview page must call preview service/endpoint that omits `isCorrect`.

---

## Notes for AI Agents

When working with this PRD:

1. Read **Overview / Problem**, **Hypothesis**, and **Sprint Goal** first. Then read the Authentication Technical PRD. Do not rebuild Sign Up / Sign In / sessions.
2. Treat **Scope** as a hard boundary. Do not build Out of Scope or Cut items (no quiz sets, no reports, no second auth).
3. Implement in **Phases 1–5** only as specified. Follow **TDD**: failing tests from this document’s rules, then code. Run `npm test`.
4. After **each** phase: **stop for user review**. Then **local deploy** (`npm run preview` and related checks). After **approval**, **push** to the **feature branch**. Do **not** run `npm run deploy` (Cloudflare) unless the user gives **explicit confirmation**. Review, local preview, and feature-branch push do not authorise production deploy.
5. Use the **Error Messages** and **Success Messages** tables as the copy contract.
6. Put domain logic in the MCQ **service**. HTTP routes and Server Actions stay thin.
7. Use shadcn `Table` and `DropdownMenu` for the list; do not invent a different table/menu.
8. Keep **Implementation Phases**, **Technical Implementation Details**, and **Current Status** accurate as work proceeds.
9. Tick **Acceptance Criteria** only when tests and behaviour prove them.
10. Add **Troubleshooting Guide** entries when bugs are found and fixed.
11. Follow `AGENTS.md`: no remote database changes unless the user runs them, ask before adding dependencies, do not edit generated files.
12. This document is the contract. Partial files in the repo are not a licence to skip tests or to diverge from these routes, messages, or schema.

---

## Current Status

**Last Updated**: 2026-09-02  
**Current Phase**: Phase 4 COMPLETED (user reviewed; local deploy; pushed to feature branch). Phase 5 PLANNED.  
**Status**: Phase 4 approved. Cloudflare production deploy was not run.  
**Implementation**: List table with New button and three-dot Edit / Preview / Delete; create and edit form with Save / Cancel; preview attempt surface. Unowned edit/preview ids redirect to the list.  
**Tests**: `npm test` — 16 files, 106 tests passed.  
**Release gates**: Phase 4 locally deployed and pushed to `feature/mcq-crud` after approval. Cloudflare production deploy only after explicit confirmation.  
**Depends on**: Phase 3 COMPLETED.  
**Next Steps**: Phase 5 — access control, accessibility, hardening, and verification.

**Out of this module**: Multi-question quizzes, reports, roles, unsolicited Cloudflare deploy, and any change to Sign Up / Sign In / Sign Out / sessions.
