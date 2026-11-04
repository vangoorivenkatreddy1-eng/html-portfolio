import { connection } from "next/server";
import { AppShell } from "@/components/layout/app-shell";
import { DemoBanner } from "@/components/demo-banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveLaunch, isDemoMode } from "@/lib/data/launch-service";
import { resolveReportingCadenceFromLaunch } from "@/lib/data/settings-service";

export const instant = false;

export default async function SettingsPage() {
  await connection();
  const launch = isDemoMode()
    ? (await import("@/lib/data/demo-store")).getDemoTransactionBundle().launch
    : await getActiveLaunch();
  const cadence = resolveReportingCadenceFromLaunch(launch);

  return (
    <AppShell title="Settings" subtitle="Launch master configuration">
      {launch.is_demo ? <DemoBanner /> : null}
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
    </AppShell>
  );
}
