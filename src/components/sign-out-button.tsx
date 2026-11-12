import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="btn-blood-outline hover:bg-transparent"
      >
        Выйти
      </Button>
    </form>
  );
}
