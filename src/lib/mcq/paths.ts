import { MCQ_DASHBOARD_PATH } from "@/lib/auth/paths";

export const MCQ_NEW_PATH = `${MCQ_DASHBOARD_PATH}/new`;

export function mcqEditPath(id: string): string {
	return `${MCQ_DASHBOARD_PATH}/${id}/edit`;
}

export function mcqPreviewPath(id: string): string {
	return `${MCQ_DASHBOARD_PATH}/${id}/preview`;
}
