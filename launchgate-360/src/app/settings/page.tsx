import { connection } from "next/server";
import { AppShell } from "@/components/layout/app-shell";
import { DemoBanner } from "@/components/demo-banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { getCurrentMembership, getActiveLaunch, isDemoMode } from "@/lib/data/launch-service";
import { resolveReportingCadenceFromLaunch } from "@/lib/data/settings-service";

export const instant = false;

export default async function SettingsPage() {
  await connection();
  const launch = isDemoMode()
    ? (await import("@/lib/data/demo-store")).getDemoTransactionBundle().launch
    : await getActiveLaunch();
  const cadence = resolveReportingCadenceFromLaunch(launch);
  const membership = isDemoMode() ? null : await getCurrentMembership(launch.id);

  return (
    <AppShell title="Settings" subtitle="Launch master configuration">
      {launch.is_demo ? <DemoBanner /> : null}
      <div className="mb-4 flex justify-end">
        <SignOutButton />
      </div>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">Launch date &amp; reporting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p>
            <span className="font-medium">Launch date:</span> {launch.launch_date}
          </p>
          <p>
            <span className="font-medium">Reporting cadence (computed):</span> {cadence}
          </p>
          <p className="text-slate-600">
            Monthly reporting until T-60, weekly from T-60 through launch, then live-day
            mode. Snapshots and PDF downloads require a valid launch date (enforced server-side).
          </p>
        </CardContent>
      </Card>
      {!isDemoMode() ? (
        <Card className="mt-6 max-w-xl">
          <CardHeader>
            <CardTitle className="text-base">Your access</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700">
            {membership ? (
              <>
                <p>
                  <span className="font-medium">Role:</span> {membership.role}
                </p>
                <p>
                  <span className="font-medium">Domains:</span>{" "}
                  {membership.assigned_domains.length
                    ? membership.assigned_domains.join(", ")
                    : "—"}
                </p>
              </>
            ) : (
              <p className="text-amber-800">
                No launch membership found for your account. Ask PMO to add you in{" "}
                <code className="text-xs">launch_memberships</code>.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </AppShell>
  );
}
