export const AUTH_MESSAGES = {
	firstNameRequired: "First name is required.",
	firstNameTooLong: "First name must be 50 characters or fewer.",
	firstNameInvalid:
		"First name can include letters, spaces, hyphens, and apostrophes only.",
	lastNameRequired: "Last name is required.",
	lastNameTooLong: "Last name must be 50 characters or fewer.",
	lastNameInvalid:
		"Last name can include letters, spaces, hyphens, and apostrophes only.",
	emailRequired: "Email address is required.",
	emailInvalid: "Enter a valid email address (for example, user@example.com).",
	emailTooLong: "Email address is too long.",
	emailTaken: "An account with this email already exists. Sign in instead.",
	passwordRequired: "Password is required.",
	passwordTooShort: "Password must be at least 8 characters.",
	passwordTooLong: "Password must be 128 characters or fewer.",
	passwordComplexity:
		"Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.",
	confirmPasswordRequired: "Confirm password is required.",
	passwordsDoNotMatch: "Passwords do not match.",
	signInEmailRequired: "Email is required.",
	signInPasswordRequired: "Password is required.",
	invalidCredentials: "Invalid email or password.",
	systemError: "Something went wrong. Please try again.",
	accountCreated: "Account created. Please sign in.",
	signedOut: "You have been signed out.",
} as const;
