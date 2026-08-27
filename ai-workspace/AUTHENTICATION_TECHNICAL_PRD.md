Date created: 2026-08-27
Date last modified: 2026-08-27

# Authentication Technical PRD

**Document type**: Technical Product Requirements Document  
**Project**: Quiz Maker  
**Sprint**: Authentication (Sprint 0 design complete; implementation and Cloudflare deploy complete)  
**Audience**: Developers, reviewers, and AI-driven workflows for all future sprints  
**Status**: IMPLEMENTED AND DEPLOYED — this document remains the behaviour contract

This document is the source of truth for the Authentication module. It follows `ai-workspace/TEMPLATE_TECHNICAL_PRD.md` and is the primary reference for later AI Sprints. Later sprints must read this document before writing tests or code.

Do not rebuild Sign Up, Sign In, Sign Out, or sessions as a second system. Extend this module. Quiz features remain out of scope here.

---

## Overview / Problem

Quiz Maker is a web application for creating, managing, and attempting quizzes, and for viewing results across the quiz lifecycle. None of those product features can be trusted until the application can identify who is using it.

Today the application has an email-and-password authentication foundation: visitors can register, sign in, remain signed in until they sign out, and cannot open the Dashboard without a session. Later sprints can attach quizzes, attempts, and reports to that known user.

Sprint 0 designed this identity layer. Implementation followed this PRD with TDD and deployed the Worker to Cloudflare.

---

## Project Overview

Quiz Maker is a web-based application. Over time it will let users create quizzes, manage quizzes, attempt quizzes, and track results.

The Authentication Module is implemented. The intended outcome of this module is:

- A visitor can create an account (Sign Up).
- A registered user can authenticate (Sign In).
- An authenticated user can end the session (Sign Out).
- The application can keep that user signed in until they sign out.
- Pages that require a signed-in user are blocked from everyone else.

This authentication layer is the foundation for every later Quiz Maker feature. It must be designed so later sprints can depend on a stable user identity without redesigning sign-up, sign-in, or session behaviour.

### Current application state

- Next.js 16 (App Router) and React 19.
- Hosted on Cloudflare Workers through `@opennextjs/cloudflare`.
- **Cloudflare D1** stores users and sessions (binding `DB`, database `quizmaker`).
- Tailwind CSS v4 and shadcn/ui (Base UI, `base-nova`).
- TypeScript in strict mode.
- **Zod** parses Sign Up and Sign In form input.
- **Vitest** and Testing Library cover validation, auth services, and form behaviour (`npm test`).
- Passwords are hashed with **PBKDF2-SHA256** via Web Crypto. Sessions are server-side D1 rows plus a signed HttpOnly cookie (`qm_session`).
- Pages: `/` (redirects by session), `/sign-up`, `/sign-in`, `/dashboard` (protected).
- Sign Up and Sign In share a Tailwind `AuthShell` (centered card, wordmark, footer links). Dashboard has a header with identity and Sign Out.
- Production Worker: `https://quizmaker.es-quizmaker.workers.dev`
- No AI SDK is installed. Quiz features are not built.

### Primary user for this sprint

Any person who will later create or attempt quizzes. In this sprint they are treated as a single user type: an **Account Holder**. There are no roles, plans, or permissions beyond “signed in” and “signed out”.

---

## Business Goal

Establish a trustworthy user identity layer so Quiz Maker can later store, retrieve, and protect each user’s quiz work.

Without authenticated accounts, the product cannot:

- Attribute a quiz to its author.
- Restrict a user’s results to that user.
- Prevent one person from acting as another.

Authentication is therefore a business prerequisite, not an optional extra.

---

## Hypothesis

We believe that a simple, well-validated email-and-password authentication flow with durable server-side sessions will give Quiz Maker a secure identity foundation that later features can reuse without redesign.

---

## Sprint Goal

Sprint 0 **designed** the authentication feature before development started. That design is this PRD.

Implementation then delivered:

- User Sign Up
- User Sign In
- Sign Out
- User session management
- The basic authentication flow
- Protected-page redirects for unauthenticated users
- Proof via Test-Driven Development (TDD)
- Local Node, local Workers preview, and Cloudflare deploy

Later sprints must follow the behaviour in this PRD. They must not replace this identity model.

---

## Assumptions

1. Users register and sign in with email and password only. There is no social login, SSO, or magic link in this sprint.
2. One email address maps to one account. Email uniqueness is enforced in a case-insensitive way after trimming spaces.
3. After a successful Sign Up, the user is **not** signed in automatically. They must Sign In.
4. After a successful Sign In, the user is taken to a Dashboard. In this sprint the Dashboard is a protected landing page only. It does not contain quiz features.
5. A session remains valid until the user signs out, or until the session is otherwise invalidated for security. This sprint does not add an idle timeout or “remember me” checkbox.
6. There is a single user type. There is no administrator role, teacher role, or student role yet.
7. Users have access to a modern browser and a stable internet connection.
8. Email delivery is not available in this sprint. The application does not send confirmation, welcome, or password-reset emails.
9. Storage (D1), sessions (HttpOnly cookie + D1), Zod, and Vitest are in the repository. Further dependencies still need to be proposed first.
10. English is the only language for labels, validation, and errors in this sprint.
11. The Sign Up and Sign In experiences are public pages. The Dashboard is a protected page.
12. “Current application” means this Quiz Maker repository on the stack described in `AGENTS.md`.

---

## Scope

### In Scope

- Sign Up with First Name, Last Name, Email Address, Password, and Confirm Password.
- Password must be hashed.
- All Sign Up field validations listed in this document, including unique email.
- Blocking Sign Up submission until every validation rule passes.
- Inline validation errors next to the relevant field.
- Redirect to the Sign In page after successful registration.
- Sign In with Email and Password.
- Credential validation and clear, safe error messages for failed login.
- Redirect to the Dashboard after successful login.
- Session that keeps the user signed in across page loads until logout.
- Sign Out that clears the session and redirects to Sign In.
- Restriction of protected pages to authenticated users.
- Redirect of unauthenticated users from protected pages to Sign In.
- Redirect of already-authenticated users away from Sign Up and Sign In to the Dashboard.
- A minimal protected Dashboard that confirms the user is signed in and offers Sign Out.
- Accessibility, security, and performance requirements for these pages and flows.
- A TDD plan that later implementation sprints must follow.
- Local verification of the authentication flow on Node (`npm run dev`) and on the local Cloudflare Workers runtime (`npm run preview`).
- A Cloudflare production deployment procedure for the authentication module, executed only when the user explicitly asks to deploy.

### Out of Scope

The following are **not** part of Sprint 0 and must not be designed or built as if they were:

- Quiz creation
- Quiz management
- Quiz attempts
- Reports, scores, leaderboards, or analytics
- User profile editing after registration
- Password reset or “forgot password”
- Email verification
- Multi-factor authentication
- Social login, OAuth, SSO, or passkeys
- Roles, permissions, or organisation accounts
- Account lockout after failed attempts (may be added later; see Future Enhancements)
- Account deletion
- Changing email or password from a settings page
- “Remember me” / stay signed in checkbox
- Terms of service or privacy-policy acceptance checkbox
- Avatar or profile photo
- Internationalisation / multiple languages
- Mobile native apps

### Cut

Items considered during planning and deliberately removed from this sprint:

- **Automatic sign-in after registration** — Cut so the Sign In path is always exercised and so a newly created account is confirmed by an explicit login.
- **Email verification before first login** — Cut because this sprint has no email-sending capability and the required flow is Sign Up → Sign In.
- **Idle session timeout** — Cut because the stated requirement is to maintain the session until logout. Timeout can be added later without changing the Sign Up / Sign In pages.
- **Password-reset flow** — Cut to keep Sprint 0 to the basic authentication lifecycle.
- **Social login** — Cut to avoid third-party identity complexity before the local account model is proven.
- **Role-based access** — Cut because Quiz Maker does not yet distinguish teachers from learners.

---

## User Stories

Each story is written from the Account Holder’s point of view. Acceptance of a story requires the matching Acceptance Criteria later in this document.


