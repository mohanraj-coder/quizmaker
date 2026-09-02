import Link from "next/link";

import { McqRowActions } from "@/components/mcq/mcq-row-actions";
import { buttonVariants } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { MCQ_NEW_PATH } from "@/lib/mcq/paths";
import type { McqListItem } from "@/lib/mcq/store";
import { cn } from "@/lib/utils";

type McqListProps = {
	questions: McqListItem[];
};

export function McqList({ questions }: McqListProps) {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h2 className="text-base font-semibold tracking-tight">
					Your multiple-choice quizzes
				</h2>
				<Link
					href={MCQ_NEW_PATH}
					className={cn(buttonVariants(), "h-11 px-4")}
				>
					New Multiple Choice Question
				</Link>
			</div>
			{questions.length === 0 ? (
				<p className="text-sm leading-6 text-muted-foreground">
					You have no multiple-choice questions yet.
				</p>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Description</TableHead>
							<TableHead className="w-16 text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{questions.map((question) => (
							<TableRow key={question.id}>
								<TableCell className="font-medium">{question.name}</TableCell>
								<TableCell className="max-w-sm truncate">
									{question.description}
								</TableCell>
								<TableCell className="text-right">
									<McqRowActions id={question.id} />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
}
