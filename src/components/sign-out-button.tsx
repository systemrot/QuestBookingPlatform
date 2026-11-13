import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SignOutButton({
  className,
  outline = true,
}: {
  className?: string;
  /** Blood outline style (desktop header). Off for menu items. */
  outline?: boolean;
}) {
  return (
    <form action={signOutAction} className={cn(outline ? undefined : "w-full")}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className={cn(
          outline && "btn-blood-outline hover:bg-transparent",
          className
        )}
      >
        Выйти
      </Button>
    </form>
  );
}
