"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { demoUpdateLaunchDate } from "@/lib/data/demo-store";
import {
  getActiveLaunch,
  getCurrentMembership,
  isDemoMode,
  validateLaunchDateForReporting,
} from "@/lib/data/launch-service";

const schema = z.object({
  launch_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
});

export async function updateLaunchDateAction(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const parsed = schema.safeParse({ launch_date: formData.get("launch_date") });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.launch_date?.[0] ?? "Invalid date" };
  }

  try {
    validateLaunchDateForReporting({ launch_date: parsed.data.launch_date } as import("@/lib/types/domain").Launch);
  } catch (e) {
    return { error: (e as Error).message };
  }

  if (isDemoMode()) {
    demoUpdateLaunchDate(parsed.data.launch_date);
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { ok: true };
  }

  const launch = await getActiveLaunch();
  const membership = await getCurrentMembership(launch.id);
  if (!membership || membership.role !== "pmo_admin") {
    return { error: "Only PMO Admin can update the launch date." };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("launches")
    .update({
      launch_date: parsed.data.launch_date,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", launch.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/operations/master-plan");
  return { ok: true };
}
