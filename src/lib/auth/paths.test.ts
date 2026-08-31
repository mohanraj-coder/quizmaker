import { describe, expect, it } from "vitest";

import {
	DASHBOARD_ALIAS_PATH,
	MCQ_DASHBOARD_PATH,
	SIGN_IN_PATH,
	SIGN_UP_PATH,
} from "@/lib/auth/paths";

describe("auth paths", () => {
	it("sends a successful Sign In to the MCQ Dashboard", () => {
		expect(MCQ_DASHBOARD_PATH).toBe("/mcq-dashboard");
		expect(DASHBOARD_ALIAS_PATH).toBe("/dashboard");
		expect(SIGN_IN_PATH).toBe("/sign-in");
		expect(SIGN_UP_PATH).toBe("/sign-up");
	});
});
