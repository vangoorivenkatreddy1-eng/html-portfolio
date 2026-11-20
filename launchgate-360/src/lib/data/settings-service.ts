import { resolveReportingCadence } from "@/lib/kpi/aggregate";
import type { Launch } from "@/lib/types/domain";
export { getActiveLaunch } from "@/lib/data/launch-service";

export function resolveReportingCadenceFromLaunch(launch: Launch) {
  return resolveReportingCadence(launch, new Date());
}
