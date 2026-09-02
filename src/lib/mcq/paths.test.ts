import { describe, expect, it } from "vitest";

import { MCQ_DASHBOARD_PATH } from "@/lib/auth/paths";
import { MCQ_NEW_PATH, mcqEditPath, mcqPreviewPath } from "@/lib/mcq/paths";

describe("mcq paths", () => {
	it("nests create, edit, and preview under the MCQ Dashboard", () => {
		expect(MCQ_NEW_PATH).toBe(`${MCQ_DASHBOARD_PATH}/new`);
		expect(mcqEditPath("abc")).toBe(`${MCQ_DASHBOARD_PATH}/abc/edit`);
		expect(mcqPreviewPath("abc")).toBe(`${MCQ_DASHBOARD_PATH}/abc/preview`);
	});
});