| ID    | Story                                                                                                                                                                     | Priority |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| US-01 | As a new user, I want to create an account with my name, email, and password so that I can use Quiz Maker in later sprints.                                               | Must     |
| US-02 | As a new user, I want immediate, field-level validation so that I can correct mistakes before the account is created.                                                     | Must     |
| US-03 | As a new user, I want to be told if my email is already registered so that I can sign in instead of creating a duplicate account.                                         | Must     |
| US-04 | As a newly registered user, I want to land on the Sign In page so that I can authenticate with the account I just created.                                                | Must     |
| US-05 | As a registered user, I want to sign in with my email and password so that I can reach my Dashboard.                                                                      | Must     |
| US-06 | As a registered user, I want a clear error when my login details are wrong so that I know the sign-in failed without guessing what the application did.                   | Must     |
| US-07 | As a signed-in user, I want my session to continue until I sign out so that I do not have to log in on every page.                                                        | Must     |
| US-08 | As a signed-in user, I want to sign out so that no one else using the same browser can act as me.                                                                         | Must     |
| US-09 | As a signed-in user, I want protected pages to be available only to me when I am authenticated.                                                                           | Must     |
| US-10 | As a visitor who is not signed in, I want to be sent to Sign In if I try to open a protected page so that I am not shown private content.                                 | Must     |
| US-11 | As a signed-in user, I want Sign Up and Sign In to send me to the Dashboard so that I am not asked to authenticate again.                                                 | Must     |
| US-12 | As a user, I want the authentication pages to be usable with keyboard, screen reader, and sufficient contrast so that I can complete the flow regardless of how I browse. | Must     |


---

## User Flow

### 1. New user — Sign Up then Sign In

1. The user opens the application while signed out.
2. The user is directed to Sign In (or opens Sign Up from a link on Sign In).
3. The user opens the Sign Up page.
4. The user enters First Name, Last Name, Email Address, Password, and Confirm Password.
5. The application validates every field. Invalid fields show inline errors. The account is not created.
6. When all rules pass, the user submits Sign Up.
7. The application creates the account and does **not** start a session.
8. The user is redirected to the Sign In page and sees a success message that the account was created.
9. The user enters Email and Password and submits Sign In.
10. If credentials are valid, a session starts and the user is redirected to the Dashboard.
11. If credentials are invalid, the user stays on Sign In and sees a login error.

### 2. Returning user — Sign In

1. The user opens the application while signed out.
2. The user is on (or is sent to) the Sign In page.
3. The user enters Email and Password and submits.
4. Valid credentials start a session and open the Dashboard.
5. Invalid credentials keep the user on Sign In with an error.

### 3. Authenticated user — Session and Sign Out

1. The signed-in user navigates within the application, including a full page reload.
2. The session is still valid, so protected pages remain available.
3. The user chooses Sign Out.
4. The session is cleared.
5. The user is redirected to Sign In.
6. Opening a protected page now redirects to Sign In again.

### 4. Unauthenticated access to a protected page

1. A signed-out user requests a protected page (for example Dashboard, or a later quiz page that uses the same rule).
2. The application does not show the protected content.
3. The user is redirected to Sign In.

---

## Navigation Flow

Public pages (no session required):

- Sign In
- Sign Up

Protected pages (session required):

- Dashboard (the only protected page in this sprint)

Navigation rules:


| Starting point                               | User state                           | Destination  |
| -------------------------------------------- | ------------------------------------ | ------------ |
| Application root                             | Signed out                           | Sign In      |
| Application root                             | Signed in                            | Dashboard    |
| Sign In                                      | Signed out                           | Sign In page |
| Sign In                                      | Signed in                            | Dashboard    |
| Sign Up                                      | Signed out                           | Sign Up page |
| Sign Up                                      | Signed in                            | Dashboard    |
| Dashboard                                    | Signed out                           | Sign In      |
| Dashboard                                    | Signed in                            | Dashboard    |
| Any future protected page                    | Signed out                           | Sign In      |
| Sign In → “Create an account”                | Signed out                           | Sign Up      |
| Sign Up → “Already have an account? Sign in” | Signed out                           | Sign In      |
| Successful Sign Up                           | Signed out (new account, no session) | Sign In      |
| Successful Sign In                           | Signed in                            | Dashboard    |
| Sign Out                                     | Session cleared                      | Sign In      |


There is no navigation in this sprint to quiz creation, quiz lists, attempts, or reports.

Logical page names for later implementation (not a folder structure):

- **Sign In page**
- **Sign Up page**
- **Dashboard page** (protected placeholder)

---

## Authentication Flow

### Sign Up

1. User submits First Name, Last Name, Email Address, Password, and Confirm Password.
2. Client-side validation runs for required fields, email format, password rules, and password match.
3. If any client-side rule fails, submission is blocked and inline errors are shown. No account is created.
4. If client-side rules pass, the server repeats the same validation. The server is the authority.
5. The server checks that the email is not already registered (trimmed, case-insensitive).
6. If the email is taken, Sign Up fails with the duplicate-email error on the email field. No account is created. The user is not signed in.
7. If the email is free and all rules pass, the account is stored with a **hashed** password. The original password is never stored.
8. No session is created.
9. The user is redirected to Sign In with a success message.

### Sign In

1. User submits Email and Password.
2. Empty or malformed fields fail with inline errors. Submission does not proceed until those field rules pass.
3. The server looks up the account and verifies the password against the stored hash.
4. If the email is unknown or the password does not match, Sign In fails with a **single generic error**. The response must not reveal whether the email exists.
5. If verification succeeds, the application creates a session, stores it so later requests can recognise the user, and sets a secure session cookie.
6. The user is redirected to the Dashboard.

### Session

1. After Sign In, each later request for a protected page includes the session.
2. The application resolves the session to a signed-in user.
3. If the session is missing, invalid, or expired, the user is treated as signed out.
4. The session remains valid until Sign Out or until it is invalidated for security.
5. The session must not be readable or writable from client-side JavaScript.

### Sign Out

1. The signed-in user triggers Sign Out from the Dashboard (and from any later authenticated chrome that reuses this action).
2. The server invalidates the session so it cannot be reused.
3. The session cookie is cleared.
4. The user is redirected to Sign In.
5. A subsequent request to a protected page is treated as unauthenticated.

### Route protection

1. Every protected page checks for a valid session **on the server** before rendering private content.
2. Client-only hiding of UI is not sufficient protection.
3. Unauthenticated access redirects to Sign In.
4. After Sign In, the user may be returned to the Dashboard. Returning to a deep link is a future enhancement; this sprint always lands on Dashboard after login.

---

## Functional Requirements


| ID    | Requirement                                                                                                                      |
| ----- | -------------------------------------------------------------------------------------------------------------------------------- |
| FR-01 | The application shall provide a Sign Up page that collects First Name, Last Name, Email Address, Password, and Confirm Password. |
| FR-02 | All Sign Up fields shall be required.                                                                                            |
| FR-03 | Sign Up shall reject an email that is not in a valid format.                                                                     |
| FR-04 | Sign Up shall reject an email that is already registered.                                                                        |
| FR-05 | Sign Up shall reject a password that does not meet length and complexity rules.                                                  |
| FR-06 | Sign Up shall reject a Confirm Password value that does not exactly match Password.                                              |
| FR-07 | Sign Up shall not submit or create an account while any validation rule fails.                                                   |
| FR-08 | Sign Up validation errors shall appear inline on the relevant field.                                                             |
| FR-09 | Successful Sign Up shall create exactly one account and shall not start a session.                                               |
| FR-10 | Successful Sign Up shall redirect to the Sign In page and show a success message.                                                |
| FR-11 | The application shall provide a Sign In page that collects Email and Password.                                                   |
| FR-12 | Sign In shall validate that Email and Password are present and that Email is in a valid format before credential checks.         |
| FR-13 | Sign In shall accept only a registered email paired with the correct password.                                                   |
| FR-14 | Failed Sign In shall show a meaningful error and shall not start a session.                                                      |
| FR-15 | Successful Sign In shall start a session and redirect to the Dashboard.                                                          |
| FR-16 | The session shall identify the signed-in user on later requests until Sign Out.                                                  |
| FR-17 | The application shall provide Sign Out.                                                                                          |
| FR-18 | Sign Out shall invalidate the session, clear the session cookie, and redirect to Sign In.                                        |
| FR-19 | Protected pages shall be available only to authenticated users.                                                                  |
| FR-20 | Unauthenticated requests to protected pages shall redirect to Sign In and shall not leak protected content.                      |
| FR-21 | Authenticated users who open Sign Up or Sign In shall be redirected to the Dashboard.                                            |
| FR-22 | The Dashboard shall confirm that the user is signed in (at least first name or email) and shall offer Sign Out.                  |
| FR-23 | Passwords shall never be stored, logged, or displayed in recoverable form.                                                       |
| FR-24 | Validation shall run on the server even if the client already validated.                                                         |
| FR-25 | Email uniqueness checks shall ignore surrounding spaces and letter case.                                                         |


