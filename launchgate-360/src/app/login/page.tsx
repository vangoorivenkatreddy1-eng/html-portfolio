import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--lg-surface)] px-4">
      <Card className="w-full max-w-md border-[var(--lg-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--lg-navy)]">LaunchGate 360</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          <p>
            Connect Supabase Auth for production. This cloud workspace runs in{" "}
            <strong>DEMO mode</strong> when Supabase env vars are absent.
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
        </CardContent>
      </Card>
    </div>
  );
}
