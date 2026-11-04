"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  demoDeleteStakeholder,
  demoUpsertInvitation,
  demoUpsertStakeholder,
} from "@/lib/data/demo-store";
import { getActiveLaunch, isDemoMode } from "@/lib/data/launch-service";
import type { InvitationDeliveryStatus, InvitationRsvpStatus } from "@/lib/types/domain";

const stakeholderSchema = z.object({
  id: z.string().uuid().optional(),
  full_name: z.string().min(2),
  email: z.string().email(),
  organization: z.string().optional(),
  title: z.string().optional(),
});

const invitationSchema = z.object({
  id: z.string().optional(),
  stakeholder_id: z.string().uuid(),
  is_guest_attendee: z.boolean().default(false),
  delivery_status: z.enum(["draft", "sent", "delivered", "bounced", "failed"]),
  rsvp_status: z.enum(["pending_reply", "confirmed", "declined"]),
});

export async function upsertStakeholderAction(formData: FormData) {
  const parsed = stakeholderSchema.safeParse({
    id: formData.get("id") || undefined,
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    organization: formData.get("organization") || undefined,
    title: formData.get("title") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  if (isDemoMode()) {
    demoUpsertStakeholder(parsed.data);
    revalidatePath("/operations/stakeholders");
    revalidatePath("/dashboard");
    return { ok: true };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: { _form: ["Unauthorized"] } };

  const launch = await getActiveLaunch();

  const payload = {
    ...parsed.data,
    launch_id: launch.id,
    updated_by: user.id,
    created_by: user.id,
  };

  const { error } = parsed.data.id
    ? await supabase.from("stakeholders").update(payload).eq("id", parsed.data.id)
    : await supabase.from("stakeholders").insert(payload);

  if (error) return { error: { _form: [error.message] } };
  revalidatePath("/operations/stakeholders");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteStakeholderAction(id: string) {
  if (isDemoMode()) {
    demoDeleteStakeholder(id);
    revalidatePath("/operations/stakeholders");
    revalidatePath("/dashboard");
    return { ok: true };
  }
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error } = await supabase.from("stakeholders").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/operations/stakeholders");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function upsertInvitationAction(formData: FormData) {
  const parsed = invitationSchema.safeParse({
    id: formData.get("id") || undefined,
    stakeholder_id: formData.get("stakeholder_id"),
    is_guest_attendee: formData.get("is_guest_attendee") === "on",
    delivery_status: formData.get("delivery_status"),
    rsvp_status: formData.get("rsvp_status"),
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  if (isDemoMode()) {
    demoUpsertInvitation({
      ...parsed.data,
      sent_at: parsed.data.delivery_status !== "draft" ? new Date().toISOString() : null,
      delivered_at:
        parsed.data.delivery_status === "delivered" ? new Date().toISOString() : null,
    });
    revalidatePath("/operations/stakeholders");
    revalidatePath("/dashboard");
    return { ok: true };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: { _form: ["Unauthorized"] } };

  const launch = await getActiveLaunch();

  const payload = {
    launch_id: launch.id,
    stakeholder_id: parsed.data.stakeholder_id,
    is_guest_attendee: parsed.data.is_guest_attendee,
    delivery_status: parsed.data.delivery_status as InvitationDeliveryStatus,
    rsvp_status: parsed.data.rsvp_status as InvitationRsvpStatus,
    updated_by: user.id,
    created_by: user.id,
  };

  const { error } = parsed.data.id
    ? await supabase.from("invitations").update(payload).eq("id", parsed.data.id)
    : await supabase.from("invitations").insert(payload);

  if (error) return { error: { _form: [error.message] } };
  revalidatePath("/operations/stakeholders");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function exportStakeholdersCsvAction(): Promise<string> {
  if (isDemoMode()) {
    const { getDemoStakeholders, getDemoInvitations } = await import(
      "@/lib/data/demo-store"
    );
    const rows = [
      ["full_name", "email", "organization", "title", "invitations", "confirmed"],
      ...getDemoStakeholders().map((s) => {
        const inv = getDemoInvitations().filter((i) => i.stakeholder_id === s.id);
        return [
          s.full_name,
          s.email,
          s.organization ?? "",
          s.title ?? "",
          String(inv.length),
          String(inv.filter((i) => i.rsvp_status === "confirmed").length),
        ];
      }),
    ];
    return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  }
  return "";
}
