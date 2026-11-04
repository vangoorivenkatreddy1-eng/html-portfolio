"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteStakeholderAction,
  exportStakeholdersCsvAction,
  upsertInvitationAction,
  upsertStakeholderAction,
} from "@/app/actions/stakeholders";
import { AppShell } from "@/components/layout/app-shell";
import { DemoBanner } from "@/components/demo-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Invitation, Stakeholder } from "@/lib/types/domain";

export function StakeholdersWorkspace({
  stakeholders,
  invitations,
  isDemo,
}: {
  stakeholders: Stakeholder[];
  invitations: Invitation[];
  isDemo: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Stakeholder | null>(null);
  const router = useRouter();

  function inviteCounts(stakeholderId: string) {
    const rows = invitations.filter((i) => i.stakeholder_id === stakeholderId);
    return {
      total: rows.length,
      confirmed: rows.filter((i) => i.rsvp_status === "confirmed").length,
      guest: rows.filter((i) => i.is_guest_attendee).length,
    };
  }

  return (
    <AppShell
      title="Stakeholders & invitations"
      subtitle="Unique people, invitation delivery evidence, and guest attendees kept separate."
    >
      {isDemo ? <DemoBanner /> : null}

      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() =>
            startTransition(async () => {
              const csv = await exportStakeholdersCsvAction();
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "stakeholders-demo.csv";
              a.click();
              URL.revokeObjectURL(url);
            })
          }
        >
          Export CSV
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editing ? "Edit stakeholder" : "Add stakeholder"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              action={(fd) =>
                startTransition(async () => {
                  if (editing) fd.set("id", editing.id);
                  const result = await upsertStakeholderAction(fd);
                  if (result.error) {
                    toast.error("Could not save stakeholder");
                    return;
                  }
                  toast.success("Stakeholder saved");
                  setEditing(null);
                  router.refresh();
                })
              }
            >
              <div className="space-y-1">
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  required
                  defaultValue={editing?.full_name}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  defaultValue={editing?.email}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  name="organization"
                  defaultValue={editing?.organization ?? ""}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" defaultValue={editing?.title ?? ""} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={pending}>
                  Save
                </Button>
                {editing ? (
                  <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Record invitation</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              action={(fd) =>
                startTransition(async () => {
                  const result = await upsertInvitationAction(fd);
                  if (result.error) {
                    toast.error("Could not save invitation");
                    return;
                  }
                  toast.success("Invitation saved");
                  router.refresh();
                })
              }
            >
              <div className="space-y-1">
                <Label htmlFor="stakeholder_id">Stakeholder</Label>
                <select
                  id="stakeholder_id"
                  name="stakeholder_id"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">Select person</option>
                  {stakeholders.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input id="guest" name="is_guest_attendee" type="checkbox" className="size-4" />
                <Label htmlFor="guest">Guest attendee invitation</Label>
              </div>
              <div className="space-y-1">
                <Label htmlFor="delivery_status">Delivery status</Label>
                <select
                  id="delivery_status"
                  name="delivery_status"
                  defaultValue="sent"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {["draft", "sent", "delivered", "bounced", "failed"].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="rsvp_status">RSVP</Label>
                <select
                  id="rsvp_status"
                  name="rsvp_status"
                  defaultValue="pending_reply"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {["pending_reply", "confirmed", "declined"].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={pending}>
                Save invitation
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Stakeholder register</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Invitations</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stakeholders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-slate-500">
                    No stakeholders yet.
                  </TableCell>
                </TableRow>
              ) : (
                stakeholders.map((s) => {
                  const counts = inviteCounts(s.id);
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-medium">{s.full_name}</div>
                        <div className="text-xs text-slate-500">{s.organization}</div>
                      </TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{counts.total} records</Badge>{" "}
                        <span className="text-xs text-slate-600">
                          {counts.confirmed} confirmed · {counts.guest} guest
                        </span>
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button size="sm" variant="outline" onClick={() => setEditing(s)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            startTransition(async () => {
                              await deleteStakeholderAction(s.id);
                              toast.success("Deleted");
                              router.refresh();
                            })
                          }
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Invitation log</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stakeholder</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>RSVP</TableHead>
                <TableHead>Guest?</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((inv) => {
                const person = stakeholders.find((s) => s.id === inv.stakeholder_id);
                return (
                  <TableRow key={inv.id}>
                    <TableCell>{person?.full_name ?? inv.stakeholder_id}</TableCell>
                    <TableCell>{inv.delivery_status}</TableCell>
                    <TableCell>{inv.rsvp_status}</TableCell>
                    <TableCell>{inv.is_guest_attendee ? "Yes" : "No"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
