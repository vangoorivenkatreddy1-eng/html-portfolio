"use client";

import { useActionState } from "react";
import { signInAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signInAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="space-y-1">
        <Label htmlFor="email">Work email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="w-full bg-[var(--lg-teal)] text-white hover:bg-teal-700"
      >
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-xs text-slate-500">
        Users must have a row in <code className="text-[11px]">launch_memberships</code> for this
        launch. See{" "}
        <code className="text-[11px]">supabase/seed-production-memberships.sql.example</code>.
      </p>
    </form>
  );
}