---

## Authentication Requirements


| ID    | Requirement                                                                                                                                                                                                       |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AR-01 | Authentication method is email plus password only.                                                                                                                                                                |
| AR-02 | Credentials are verified only on the server.                                                                                                                                                                      |
| AR-03 | Password at rest is a one-way hash using a modern, slow hashing algorithm. Plain text and reversible encryption are forbidden.                                                                                    |
| AR-04 | Password comparison must be resistant to simple timing leaks (use the platform’s constant-time verify for hashes).                                                                                                |
| AR-05 | Session identifier must be unguessable, stored server-side or in an equivalent secure session store, and sent to the browser only in a cookie.                                                                    |
| AR-06 | Session cookie flags: `HttpOnly`, `Secure` in production, `SameSite=Lax` (or stricter). Path limited to the application.                                                                                          |
| AR-07 | Sign Out must invalidate the server session, not only delete the cookie in the browser.                                                                                                                           |
| AR-08 | A signed-out user must not be able to reuse the old session identifier.                                                                                                                                           |
| AR-09 | Failed Sign In must use one generic credential error. Do not say “email not found” or “incorrect password” as separate messages.                                                                                  |
| AR-10 | Do not echo the submitted password back in errors, logs, or HTML.                                                                                                                                                 |
| AR-11 | Sign Up must not authenticate the new user.                                                                                                                                                                       |
| AR-12 | Only one active product session model is required in this sprint (one session per successful Sign In). Concurrent-device policy is not specified beyond “session lasts until logout”.                             |
| AR-13 | Protected-page checks must happen before protected content is rendered.                                                                                                                                           |
| AR-14 | CSRF: state-changing Sign Up, Sign In, and Sign Out actions must be protected by the framework’s request-forgery defences (for example origin checks / anti-CSRF tokens used by Server Actions).                  |
| AR-15 | Input must be treated as untrusted. Trim user-facing name and email fields. Do not execute or store unsanitised HTML from these fields.                                                                           |
| AR-16 | Rate limiting of Sign In (and preferably Sign Up) is a security goal. If the implementation sprint cannot add a limiter without a new dependency, the gap must be recorded in Current Status rather than ignored. |


---

## UI Requirements

UI here means **page content, fields, copy, and behaviour**. It does not prescribe components, file names, or visual mock implementations. 

### Sign Up page

Purpose: register a new Account Holder.

The page shall include:

- A clear title, for example **Create an account**.
- Short supporting text that this account is for Quiz Maker.
- The five fields listed under Input Fields.
- A primary submit control labelled **Sign up**.
- A navigation link to Sign In, labelled in plain language, for example **Already have an account? Sign in**.
- Inline error text under each invalid field.
- A form-level error area for unexpected failures (for example a temporary system error).

Behaviour:

- Submit is blocked while client-side validation fails.
- Password and Confirm Password are masked by default.
- The submit control shows a busy/disabled state during submission and is not double-submitted.
- After success, the user does not remain on Sign Up; they go to Sign In.

### Sign In page

Purpose: authenticate an existing Account Holder.

The page shall include:

- A clear title, for example **Sign in**.
- Email and Password fields.
- A primary submit control labelled **Sign in**.
- A navigation link to Sign Up, for example **Need an account? Sign up**.
- After a successful registration, a success message on this page (see Success Messages).
- Inline errors for empty/invalid email and empty password.
- A form-level error for invalid credentials.

Behaviour:

- Submit is blocked while required Sign In field rules fail.
- Password is masked by default.
- The submit control shows a busy/disabled state during submission.
- After success, the user goes to the Dashboard.
- After failure, the user stays on Sign In. The password field may be cleared; the email may remain.

### Dashboard page (this sprint only)

Purpose: prove that the session works and provide Sign Out. This is not a quiz workspace.

The page shall include:

- A title, for example **Dashboard**.
- A short welcome that includes the user’s first name or email.
- A **Sign out** control.

The Dashboard shall not include quiz creation, quiz lists, attempts, or reports.

### Shared UI rules

- Every input has a visible label. Placeholder text is not a substitute for a label.
- Errors are associated with the field they describe so assistive technology can announce them.
- Focus moves to the first invalid field on failed submit, or the error summary is announced.
- Pages work at a typical laptop width and a typical mobile width.
- Use the existing design system (Tailwind theme tokens and shadcn/ui patterns). Do not invent a parallel visual language.

---

## Input Fields

### Sign Up


| Field            | Required | Type     | Notes                                                                                    |
| ---------------- | -------- | -------- | ---------------------------------------------------------------------------------------- |
| First Name       | Yes      | Text     | Trim leading and trailing spaces.                                                        |
| Last Name        | Yes      | Text     | Trim leading and trailing spaces.                                                        |
| Email Address    | Yes      | Email    | Trim spaces. Store and compare in a canonical form (trim + case-insensitive uniqueness). |
| Password         | Yes      | Password | Never displayed in clear text by default. Never returned in a later response.            |
| Confirm Password | Yes      | Password | Used only to confirm Password. Not stored.                                               |


### Sign In


| Field    | Required | Type     | Notes              |
| -------- | -------- | -------- | ------------------ |
| Email    | Yes      | Email    | Trim spaces.       |
| Password | Yes      | Password | Masked by default. |


### Display-only (Dashboard)


| Item             | Required | Notes                                               |
| ---------------- | -------- | --------------------------------------------------- |
| Welcome identity | Yes      | First name and/or email from the signed-in account. |
| Sign out         | Yes      | Ends the session.                                   |


---

## Field Validation Rules

Validation runs on the client for fast feedback and **again on the server** as the source of truth.

### Shared rules

- “Required” means the value is present after trimming spaces (except Password and Confirm Password, which must not be trimmed in a way that changes the secret; they must be non-empty as entered).
- Multiple errors on one field: show the first applicable error in the order listed below, or show all that apply as long as the message is still readable. Prefer one clear message per field.

### Sign Up — First Name

1. Required. After trim, length at least 1.
2. Maximum length 50 characters after trim.
3. Letters, spaces, hyphen, and apostrophe are allowed. Reject other characters.

### Sign Up — Last Name

1. Required. After trim, length at least 1.
2. Maximum length 50 characters after trim.
3. Letters, spaces, hyphen, and apostrophe are allowed. Reject other characters.

### Sign Up — Email Address

1. Required.
2. Valid format. Must match a practical email pattern, illustrated by `user@example.com` (local part, `@`, domain with a dot).
3. Maximum length 254 characters.
4. Unique among registered accounts, compared after trim and without regard to letter case (`Alex@Example.com` and `alex@example.com` are the same email).

### Sign Up — Password

1. Required.
2. Minimum length 8 characters.
3. At least one uppercase letter (A–Z).
4. At least one lowercase letter (a–z).
5. At least one number (0–9).
6. At least one special character from:
  `! @ # $ % ^ & * ( ) _ + - = [ ] { } ; : ' " , . < > / ? \ | \` ~`
7. Maximum length 128 characters (protects against oversized payloads; still allows a strong passphrase).

Password rules 3–6 may be reported as a single complexity message if more than one class is missing.

### Sign Up — Confirm Password

1. Required.
2. Must match Password exactly, including letter case and spaces.

### Sign Up — Form

- The account is created only when every field rule passes and the email is unique.
- Client-side success does not skip server-side uniqueness and complexity checks.

### Sign In — Email

1. Required.
2. Valid format (same rule as Sign Up email format).

### Sign In — Password

1. Required.

### Sign In — Credentials

- Evaluated only after Email and Password field rules pass.
- Success: email exists and password matches the stored hash.
- Failure: any other outcome (unknown email, wrong password). Use the generic credentials error. Do not create a session.

---

## Error Messages

Use these exact user-facing strings unless a later sprint records a copy change in this PRD.

### Sign Up — field errors


