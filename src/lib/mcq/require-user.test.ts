import { beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/app/actions/auth";
import { SIGN_IN_PATH } from "@/lib/auth/paths";
import { requireMcqUser } from "@/lib/mcq/require-user";

vi.mock("next/navigation", () => ({
	redirect: vi.fn(() => {
		throw new Error("NEXT_REDIRECT");
	}),
}));

vi.mock("@/app/actions/auth", () => ({
	getCurrentUser: vi.fn(),
}));

describe("requireMcqUser", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("redirects signed-out users to Sign In", async () => {
		vi.mocked(getCurrentUser).mockResolvedValue(null);

		await expect(requireMcqUser()).rejects.toThrow("NEXT_REDIRECT");
		expect(redirect).toHaveBeenCalledWith(SIGN_IN_PATH);
	});

	it("returns the signed-in user", async () => {
		const user = {
			id: "u1",
			email: "ada@example.com",
			firstName: "Ada",
			lastName: "Lovelace",
		};
		vi.mocked(getCurrentUser).mockResolvedValue(user);

		await expect(requireMcqUser()).resolves.toEqual(user);
		expect(redirect).not.toHaveBeenCalled();
	});
});
