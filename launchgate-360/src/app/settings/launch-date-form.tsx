"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateLaunchDateAction } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LaunchDateForm({
  launchDate,
  canEdit,
}: {
  launchDate: string;
  canEdit: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateLaunchDateAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) {
      toast.success("Launch date updated");
      router.refresh();
    }
  }, [state?.ok, router]);

  if (!canEdit) {
    return (
      <p>
        <span className="font-medium">Launch date:</span> {launchDate}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      {state?.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="space-y-1">
        <Label htmlFor="launch_date">Launch date</Label>
        <Input
          id="launch_date"
          name="launch_date"
          type="date"
          required
          defaultValue={launchDate}
        />
      </div>
      <Button type="submit" disabled={pending} variant="outline">
        {pending ? "Saving…" : "Save launch date"}
      </Button>
      <p className="text-xs text-slate-500">
        PMO Admin only in production. Drives reporting cadence and PDF access.
      </p>
    </form>
  );
}
