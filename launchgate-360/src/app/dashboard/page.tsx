import { connection } from "next/server";
import { AppShell } from "@/components/layout/app-shell";
import { DemoBanner } from "@/components/demo-banner";
import { ExecutiveReportActions } from "@/components/dashboard/executive-report-actions";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DEMO_LAUNCH_ID,
} from "@/lib/data/demo-store";
import {
  getActiveLaunch,
  getExecutiveDashboardData,
  isDemoMode,
} from "@/lib/data/launch-service";

export const instant = false;

export default async function DashboardPage() {
  await connection();
  const launch = isDemoMode()
    ? (await getExecutiveDashboardData(DEMO_LAUNCH_ID)).launch
    : await getActiveLaunch();
  const { kpis, cadence } = await getExecutiveDashboardData(launch.id);

  return (
    <AppShell
      title="Executive dashboard"
      subtitle={`${launch.name} · Launch ${launch.launch_date} · Reporting: ${cadence}`}
    >
      {launch.is_demo ? <DemoBanner /> : null}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-600">
            Quantitative overview — task detail lives in operations workspaces.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary">Planning &amp; Governance</Badge>
            <Badge variant="secondary">People &amp; Event Ops</Badge>
            <Badge variant="secondary">Vehicle &amp; Commercial</Badge>
          </div>
        </div>
        <ExecutiveReportActions launchId={launch.id} />
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Stakeholders identified" value={kpis.stakeholdersIdentified} />
        <KpiCard label="Invitations delivered" value={kpis.invitationsDelivered} hint={`Sent: ${kpis.invitationsSent}`} />
        <KpiCard label="Guest confirmations" value={kpis.guestConfirmations} hint={`Pending reply: ${kpis.invitationsPendingReply}`} />
        <KpiCard label="Checked in" value={kpis.stakeholdersCheckedIn} />
        <KpiCard label="Passengers needing flights" value={kpis.passengersNeedingFlights} />
        <KpiCard label="Flight segments (confirmed / total)" value={`${kpis.flightBookingsConfirmed} / ${kpis.flightSegmentsNeeded}`} />
        <KpiCard label="Room nights required" value={kpis.roomNightsRequired} hint={`Unique rooms: ${kpis.uniqueRoomsRequired}`} />
        <KpiCard label="Rooms booked/confirmed" value={kpis.roomsBookedOrConfirmed} />
        <KpiCard label="Transport confirmed / required" value={`${kpis.transportAssignmentsConfirmed} / ${kpis.transportAssignmentsRequired}`} />
        <KpiCard label="Vehicles ready" value={`${kpis.vehiclesInspectionReady} / ${kpis.vehiclesRequired}`} />
        <KpiCard label="Venue attendance" value={`${kpis.venueExpectedAttendance} / ${kpis.venueCapacity}`} hint={kpis.venueContractStatus} />
        <KpiCard
          label="Budget committed"
          value={`${kpis.budgetCurrency} ${kpis.budgetCommitted.toLocaleString("en-IN")}`}
          hint={`Approved ${kpis.budgetApproved.toLocaleString("en-IN")}`}
        />
        <KpiCard label="PR under workflow" value={kpis.prCounts.under_approval + kpis.prCounts.raised} />
        <KpiCard label="PO in preparation" value={kpis.poCounts.preparation + kpis.poCounts.under_approval} />
      </section>

      {kpis.inconsistencies.length ? (
        <Card className="mt-6 border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-base text-amber-900">Reconciliation alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-amber-950">
              {kpis.inconsistencies.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </AppShell>
  );
}
