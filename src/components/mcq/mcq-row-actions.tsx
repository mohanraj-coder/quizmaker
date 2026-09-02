"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import { deleteMcqAction } from "@/app/actions/mcq";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MCQ_MESSAGES } from "@/lib/mcq/messages";
import { mcqEditPath, mcqPreviewPath } from "@/lib/mcq/paths";

type McqRowActionsProps = {
	id: string;
};

export function McqRowActions({ id }: McqRowActionsProps) {
	const [dialogOpen, setDialogOpen] = useState(false);

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button variant="ghost" size="icon" className="size-11" />
					}
				>
					<MoreHorizontal aria-hidden="true" />
					<span className="sr-only">Question actions</span>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="min-w-36">
					<DropdownMenuItem render={<Link href={mcqEditPath(id)} />}>
						Edit
					</DropdownMenuItem>
					<DropdownMenuItem render={<Link href={mcqPreviewPath(id)} />}>
						Preview
					</DropdownMenuItem>
					<DropdownMenuItem
						variant="destructive"
						onClick={() => setDialogOpen(true)}
					>
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{MCQ_MESSAGES.deleteConfirmTitle}</DialogTitle>
						<DialogDescription>
							{MCQ_MESSAGES.deleteConfirmDescription}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<DialogClose
							render={
								<Button variant="outline" className="h-11 w-full sm:w-24" />
							}
						>
							Cancel
						</DialogClose>
						{/* display:contents keeps the button a direct footer flex item so it sizes like Cancel. */}
						<form action={deleteMcqAction.bind(null, id)} className="contents">
							<Button
								type="submit"
								variant="destructive"
								className="h-11 w-full sm:w-24"
							>
								Delete
							</Button>
						</form>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