| Condition                     | Message                                                                                                           |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| First Name missing            | First name is required.                                                                                           |
| First Name too long           | First name must be 50 characters or fewer.                                                                        |
| First Name invalid characters | First name can include letters, spaces, hyphens, and apostrophes only.                                            |
| Last Name missing             | Last name is required.                                                                                            |
| Last Name too long            | Last name must be 50 characters or fewer.                                                                         |
| Last Name invalid characters  | Last name can include letters, spaces, hyphens, and apostrophes only.                                             |
| Email missing                 | Email address is required.                                                                                        |
| Email invalid format          | Enter a valid email address (for example, [user@example.com](mailto:user@example.com)).                           |
| Email too long                | Email address is too long.                                                                                        |
| Email already registered      | An account with this email already exists. Sign in instead.                                                       |
| Password missing              | Password is required.                                                                                             |
| Password too short            | Password must be at least 8 characters.                                                                           |
| Password too long             | Password must be 128 characters or fewer.                                                                         |
| Password missing complexity   | Password must include at least one uppercase letter, one lowercase letter, one number, and one special character. |
| Confirm Password missing      | Confirm password is required.                                                                                     |
| Confirm Password mismatch     | Passwords do not match.                                                                                           |


### Sign In — field and form errors


| Condition                       | Message                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------- |
| Email missing                   | Email is required.                                                                      |
| Email invalid format            | Enter a valid email address (for example, [user@example.com](mailto:user@example.com)). |
| Password missing                | Password is required.                                                                   |
| Unknown email or wrong password | Invalid email or password.                                                              |


### System errors (both pages)


| Condition                                 | Message                                 |
| ----------------------------------------- | --------------------------------------- |
| Unexpected server or availability failure | Something went wrong. Please try again. |


System errors are form-level, not attached to a single field. They must not include stack traces, SQL, or internal identifiers.

---

## Success Messages


| Event           | Message                                            | Where it appears                           |
| --------------- | -------------------------------------------------- | ------------------------------------------ |
| Account created | Account created. Please sign in.                   | Sign In page, after redirect from Sign Up  |
| Signed in       | None required. The Dashboard is the success state. | Dashboard                                  |
| Signed out      | You have been signed out.                          | Sign In page, after redirect from Sign Out |


Success copy must not include the password. It may include the email on Sign In only if needed; default is not to repeat the email in the success banner.

---

## Security Requirements

These requirements sit with Authentication Requirements and Non-Functional Requirements. They are listed here so implementation sprints cannot treat security as optional.


| ID    | Requirement                                                                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SR-01 | Transport in production must be HTTPS.                                                                                                                                         |
| SR-02 | Passwords are hashed with a dedicated password-hashing algorithm (not a general-purpose checksum).                                                                             |
| SR-03 | Hashes must use a unique salt per password.                                                                                                                                    |
| SR-04 | Secrets (hashing secrets, session secrets) live in environment configuration, not in source control. Local values go in `.dev.vars`. Production values go in Wrangler secrets. |
| SR-05 | Session cookies: `HttpOnly`, `Secure` in production, `SameSite=Lax` or stricter.                                                                                               |
| SR-06 | Session IDs must be cryptographically random and long enough to be unguessable.                                                                                                |
| SR-07 | Sign Out invalidates server-side session state.                                                                                                                                |
| SR-08 | Sign In failures must not disclose whether an email is registered.                                                                                                             |
| SR-09 | Do not log passwords, session IDs, or full cookies.                                                                                                                            |
| SR-10 | Authorisation is server-side. Hidden buttons are not access control.                                                                                                           |
| SR-11 | Validate and constrain all authentication inputs (length, format) to reduce abuse.                                                                                             |
| SR-12 | Protect Sign Up, Sign In, and Sign Out against cross-site request forgery.                                                                                                     |
| SR-13 | Escape or encode user-supplied names when showing them on the Dashboard so stored text cannot run as HTML or script.                                                           |
| SR-14 | Do not put passwords or session tokens in URLs.                                                                                                                                |
| SR-15 | Dependency additions for auth or crypto must be proposed first, justified, and compatible with the Cloudflare Workers runtime.                                                 |


---

## Non-Functional Requirements

### Security

Covered in Security Requirements and Authentication Requirements. Additional quality bar:

- Authentication pages must not cache personalised or session-secret content in shared caches.
- The design must remain compatible with Cloudflare Workers (no Node-only crypto APIs that the Workers runtime does not provide).

### Performance


| ID      | Requirement                                                                                                                                                                                   |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-P01 | Sign Up and Sign In pages must become interactive quickly on a typical broadband connection. Target: first useful render under 3 seconds on a mid-range laptop in local development.          |
| NFR-P02 | A successful Sign In or Sign Up round trip should complete within 2 seconds under normal local or preview load, excluding intentional password-hashing delay.                                 |
| NFR-P03 | Password hashing may be deliberately slow. That delay must stay within a range that still feels responsive (target under 1 second of hashing time per attempt on the deployment environment). |
| NFR-P04 | Validation feedback for empty and format errors should appear without a full page wait when implemented as client-side checks.                                                                |
| NFR-P05 | Protected-page redirect for signed-out users must not first flash private Dashboard content.                                                                                                  |


### Accessibility


| ID      | Requirement                                                                                                                                         |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-A01 | Meet WCAG 2.2 Level AA for Sign Up, Sign In, and Dashboard.                                                                                         |
| NFR-A02 | All interactive controls are reachable and usable with keyboard only.                                                                               |
| NFR-A03 | Visible focus is present on interactive elements.                                                                                                   |
| NFR-A04 | Form fields have programmatic labels.                                                                                                               |
| NFR-A05 | Error messages are exposed to assistive technology (associated with the field or announced as a live/alert region).                                 |
| NFR-A06 | Colour is not the only way to show an error.                                                                                                        |
| NFR-A07 | Contrast of text and controls meets AA.                                                                                                             |
| NFR-A08 | Submit buttons have a clear accessible name (`Sign up`, `Sign in`, `Sign out`).                                                                     |
| NFR-A09 | Password fields remain usable with a password manager.                                                                                              |
| NFR-A10 | Target size of primary controls is large enough for touch (minimum 24×24 CSS pixels; prefer 44×44 for primary submit).                              |
| NFR-A11 | Page language is set (English).                                                                                                                     |
| NFR-A12 | Do not rely on placeholder-only instructions for required format or password rules. Provide visible helper text for password complexity on Sign Up. |


### Reliability and operability


| ID      | Requirement                                                                                                                                                 |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-R01 | Unexpected failures show the generic system error, not a blank page.                                                                                        |
| NFR-R02 | Implementation must pass `npm run lint` and `npm run build` before the authentication sprint is called complete.                                            |
| NFR-R03 | Runtime-sensitive session behaviour must be verified with `npm run preview` in addition to `npm run dev`, because local Node and Cloudflare Workers differ. |
| NFR-R04 | Cloudflare production deploy (`npm run deploy`) is a separate Deployment Phase step. Agents must not run it unless the user explicitly asks to deploy.      |
| NFR-R05 | Local secrets stay in `.dev.vars` (gitignored). Production secrets are set with Wrangler secrets and are never committed or written into `wrangler.jsonc`.  |


### Maintainability

- Behaviour in this PRD is the contract. Tests describe that contract. Implementation must not silently change messages or redirects.
- Future quiz sprints must reuse this session model rather than invent a second login system.

---

## Test-Driven Development (TDD)

Authentication **must be built with TDD** in the implementation sprint. Design work in Sprint 0 does not include writing production tests, but it does lock the process and the cases.

### Process (mandatory)

1. **Red** — Write a failing test that expresses one requirement from this PRD.
2. **Green** — Write the smallest production change that makes that test pass.
3. **Refactor** — Clean up without changing behaviour. Tests stay green.
4. Do not add production behaviour that has no test.
5. Do not write tests that cannot fail (`expect(true).toBe(true)` or assertions that ignore the result).
6. Name tests so a failure message states the broken rule (for example, `rejects sign up when passwords do not match`).

The project uses **Vitest** (and React Testing Library for page behaviour) following `.cursor/skills/testing/SKILL.md`. Tests are colocated with the subject they cover. Mock network, database, and Cloudflare bindings. Do not hit real email providers or production data.

### What to test first (order)

