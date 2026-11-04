import { signOutAction } from "@/app/actions/auth";
import { isDemoMode } from "@/lib/data/launch-service";
import { Button } from "@/components/ui/button";

export async function SignOutButton() {
  if (isDemoMode()) return null;

  return (
    <form action={signOutAction}>
      <Button type="submit" variant="outline" size="sm">
        Sign out
      </Button>
    </form>
  );
}
