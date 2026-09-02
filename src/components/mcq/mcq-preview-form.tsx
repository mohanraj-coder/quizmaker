"use client";

import { useActionState } from "react";
import Link from "next/link";

import {
	submitAttemptAction,
	type AttemptActionState,
} from "@/app/actions/mcq";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldLegend,
	FieldSet,
} from "@/components/ui/field";
import { MCQ_DASHBOARD_PATH } from "@/lib/auth/paths";
import { MCQ_MESSAGES } from "@/lib/mcq/messages";
import type { McqPreview } from "@/lib/services/mcq";
import { cn } from "@/lib/utils";

const INITIAL_STATE: AttemptActionState = {};

type McqPreviewFormProps = {
	mcq: McqPreview;
};

export function McqPreviewForm({ mcq }: McqPreviewFormProps) {
	const [state, formAction, pending] = useActionState(
		submitAttemptAction.bind(null, mcq.id),
		INITIAL_STATE,
	);

	return (
		<div className="flex max-w-2xl flex-col gap-6">
			<h1 className="text-2xl font-semibold tracking-tight">{mcq.name}</h1>
			<p className="text-sm leading-6">{mcq.description}</p>
			<form action={formAction} className="flex flex-col gap-4">
				<Field data-invalid={Boolean(state.error) || undefined}>
					<FieldSet>
						<FieldLegend>Select a choice</FieldLegend>
						<div className="flex flex-col gap-2">
							{mcq.choices.map((choice) => (
								<label
									key={choice.id}
									className="flex items-start gap-2 rounded-lg border border-border p-3 text-sm"
								>
									<input
										type="radio"
										name="choiceId"
										value={choice.id}
										required
										aria-invalid={Boolean(state.error) || undefined}
										aria-describedby={
											state.error ? "preview-choice-error" : undefined
										}
									/>
									<span>{choice.text}</span>
								</label>
							))}
						</div>
						<FieldError
							id="preview-choice-error"
							errors={state.error ? [{ message: state.error }] : undefined}
						/>
					</FieldSet>
				</Field>
				<Button
					type="submit"
					className="h-11 w-fit"
					disabled={pending}
					aria-busy={pending}
				>
					Submit answer
				</Button>
			</form>
			{state.isCorrect === true ? (
				<p role="status">{MCQ_MESSAGES.correctFeedback}</p>
			) : null}
			{state.isCorrect === false ? (
				<p role="status">{MCQ_MESSAGES.incorrectFeedback}</p>
			) : null}
			<Link
				href={MCQ_DASHBOARD_PATH}
				className={cn(buttonVariants({ variant: "outline" }), "h-11 w-fit px-4")}
			>
				Back to list
			</Link>
		</div>
	);
}