1. Password and email validation rules (pure functions — fastest feedback).
2. Sign Up rejection paths (missing fields, bad email, weak password, mismatch, duplicate email).
3. Sign Up success path (account created, no session, redirect to Sign In, success message).
4. Sign In rejection paths (missing fields, invalid credentials generic message, no session).
5. Sign In success path (session established, redirect to Dashboard).
6. Session persistence across a subsequent protected-page request.
7. Sign Out (session unusable, redirect to Sign In).
8. Unauthenticated access to Dashboard redirects to Sign In without protected content.
9. Authenticated access to Sign In / Sign Up redirects to Dashboard.

### Test categories


| Category       | Proves                                                                            | Examples                                                                                                             |
| -------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Unit           | Validation rules in isolation                                                     | Password without uppercase fails; emails that differ only by case are the same account key                           |
| Integration    | Sign Up / Sign In / Sign Out against persistence and session, with storage mocked | Duplicate email rejected; valid login creates a session that later requests accept                                   |
| UI / component | What the user can see and do                                                      | Inline error under Confirm Password; submit disabled or blocked while invalid; Sign out control present on Dashboard |
| Access control | Server-side protection                                                            | Signed-out Dashboard request redirects; signed-in Sign In request redirects                                          |


Server-only logic is tested as functions. Interactive forms are tested as client components with Testing Library, querying by role and accessible name.

### Coverage expectations (behaviour, not a percentage)

Every validation row in Field Validation Rules has at least one failing-input test and, for Sign Up/Sign In happy paths, at least one passing-input test.

Every Error Message and Success Message in this PRD is asserted where that condition is produced.

Route-protection rules FR-19, FR-20, and FR-21 have tests.

### Definition of done for TDD on this feature

- Tests are written before the production code they lock.
- `npm test` (or the agreed Vitest script) is green.
- A reviewer can map each Must user story to tests.
- Failure paths are covered, not only the happy path.

---

## Technical Requirements

This section describes **what the system must do**, not how to lay out files, tables, or HTTP routes. Database schema, APIs, UI components, and folder structures are **out of this document** by design. The implementation sprint will choose concrete mechanisms that satisfy these behaviours and the stack in `AGENTS.md`.

### Identity and persistence (conceptual)

The system must persist:

- A user identity with first name, last name, email, and password hash.
- Enough timestamps or metadata to support auditing later (at minimum a created time is recommended).
- Session state that can be created, read, and invalidated.

Physical tables, column types, and indexes are not specified here.

### Application operations (conceptual)

The system must support these operations, regardless of whether they are later implemented as Server Actions or another server-side entry point:

- Register a user after full validation.
- Authenticate a user and start a session.
- End a session.
- Resolve the current user from the incoming session.
- Allow or deny access to protected pages.

Request and response payloads, status codes, and URL paths for APIs are not specified here.

### User interface requirements (logical pages)

#### Sign Up page

- Collect and validate the Sign Up fields.
- Show inline errors and block invalid submission.
- On success, redirect to Sign In with the account-created success message.

#### Sign In page

- Collect and validate Email and Password.
- Show field errors and the generic credentials error as specified.
- Show post-registration and post-logout success messages when those events just happened.
- On success, redirect to Dashboard.

#### Dashboard page

- Available only with a valid session.
- Shows signed-in identity and Sign Out.
- Contains no quiz features.

### Platform constraints the implementation must respect

- Cloudflare Workers runtime via OpenNext. No Node-only modules that fail on Workers.
- Next.js App Router. Prefer Server Actions for these mutations unless a later decision records otherwise.
- Validate untrusted input with Zod (`signUpFormSchema` / `signInFormSchema` in `src/lib/auth/validation.ts`) and then apply the PRD field rules in `validateSignUp` / `validateSignIn`.
- Use existing shadcn/ui primitives (`button`, `card`, `field`, `input`, `label`) rather than a new design system.
- Bindings and secrets follow Wrangler conventions; never commit secrets.
- `getCloudflareContext()` is the pattern for Workers bindings when they are added.

### Technical Implementation Details (to be filled during implementation)

Updated as the authentication module was implemented.

#### Key files

- `src/lib/auth/messages.ts` — User-facing error and success copy from this PRD
- `src/lib/auth/validation.ts` — Sign Up and Sign In field rules
- `src/lib/auth/password.ts` — PBKDF2-SHA256 password hashing (Web Crypto)
- `src/lib/auth/session.ts` — Session id and signed HttpOnly cookie helpers (`qm_session`)
- `src/lib/auth/store.ts` — Persistence interface for users and sessions
- `src/lib/services/auth.ts` — Register, authenticate, resolve session, destroy session
- `src/lib/services/d1-auth-store.ts` — D1 implementation of the auth store
- `src/lib/db.ts` — D1 and `SESSION_SECRET` access via `getCloudflareContext()`
- `src/app/actions/auth.ts` — Server Actions for Sign Up, Sign In, Sign Out, and current user
- `src/components/auth/auth-shell.tsx` — Shared Tailwind layout for Sign Up and Sign In
- `src/components/auth/sign-up-form.tsx` — Sign Up form with inline validation
- `src/components/auth/sign-in-form.tsx` — Sign In form with inline validation
- `src/components/auth/sign-out-button.tsx` — Dashboard Sign Out control
- `src/app/sign-up/page.tsx` — Sign Up page (`/sign-up`)
- `src/app/sign-in/page.tsx` — Sign In page (`/sign-in`)
- `src/app/dashboard/page.tsx` — Protected Dashboard (`/dashboard`)
- `src/app/page.tsx` — Root redirect by session
- `migrations/0001_create_auth_tables.sql` — D1 tables for users and sessions
- `vitest.config.ts` and `src/test-setup.ts` — Test runner and Testing Library cleanup

#### Implementation patterns

- Server Actions in `src/app/actions/auth.ts` are the mutation entry points. There is no public REST API for auth.
- Client forms validate first and block submit; the server repeats validation and uniqueness/credential checks.
- Email is stored canonicalised (trim + lowercase). Duplicate detection uses that form.
- Session cookie: `HttpOnly`, `SameSite=Lax`, `Secure` when the request is HTTPS, path `/`. Sign Out deletes the D1 session row and clears the cookie.
- Protected pages call `getCurrentUser()` on the server and `redirect("/sign-in")` before rendering Dashboard content.
- Tests mock Server Actions at the module boundary. Auth service tests use an in-memory store, not live D1.
- UI uses Tailwind v4 theme tokens (`bg-muted/40`, `bg-card`, `text-destructive`, `border-border`) and shadcn/ui `Card`, `Field`, `Input`, and `Button`. No parallel CSS modules or hex colors.
- Sign Up first/last name sit in a two-column grid from the `sm` breakpoint. Inputs and primary actions are `h-11` (44px). Sign Up / Sign In submit buttons are full width.
- Form errors use a destructive banner (`role="alert"`). Sign In success messages (`registered=1`, `signedOut=1`) use a muted `role="status"` banner.
- Dashboard layout: top bar with Quiz Maker wordmark, signed-in email (`sm` and up), and outline **Sign out**; welcome card in the main area.

#### Important notes

- Client validation is for usability; server validation is mandatory.
- Duplicate email is a business rule, not only a unique index. The user must see the specified message.
- Session checks for protected pages must run on the server.
- `npm run dev` will not catch all Workers issues; use `npm run preview` for session cookies and runtime crypto.
- `esbuild` is a direct devDependency because `@opennextjs/cloudflare` imports it at deploy time and npm `allow-scripts` may skip nested install scripts.
- First Cloudflare publish required a `workers.dev` subdomain in the dashboard. The live URL is `https://quizmaker.es-quizmaker.workers.dev`.
- Rate limiting (AR-16) is **not** implemented. Recorded as an open gap.

---

## Deployment Requirements

Authentication is not complete until it is proven in the environments Quiz Maker actually runs in. This section is the contract for **Phase 6**. It describes procedure and checks only. It does not introduce a database schema, APIs, UI components, or folder structures.

There are three environments (local Node, local Workers, and Cloudflare):


| Target                     | What it is                                         | Command           | When it is required                          |
| -------------------------- | -------------------------------------------------- | ----------------- | -------------------------------------------- |
| Local — Node               | Fast development on Node at `localhost:3000`       | `npm run dev`     | During implementation for iteration          |
| Local — Cloudflare Workers | Production-like build on the local Workers runtime | `npm run preview` | Before calling the feature verified          |
| Cloudflare                 | Live Worker on the Cloudflare network              | `npm run deploy`  | Only when the user explicitly asks to deploy |


`npm run dev` uses Node and will not surface all Workers problems. Session cookies, password hashing, and any Cloudflare bindings must also pass on `npm run preview`.

