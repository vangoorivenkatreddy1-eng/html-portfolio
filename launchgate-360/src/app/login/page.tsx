import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isDemoMode } from "@/lib/data/launch-service";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const demo = isDemoMode();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--lg-surface)] px-4">
      <Card className="w-full max-w-md border-[var(--lg-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--lg-navy)]">LaunchGate 360</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          {demo ? (
            <>
              <p>
                Supabase is not configured (or DEMO mode is on). Use the demo workspace — no live
                booking confirmations.
              </p>
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "w-full bg-[var(--lg-teal)] text-white hover:bg-teal-700",
                )}
              >
                Continue to demo dashboard
              </Link>
            </>
          ) : (
            <>
              <p>OEM launch control — sign in with your Supabase Auth account.</p>
              <LoginForm />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
