import { NextResponse } from "next/server";
import {
  getActiveLaunch,
  getCurrentMembership,
  getTransactionBundle,
  listReportSnapshots,
  validateLaunchDateForReporting,
} from "@/lib/data/launch-service";
import { aggregateExecutiveKpis, canDownloadExecutiveReport, resolveReportingCadence } from "@/lib/kpi/aggregate";
import { generateExecutiveReportPdf } from "@/lib/reports/generate-executive-pdf";

export async function GET(request: Request) {
  try {
    const launch = await getActiveLaunch();
    validateLaunchDateForReporting(launch);
    const membership = await getCurrentMembership(launch.id);
    if (!membership || !canDownloadExecutiveReport(membership)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const bundle = await getTransactionBundle(launch.id);
    const kpis = aggregateExecutiveKpis(bundle);
    const snapshots = await listReportSnapshots(launch.id);
    const previousSnapshot = snapshots[0] ?? null;
    const cadence = resolveReportingCadence(launch, new Date());
    const now = new Date();
    const periodEnd = now.toISOString().slice(0, 10);
    const periodStart = new Date(now.getTime() - 7 * 86400000)
      .toISOString()
      .slice(0, 10);

    const pdf = await generateExecutiveReportPdf({
      launch,
      kpis,
      previousSnapshot,
      periodStart,
      periodEnd,
      cadence,
      exceptions: kpis.inconsistencies,
      decisions: [],
      nextPriorities: [],
    });

    const url = new URL(request.url);
    const schedule = url.searchParams.get("schedule");
    if (schedule === "1" && !isDemoMode()) {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      await supabase.from("executive_report_snapshots").insert({
        launch_id: launch.id,
        reporting_period_start: periodStart,
        reporting_period_end: periodEnd,
        cadence,
        kpi_values: kpis,
        exceptions: kpis.inconsistencies,
        status: "published",
      });
    }

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="launchgate-executive-report-${periodEnd}.pdf"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Report failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function isDemoMode() {
  return (
    process.env.LAUNCHGATE_DEMO_MODE === "true" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL
  );
}