### Local deployment

**Objective**: A developer (or later AI sprint) can run authentication on this machine without publishing to Cloudflare.

**Prerequisites**

1. Node.js v22 or higher and project dependencies installed (`npm install`).
2. `.dev.vars` created from `.dev.vars.example`. This file is gitignored. It holds local secrets only.
3. Every new environment variable added during implementation is also listed as an empty placeholder in `.dev.vars.example`.
4. Wrangler is available as the project dev dependency. Cloudflare login is **not** required for `npm run dev`. It is not required for `npm run preview` unless a remote binding is used. This sprint must use **local** bindings and local storage only.

**Local Node (`npm run dev`)**

1. Start the dev server.
2. Confirm Sign Up, Sign In, Dashboard, Sign Out, and protected-page redirects at `http://localhost:3000`.
3. Treat this as a convenience environment. Do not claim Workers compatibility from this run alone.

**Local Workers (`npm run preview`)**

1. Build and run the app on the local Cloudflare Workers runtime.
2. Repeat the full authentication browser flow: Sign Up → Sign In → reload still signed in → Sign Out → Dashboard redirects to Sign In.
3. Confirm cookies, hashing, and persistence work on Workers, not only on Node.
4. If persistence is added later (for example D1), apply migrations **locally only**. Do not apply migrations to the remote database as part of this phase.

**Local definition of done**

- `npm run lint` and `npm run build` succeed.
- Authentication acceptance criteria pass on `npm run dev`.
- The same criteria pass on `npm run preview`.
- No secrets from `.dev.vars` are committed.

### Cloudflare deployment

**Objective**: When the user explicitly requests it, authentication runs on the deployed Cloudflare Worker with production secrets.

**Hard rule**: Never run `npm run deploy` unless the user explicitly asks to deploy. Completing local verification does **not** authorise a production deploy. Cursor Cloud agents have no Cloudflare credentials and no `.dev.vars`; they must stop and report that Cloudflare deploy has to be run locally.

**Prerequisites**

1. Local Deployment checks above are already green.
2. Wrangler is authenticated (`npx wrangler login`, then `npx wrangler whoami`).
3. `wrangler.jsonc` names this app (`quizmaker`) and keeps `nodejs_compat` in `compatibility_flags`.
4. Any resource bindings required by implementation are present in `wrangler.jsonc`. After binding changes, run `npm run cf-typegen`. Do not edit `cloudflare-env.d.ts` by hand.
5. Production secrets are set with `npx wrangler secret put NAME`. Never put secret values in `wrangler.jsonc` or in git.
6. Remote database schema changes are the user’s decision. Agents must not run remote migrations.

**Cloudflare deploy steps (when the user asks)**

1. Confirm `npx wrangler whoami` shows the intended account.
2. Confirm production secrets exist for every value that local `.dev.vars` supplies.
3. Run `npm run deploy` (OpenNext build + Cloudflare deploy).
4. Open the deployed URL.
5. Exercise Sign Up, Sign In, session reload, Sign Out, and unauthenticated Dashboard access on HTTPS.
6. Confirm the session cookie is `Secure` and `HttpOnly` on the live origin.
7. Record the deployed URL and the verification result in **Current Status**.

**Cloudflare definition of done**

- The Worker is reachable over HTTPS.
- Authentication acceptance criteria pass on the deployed URL.
- Production secrets are not in the repository.
- Remote data stores were not migrated unless the user ran that step.

### Deployment commands (reference)


| Command                        | Purpose                                                            |
| ------------------------------ | ------------------------------------------------------------------ |
| `npm run dev`                  | Local Node dev server at `localhost:3000`                          |
| `npm run preview`              | Build and run on the local Workers runtime                         |
| `npm run build`                | Production build                                                   |
| `npm run lint`                 | ESLint                                                             |
| `npm run deploy`               | Build and deploy to Cloudflare — user must ask first               |
| `npm run cf-typegen`           | Regenerate Cloudflare binding types after `wrangler.jsonc` changes |
| `npx wrangler login`           | Authorise Wrangler with a Cloudflare account                       |
| `npx wrangler whoami`          | Confirm the authenticated Cloudflare account                       |
| `npx wrangler secret put NAME` | Set a production secret                                            |


---

## Implementation Phases

Sprint 0 completed Phase 0. Phases 1–6 are complete except where Current Status lists an open gap.

### Phase 0: Authentication design — COMPLETED

**Objective**: Publish this Technical PRD as the contract for authentication.

**Tasks**:

1. Record problem, goals, scope, and flows.
2. Record fields, validation, errors, success copy, and security rules.
3. Record TDD process and test order.
4. Explicitly exclude quiz features, schema, APIs, components, and folders.

**Deliverables**:

- This document in `ai-workspace/AUTHENTICATION_TECHNICAL_PRD.md`

### Phase 1: Test harness and validation — COMPLETED

**Objective**: Install the agreed test stack and lock validation rules with failing-then-passing tests.

**Tasks**:

1. Propose and add Vitest and related testing libraries per the testing skill.
2. Encode email, password, name, and match rules as tests first.
3. Implement validation to satisfy those tests.

**Deliverables**:

- A green unit suite for every validation rule in this PRD

### Phase 2: Sign Up — COMPLETED

**Objective**: Users can register and are sent to Sign In.

**Tasks**:

1. Tests for unique email, persistence of hashed password, no session, redirect, and messages.
2. Sign Up page behaviour and server-side registration that satisfy those tests.

**Deliverables**:

- Sign Up flow meeting FR-01 to FR-10

### Phase 3: Sign In and session — COMPLETED

**Objective**: Users can authenticate and remain signed in.

**Tasks**:

1. Tests for invalid login, valid login, session cookie behaviour, and Dashboard redirect.
2. Sign In and session handling that satisfy those tests.

**Deliverables**:

- Sign In flow meeting FR-11 to FR-16

### Phase 4: Sign Out and route protection — COMPLETED

**Objective**: Users can leave the session; protected pages reject anonymous access.

**Tasks**:

1. Tests for logout, invalidation, protected redirect, and authenticated redirect away from auth pages.
2. Sign Out and server-side guards that satisfy those tests.

**Deliverables**:

- FR-17 to FR-22 satisfied

### Phase 5: Accessibility, hardening, and verification — COMPLETED

**Objective**: Meet NFR and security bars; prove the build.

**Tasks**:

1. Keyboard, labels, error association, and contrast checks on the three pages.
2. Confirm secrets are not in git; cookies use required flags in production configuration.
3. Run `npm run lint`, `npm run build`, and `npm run preview` and record results.

**Deliverables**:

- Authentication module ready for later quiz sprints to depend on

**Result**: Labels, `aria-invalid` / `aria-describedby`, `role="alert"` on field errors, and `lang="en"` are in place. Sign Up and Sign In use a shared Tailwind `AuthShell`; Dashboard Sign Out is an `h-11` outline button in the page header. `npm run lint` and `npm run build` succeeded. `npm run preview` served Sign In and Sign Up on the local Workers runtime. A formal WCAG 2.2 AA audit was not run.

### Phase 6: Deployment — local and Cloudflare — COMPLETED

**Objective**: Prove Sign Up, Sign In, session, Sign Out, and route protection on local Node, on the local Cloudflare Workers runtime, and — only when the user asks — on the live Cloudflare Worker.

This phase does not add product features. It publishes and verifies the authentication module built in Phases 1–5.

#### 6A. Local — COMPLETED

**Objective**: Authentication works on this machine in both runtimes.

**Tasks**:

1. Ensure `.dev.vars` exists (copied from `.dev.vars.example`) and is not tracked by git. Add empty placeholders to `.dev.vars.example` for any new variables.
2. Run `npm run lint` and `npm run build` and record the actual result.
3. Start `npm run dev` and complete Sign Up, Sign In, Dashboard reload, Sign Out, and protected-page redirect in the browser.
4. Start `npm run preview` and repeat the same browser flow on the local Workers runtime.
5. Confirm session cookies and password hashing work under Workers, not only under Node.
6. If a local database is used, apply migrations locally only. Do not apply remote migrations.

**Deliverables**:

- Written confirmation that authentication acceptance criteria pass on `npm run dev` and on `npm run preview`

