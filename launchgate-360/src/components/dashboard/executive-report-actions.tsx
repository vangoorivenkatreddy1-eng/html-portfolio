import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";

export function ExecutiveReportActions({ launchId: _launchId }: { launchId: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href="/api/reports/executive"
        className={cn(
          buttonVariants({ variant: "default", size: "lg" }),
          "bg-[var(--lg-teal)] text-white hover:bg-teal-700",
        )}
      >
        <Download className="mr-2 size-4" />
        Download Executive Report
      </Link>
      <Link
        href="/api/reports/executive?schedule=1"
        className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
      >
        Download &amp; store snapshot
      </Link>
    </div>
  );
}
