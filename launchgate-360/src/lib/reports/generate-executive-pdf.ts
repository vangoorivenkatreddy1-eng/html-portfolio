import PDFDocument from "pdfkit";
import type {
  ExecutiveKpis,
  ExecutiveReportSnapshot,
  Launch,
} from "@/lib/types/domain";
import { compareKpiMovement } from "@/lib/kpi/aggregate";

function formatMoney(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString("en-IN")}`;
}

function kpiLine(doc: InstanceType<typeof PDFDocument>, label: string, value: string | number) {
  doc.fontSize(10).fillColor("#1a2e44").text(`${label}: `, { continued: true });
  doc.fillColor("#0d9488").text(String(value));
}

export async function generateExecutiveReportPdf(options: {
  launch: Launch;
  kpis: ExecutiveKpis;
  previousSnapshot: ExecutiveReportSnapshot | null;
  periodStart: string;
  periodEnd: string;
  cadence: string;
  exceptions: string[];
  decisions: string[];
  nextPriorities: string[];
}): Promise<Buffer> {
  const movement = compareKpiMovement(
    options.kpis,
    options.previousSnapshot?.kpi_values ?? null,
  );

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Page 1 — KPIs
    doc
      .fontSize(18)
      .fillColor("#0f2744")
      .text("LaunchGate 360 — Executive Report", { align: "left" });
    doc
      .fontSize(11)
      .fillColor("#64748b")
      .text(
        `${options.launch.name} · Period ${options.periodStart} to ${options.periodEnd} · ${options.cadence}`,
      );
    if (options.launch.is_demo) {
      doc.fillColor("#b45309").text(`Dataset: ${options.launch.demo_label ?? "DEMO"} — not live confirmations`);
    }
    doc.moveDown();

    doc.fontSize(13).fillColor("#0f2744").text("Page 1 — Key performance indicators");
    doc.moveDown(0.5);

    kpiLine(doc, "Stakeholders identified", options.kpis.stakeholdersIdentified);
    kpiLine(doc, "Invitations delivered", options.kpis.invitationsDelivered);
    kpiLine(doc, "Guest confirmations", options.kpis.guestConfirmations);
    kpiLine(doc, "Flight segments confirmed", options.kpis.flightBookingsConfirmed);
    kpiLine(doc, "Room nights required", options.kpis.roomNightsRequired);
    kpiLine(doc, "Rooms booked/confirmed", options.kpis.roomsBookedOrConfirmed);
    kpiLine(doc, "Transport assignments confirmed", options.kpis.transportAssignmentsConfirmed);
    kpiLine(doc, "Launch vehicles ready", `${options.kpis.vehiclesInspectionReady}/${options.kpis.vehiclesRequired}`);
    kpiLine(doc, "Venue attendance / capacity", `${options.kpis.venueExpectedAttendance} / ${options.kpis.venueCapacity}`);
    kpiLine(
      doc,
      "Budget committed",
      formatMoney(options.kpis.budgetCommitted, options.kpis.budgetCurrency),
    );
    kpiLine(
      doc,
      "PR under approval",
      options.kpis.prCounts.under_approval + options.kpis.prCounts.raised,
    );
    kpiLine(doc, "PO in preparation/approval", options.kpis.poCounts.preparation + options.kpis.poCounts.under_approval);

    doc.addPage();

    // Page 2 — movement & priorities
    doc.fontSize(13).fillColor("#0f2744").text("Page 2 — Movement, exceptions, decisions");
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#1a2e44").text("Period-on-period movement (vs prior reporting snapshot):");
    doc.moveDown(0.3);
    for (const [key, delta] of Object.entries(movement)) {
      const label = key.replace(/([A-Z])/g, " $1");
      doc
        .fontSize(10)
        .fillColor("#334155")
        .text(`• ${label}: ${delta === "N/A" ? "N/A" : delta >= 0 ? `+${delta}` : delta}`);
    }

    doc.moveDown();
    doc.fontSize(11).text("Exceptions:");
    (options.exceptions.length ? options.exceptions : options.kpis.inconsistencies).forEach(
      (line) => doc.fontSize(10).text(`• ${line}`),
    );

    doc.moveDown();
    doc.fontSize(11).text("Decisions recorded this period:");
    (options.decisions.length ? options.decisions : ["None recorded"]).forEach((line) =>
      doc.fontSize(10).text(`• ${line}`),
    );

    doc.moveDown();
    doc.fontSize(11).text("Next priorities:");
    (options.nextPriorities.length
      ? options.nextPriorities
      : ["Continue weekly cadence within T-60 window."]
    ).forEach((line) => doc.fontSize(10).text(`• ${line}`));

    doc.end();
  });
}