**Result**: `.dev.vars` holds `SESSION_SECRET` (gitignored). Local D1 migration `0001_create_auth_tables.sql` applied. `npm run lint` and `npm run build` succeeded. `npm run dev` and `npm run preview` served `/sign-in` and `/sign-up`; `/` and `/dashboard` redirect signed-out users to `/sign-in`.

#### 6B. Cloudflare — COMPLETED

**Objective**: When the user explicitly requests a deploy, authentication works on the Cloudflare Worker.

**Tasks**:

1. Do **not** start this sub-phase unless the user has explicitly asked to deploy.
2. Confirm Wrangler authentication with `npx wrangler whoami`. If this environment has no Cloudflare credentials (for example a Cloud agent), stop and report that deploy must be run locally.
3. Confirm production secrets with `npx wrangler secret put` for every secret used locally. Never commit secrets.
4. After any binding change in `wrangler.jsonc`, run `npm run cf-typegen`. Do not edit generated type files by hand.
5. Run `npm run deploy`.
6. On the deployed HTTPS URL, complete Sign Up, Sign In, session reload, Sign Out, and unauthenticated access to the Dashboard.
7. Confirm the live session cookie is `HttpOnly` and `Secure`.
8. Record the deployed URL and pass/fail notes in **Current Status**.

**Deliverables**:

- Authentication verified on the Cloudflare Worker, or a recorded reason that Cloudflare deploy was skipped (no user request, or no Cloudflare credentials)

**Result**: Redeployed 2026-08-27 to `https://quizmaker.es-quizmaker.workers.dev` (Worker version `6e1a4f8e-9b51-495e-bb60-ca4f05e7338e`). This version includes the Tailwind `AuthShell` Sign Up / Sign In layout and Dashboard header Sign Out. HTTPS `/` and `/dashboard` redirect signed-out users to `/sign-in`; `/sign-in` and `/sign-up` return 200. Live `/sign-up` HTML includes the Quiz Maker wordmark, **Create an account**, two-column name fields, `h-11` inputs, and **Already have an account? Sign in**. D1 binding `DB` points at remote database `quizmaker` (`77853f50-68c5-4e72-87dc-62fac583a24c`). `SESSION_SECRET` is a Wrangler secret. Remote D1 migrations were not applied in this deploy. Live Sign Up → Sign In → reload → Sign Out was not click-tested; cookie `Secure` on a successful live login was not captured.

---

## Acceptance Criteria

A criterion is met only when it is demonstrated (tests and, for UI, a real browser flow), not when the page merely exists.

### Sign Up

- [x] All five fields are present and labelled.
- [x] Submitting an empty form shows the required-field messages inline and creates no account.
- [x] An email that is not a valid format (not like `user@example.com`) shows the format error and creates no account.
- [x] A password shorter than 8 characters is rejected with the specified message.
- [x] A password missing uppercase, lowercase, number, or special character is rejected with the complexity message.
- [x] Confirm Password that does not match Password is rejected with “Passwords do not match.”
- [x] Submission does not proceed while any of the above fail.
- [x] A second Sign Up with the same email (any letter case, extra spaces) is rejected with the duplicate-email message.
- [x] A valid Sign Up creates one account, does not sign the user in, redirects to Sign In, and shows “Account created. Please sign in.”
- [x] The stored credential is not the plain password.

### Sign In

- [x] Email and Password are present and labelled.
- [x] Missing email or password shows the specified field errors and starts no session.
- [x] Wrong password or unknown email shows only “Invalid email or password.”
- [x] Valid credentials redirect to the Dashboard and establish a session.
- [x] After a full page reload, the user is still signed in.

### Sign Out and protection

- [x] Sign Out clears the session and redirects to Sign In with “You have been signed out.”
- [x] After Sign Out, the previous session cannot open the Dashboard.
- [x] A signed-out user opening the Dashboard is redirected to Sign In and does not see Dashboard content.
- [x] A signed-in user opening Sign In or Sign Up is redirected to the Dashboard.

### Quality

- [ ] Keyboard-only completion of Sign Up, Sign In, and Sign Out is possible.
- [x] Errors are announced or associated with fields for assistive technology.
- [x] TDD order was followed; tests cover the cases in the TDD section.
- [x] `npm run lint` and `npm run build` succeed. Session behaviour is checked with `npm run preview`.
- [x] No quiz creation, quiz management, attempts, or reports shipped in this feature.

### Deployment

- [x] Sign Up, Sign In, session reload, Sign Out, and protected-page redirect succeed on `npm run dev`.
- [x] The same flow succeeds on `npm run preview` (local Cloudflare Workers runtime).
- [x] Local secrets live in `.dev.vars` and are not committed. `.dev.vars.example` lists every variable name with empty placeholders.
- [x] `npm run deploy` is not run unless the user explicitly asks to deploy.
- [ ] When a Cloudflare deploy is requested and credentials exist: authentication succeeds on the live HTTPS Worker, and the session cookie is `HttpOnly` and `Secure`.
- [x] Remote database migrations are not applied by an agent. The user decides and runs any remote schema change.

Live HTTPS redirects for signed-out users are verified. End-to-end Sign Up / Sign In on the live Worker, including `Secure` cookie on login, is still unchecked. Keyboard-only completion was not separately audited. Rate limiting (AR-16) is not built.

---

## Success Metrics

These measure whether the foundation is usable after implementation, not whether Quiz Maker’s later features succeed.


| Metric                   | Target                                                                           | How measured                                                 |
| ------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Sign Up completion       | A new user with valid data can create an account in one submit after corrections | Manual and automated happy-path tests                        |
| Validation clarity       | 100% of specified field errors appear on the correct field                       | Automated UI/unit tests against the message table            |
| Duplicate email handling | 100% of duplicate attempts blocked with the specified message                    | Automated test                                               |
| Sign In success          | Valid credentials reach Dashboard on first correct submit                        | Automated + browser verification                             |
| Sign In safety           | Invalid login never discloses whether the email exists                           | Automated assertion on message text                          |
| Session durability       | Reload and in-app navigation keep the user signed in until Sign Out              | Browser verification + integration tests                     |
| Sign Out completeness    | Dashboard is unreachable with the old session                                    | Automated access-control test                                |
| Accessibility            | WCAG 2.2 AA on the three pages                                                   | Keyboard pass + label/error checks; extra audit if available |
| Engineering health       | Lint and production build clean                                                  | `npm run lint`, `npm run build`                              |
| Local Workers parity     | Auth flow matches Node results on local Workers                                  | Browser verification on `npm run preview`                    |
| Cloudflare production    | Auth flow works on the deployed Worker when the user asks to deploy              | Browser verification on the live HTTPS URL                   |


---

## Dependencies

### External dependencies

- **Cloudflare Workers / Wrangler** — Runtime, local preview, secrets, and production deploy.
- **Cloudflare account** — Required for `npm run deploy` and for `npx wrangler login` / `whoami`. Not required for `npm run dev`.
- **Browser cookie support** — Session cookie must be stored.

### Internal dependencies

- **Next.js App Router** — Pages, redirects, and server-side mutations.
- **Existing UI primitives** — shadcn/ui field, input, label, button, card.
- **Cloudflare D1** — Users and sessions (`env.DB`).
- **Environment files** — `.dev.vars` / `.dev.vars.example` for `SESSION_SECRET` and `NEXTJS_ENV`.

### Tools now in the project

- **Vitest**, Testing Library, jsdom, `vite-tsconfig-paths` — TDD harness (`npm test`).
- **Zod** — FormData parsing for Sign Up and Sign In.
- **Cloudflare D1** — Users and sessions (`wrangler.jsonc` binding `DB`).
- **Web Crypto PBKDF2** and HMAC-signed session cookies — no third-party auth library.
- **esbuild** (devDependency) — required by the OpenNext Cloudflare deploy CLI.

Further dependencies still require a proposal first.

### Environment variables


| Name             | Where                                                                  | Purpose                            |
| ---------------- | ---------------------------------------------------------------------- | ---------------------------------- |
| `SESSION_SECRET` | `.dev.vars` (local), `wrangler secret put SESSION_SECRET` (production) | Signs the session cookie           |
| `NEXTJS_ENV`     | `.dev.vars` / `.dev.vars.example`                                      | OpenNext local env (`development`) |


Empty placeholders belong in `.dev.vars.example`. Values must not be committed.

---

## Risks and Mitigation

### Technical risks

