import { describe, expect, it } from "vitest";
import {
  nextHotelStatuses,
  nextTransportStatuses,
} from "@/lib/operations/logistics-transitions";

describe("logistics transitions", () => {
  it("hotel path supports block and allocation flows", () => {
    expect(nextHotelStatuses("required")).toContain("pending_allocation");
    expect(nextHotelStatuses("pending_allocation")).toEqual(["confirmed"]);
  });

  it("transport progresses assignment without skipping confirmed gate", () => {
    expect(nextTransportStatuses("required")).toEqual(["pending", "allocated"]);
    expect(nextTransportStatuses("allocated")).toEqual(["confirmed"]);
  });
});
