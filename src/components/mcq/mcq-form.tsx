"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import type { McqActionState } from "@/app/actions/mcq";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { MCQ_DASHBOARD_PATH } from "@/lib/auth/paths";
import { cn } from "@/lib/utils";
import {
	MAX_CHOICES,
	MIN_CHOICES,
	parseMcqFormData,
	validateMcqInput,
	type McqChoiceInput,
	type McqErrors,
} from "@/lib/mcq/validation";

const INITIAL_STATE: McqActionState = { errors: {} };

type McqFormProps = {
	title: string;
	action: (
		previous: McqActionState,
		formData: FormData,
	) => Promise<McqActionState>;
	initial?: {
		name: string;
		description: string;
		choices: McqChoiceInput[];
	};
};

function defaultChoices(): McqChoiceInput[] {
	return [
		{ text: "", isCorrect: true },
		{ text: "", isCorrect: false },
	];
}

export function McqForm({ title, action, initial }: McqFormProps) {
	const [serverState, formAction, pending] = useActionState(
		action,
		INITIAL_STATE,
	);
	const [clientErrors, setClientErrors] = useState<McqErrors>({});
	const [choices, setChoices] = useState<McqChoiceInput[]>(
		initial?.choices?.length ? initial.choices : defaultChoices(),
	);
	const errors = { ...serverState.errors, ...clientErrors };
	const firstErrorId = errors.name
		? "name"
		: errors.description
			? "description"
			: choices.find((_, index) => errors[`choice-${index}`])
				? `choiceText-${choices.findIndex((_, index) => errors[`choice-${index}`])}`
				: undefined;
	const correctIndex = useMemo(() => {
		const index = choices.findIndex((choice) => choice.isCorrect);
		return index >= 0 ? index : 0;
	}, [choices]);

	useEffect(() => {
		if (firstErrorId) {
			document.getElementById(firstErrorId)?.focus();
		}
	}, [firstErrorId]);

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		const result = validateMcqInput(parseMcqFormData(new FormData(event.currentTarget)));
		if (!result.ok) {
			event.preventDefault();
			setClientErrors(result.errors);
			return;
		}
		setClientErrors({});
	}

	function addChoice() {
		if (choices.length >= MAX_CHOICES) {
			return;
		}
		setChoices([...choices, { text: "", isCorrect: false }]);
	}

	function markCorrect(index: number) {
		setChoices(
			choices.map((item, current) => ({
				...item,
				isCorrect: current === index,
			})),
		);
	}

	function removeChoice(index: number) {
		if (choices.length <= MIN_CHOICES) {
			return;
		}
		const next = choices.filter((_, current) => current !== index);
		if (!next.some((choice) => choice.isCorrect) && next[0]) {
			next[0] = { ...next[0], isCorrect: true };
		}
		setChoices(next);
	}

	return (
		<form
			action={formAction}
			onSubmit={handleSubmit}
			noValidate
			className="flex max-w-2xl flex-col gap-6"
		>
			<h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
			{errors.form ? (
				<div
					role="alert"
					className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
				>
					{errors.form}
				</div>
			) : null}
			<FieldGroup>
				<Field data-invalid={Boolean(errors.name) || undefined}>
					<FieldLabel htmlFor="name">Question name</FieldLabel>
					<Input
						id="name"
						name="name"
						defaultValue={initial?.name ?? ""}
						aria-invalid={Boolean(errors.name) || undefined}
						aria-describedby={errors.name ? "name-error" : undefined}
						className="h-11"
					/>
					<FieldError
						id="name-error"
						errors={errors.name ? [{ message: errors.name }] : undefined}
					/>
				</Field>
				<Field data-invalid={Boolean(errors.description) || undefined}>
					<FieldLabel htmlFor="description">Question / description</FieldLabel>
					<Textarea
						id="description"
						name="description"
						defaultValue={initial?.description ?? ""}
						aria-invalid={Boolean(errors.description) || undefined}
						aria-describedby={
							errors.description ? "description-error" : undefined
						}
					/>
					<FieldError
						id="description-error"
						errors={
							errors.description ? [{ message: errors.description }] : undefined
						}
					/>
				</Field>
				<Field data-invalid={Boolean(errors.choices) || undefined}>
					<FieldSet>
						<FieldLegend>Choices</FieldLegend>
						<RadioGroup
							name="correctChoice"
							value={String(correctIndex)}
							onValueChange={(value) => markCorrect(Number(value))}
							className="flex flex-col gap-4"
						>
							{choices.map((choice, index) => (
								<div
									key={index}
									className="flex flex-col gap-2 rounded-lg border border-border p-3"
								>
									<FieldLabel htmlFor={`choiceText-${index}`}>
										Choice {index + 1}
									</FieldLabel>
									<Input
										id={`choiceText-${index}`}
										name={`choiceText-${index}`}
										value={choice.text}
										onChange={(event) => {
											const next = [...choices];
											next[index] = { ...choice, text: event.target.value };
											setChoices(next);
										}}
										aria-invalid={
											Boolean(errors[`choice-${index}`]) || undefined
										}
										aria-describedby={
											errors[`choice-${index}`]
												? `choice-${index}-error`
												: undefined
										}
										className="h-11"
									/>
									<FieldError
										id={`choice-${index}-error`}
										errors={
											errors[`choice-${index}`]
												? [{ message: errors[`choice-${index}`] }]
												: undefined
										}
									/>
									<FieldLabel className="items-center text-sm font-normal">
										<RadioGroupItem value={String(index)} />
										Correct answer{" "}
										<span className="sr-only">for choice {index + 1}</span>
									</FieldLabel>
									<Button
										type="button"
										variant="outline"
										disabled={choices.length <= MIN_CHOICES}
										onClick={() => removeChoice(index)}
									>
										Remove choice {index + 1}
									</Button>
								</div>
							))}
						</RadioGroup>
						<FieldError
							id="choices-error"
							errors={errors.choices ? [{ message: errors.choices }] : undefined}
						/>
						<Button
							type="button"
							variant="outline"
							disabled={choices.length >= MAX_CHOICES}
							onClick={addChoice}
						>
							Add choice
						</Button>
					</FieldSet>
				</Field>
			</FieldGroup>
			<div className="flex flex-wrap gap-3">
				<Button
					type="submit"
					className="h-11 min-w-24"
					disabled={pending}
					aria-busy={pending}
				>
					{pending ? "Saving…" : "Save"}
				</Button>
				<Link
					href={MCQ_DASHBOARD_PATH}
					className={cn(
						buttonVariants({ variant: "outline" }),
						"h-11 min-h-11 px-4",
					)}
				>
					Cancel
				</Link>
			</div>
		</form>
	);
}