- **Risk**: Session cookies or crypto work on Node (`npm run dev`) but fail on Workers.  
**Mitigation**: Verify with `npm run preview` in Phase 6A before any Cloudflare deploy. Choose Workers-compatible hashing and cookie APIs.
- **Risk**: Production is deployed with missing secrets or with secrets committed to git.  
**Mitigation**: Keep values in `.dev.vars` locally and `wrangler secret put` in production. Check git status before deploy. Agents must not run `npm run deploy` unless asked.
- **Risk**: A Cloud agent environment cannot authenticate to Cloudflare.  
**Mitigation**: Stop Phase 6B, report that deploy must be run on a local machine with Wrangler login, and still complete Phase 6A.
- **Risk**: Client-only route guards flash private content or can be bypassed.  
**Mitigation**: Enforce authentication on the server before rendering protected pages.
- **Risk**: Duplicate email only checked in the user interface.  
**Mitigation**: Server must enforce uniqueness; tests must cover case-insensitive duplicates.
- **Risk**: Passwords stored or logged in plain text.  
**Mitigation**: Tests and review must assert hashing; logging policy forbids secrets.
- **Risk**: New libraries break the teaching-repo dependency rule or the Workers runtime.  
**Mitigation**: Propose each dependency; prefer the smallest Workers-safe option.

### User experience risks

- **Risk**: Users expect to be signed in immediately after Sign Up.  
**Mitigation**: Success message on Sign In states that they must sign in. Do not auto-login.
- **Risk**: Generic login error feels unhelpful.  
**Mitigation**: Keep it generic for security; make field-level empty/format errors specific.
- **Risk**: Password rules surprise users at submit time.  
**Mitigation**: Visible helper text for complexity on Sign Up; inline errors per field.
- **Risk**: Later quiz sprints invent a second auth mechanism.  
**Mitigation**: This PRD remains the identity contract; quiz sprints consume the session, they do not replace it.

---

## Future Enhancements

Not in this sprint. Recorded so later PRDs can extend authentication without contradicting this foundation:

- Forgot password / reset password via email
- Email verification before first Sign In
- Optional automatic sign-in after Sign Up
- Multi-factor authentication
- Social login or SSO
- Idle and absolute session timeouts
- Remember-me (longer-lived session) as an explicit choice
- Account lockout or progressive delay after repeated failed Sign In
- Rate limiting dashboard and alerting
- Profile page: change name, email, or password
- Account deletion
- Roles (for example teacher vs learner) and organisation accounts
- Return-to-original-URL after Sign In
- Passkeys / WebAuthn
- Audit log of authentication events

Quiz Maker product features that depend on this module but are owned by later PRDs:

- Quiz creation and management
- Quiz attempts
- Results and reports

---

## Troubleshooting Guide

Populate during implementation when real failures appear.

### Session works in local Node but not in preview

**Problem**: User is signed in on `npm run dev` but appears signed out on `npm run preview`.  
**Cause**: Cookie `Secure`/`SameSite` flags or Workers crypto/session storage differ from Node.  
**Solution**: Set `Secure` only when the request is HTTPS (`src/app/actions/auth.ts`). Re-test with `npm run preview`.  
**Code reference**: `src/lib/auth/session.ts`, `src/app/actions/auth.ts`

### Duplicate email allowed

**Problem**: Two accounts share the same email with different letter case.  
**Cause**: Uniqueness compared as raw strings.  
**Solution**: Canonicalise email (trim, case-fold) in `canonicalizeEmail` before store and lookup. Covered by `src/lib/services/auth.test.ts`.

### Protected content visible then redirect

**Problem**: Dashboard HTML appears briefly for signed-out users.  
**Cause**: Guard runs only in the browser.  
**Solution**: `getCurrentUser()` in the Dashboard server page redirects before render (`src/app/dashboard/page.tsx`).

### `npm run preview` or `npm run deploy` fails with authentication errors

**Problem**: Wrangler cannot talk to Cloudflare.  
**Cause**: No login, expired login, or a Cloud agent environment with no credentials.  
**Solution**: On a local machine run `npx wrangler login`, then `npx wrangler whoami`. Do not try to authenticate from a Cloud agent. Complete local Node and preview checks first.

### Deploy succeeded but Sign In does not persist

**Problem**: User can submit Sign In on the live Worker but is signed out on the next request.  
**Cause**: Production cookie `Secure`/`SameSite` mismatch, missing production secret, or persistence bound only locally.  
**Solution**: Confirm HTTPS, cookie flags, Wrangler secrets, and that production bindings point at the intended store. Re-test the live URL; do not assume `npm run dev` results apply.

### Deploy fails: workers.dev subdomain missing

**Problem**: Worker uploads, then Wrangler errors that a workers.dev subdomain is required.  
**Cause**: The Cloudflare account has not registered a `*.workers.dev` subdomain. Non-interactive deploy answers “no” to the create prompt.  
**Solution**: Register one in the dashboard Workers onboarding, then run `npm run deploy` again. Live URL takes the form `https://<worker-name>.<account-subdomain>.workers.dev`.

### Deploy fails: EPERM on `.open-next`

**Problem**: OpenNext cannot delete `.open-next` (`EPERM`).  
**Cause**: `npm run preview` or another process still has the folder open.  
**Solution**: Stop preview/dev processes that use that directory, then retry `npm run deploy`.

### Deploy fails: Cannot find package `esbuild`

**Problem**: `@opennextjs/cloudflare` imports `esbuild` at deploy time.  
**Cause**: Nested install scripts did not run.  
**Solution**: `esbuild` is a project devDependency. If the binary is missing, run `node node_modules/esbuild/install.js`.

---

## Notes for AI Agents

When working with this PRD:

1. Read **Overview / Problem**, **Hypothesis**, and **Sprint Goal** first so you do not turn this into a quiz feature.
2. Treat **Scope** as a hard boundary. Do not build Out of Scope or Cut items.
3. Authentication is **implemented**. Do not invent a second login system. Reuse `getCurrentUser`, Server Actions, and the D1 session model.
4. Follow **TDD** for changes: failing tests from this document’s rules, then code. Run `npm test`.
5. Use the **Error Messages** and **Success Messages** tables as the copy contract. Do not invent parallel wording.
6. Keep **Implementation Phases**, **Technical Implementation Details**, and **Current Status** accurate.
7. Tick **Acceptance Criteria** only when tests and behaviour prove them.
8. Add **Troubleshooting Guide** entries when bugs are found and fixed.
9. Later quiz PRDs must depend on this session model.
10. Follow `AGENTS.md` working agreements: no deploy unless asked, no remote database changes unless the user runs them, ask before adding dependencies, do not edit generated files.
11. For further deploys, follow **Phase 6**. Run `npm run deploy` only when the user explicitly asks.

---

## Current Status

**Last Updated**: 2026-08-27  
**Current Phase**: Authentication module shipped (Phases 0–6)  
**Status**: COMPLETED, with open gaps listed below  
**UI**: Sign Up, Sign In, and Sign Out use Tailwind v4 + shadcn/ui (`AuthShell` centered card, `h-11` inputs and primary actions, Dashboard header Sign out). Live `/sign-up` confirmed.  
**Implementation**: Phases 1–5 COMPLETED. Tailwind auth layout is in the live Worker.  
**Deployment**: Phase 6A COMPLETED. Phase 6B COMPLETED (Worker live; Tailwind UI redeployed).  
**Production URL**: [https://quizmaker.es-quizmaker.workers.dev](https://quizmaker.es-quizmaker.workers.dev)  
**Worker version**: `6e1a4f8e-9b51-495e-bb60-ca4f05e7338e`  
**D1**: Binding `DB`, database `quizmaker`, id `77853f50-68c5-4e72-87dc-62fac583a24c`  
**Tests**: `npm test` — 48 passing (Vitest)  
**Lint / build**: `npm run deploy` ran `next build` successfully (OpenNext + Cloudflare)  

**Open gaps**

- AR-16 rate limiting is not implemented.
- Keyboard-only completion was not separately audited (forms are native and labelled).
- Live HTTPS Sign Up → Sign In → session reload → Sign Out was not click-tested after deploy; signed-out redirects on the live URL were verified.
- Formal WCAG 2.2 AA audit was not run.

**Next Steps**: Later sprints build quiz features on this session model. Do not replace authentication. Confirm a live Sign Up / Sign In / Sign Out click-through on the production URL when convenient.

**Out of this module**: Quiz creation, management, attempts, and reports.