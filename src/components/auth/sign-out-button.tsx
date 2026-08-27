import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
	return (
		<form action={signOutAction}>
			<Button
				type="submit"
				variant="outline"
				className="h-11 min-h-11 min-w-24 px-4"
			>
				Sign out
			</Button>
		</form>
	);
}
