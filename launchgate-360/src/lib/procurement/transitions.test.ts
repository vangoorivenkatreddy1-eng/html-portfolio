import { describe, expect, it } from "vitest";
import {
  assertTransitionAllowed,
  isApprovalTransition,
  nextPoStatuses,
  nextPrStatuses,
} from "@/lib/procurement/transitions";

describe("PR transitions", () => {
  it("allows linear raise and approval path", () => {
    expect(nextPrStatuses("not_raised")).toEqual(["raised"]);
    expect(nextPrStatuses("raised")).toEqual(["under_approval"]);
    expect(nextPrStatuses("under_approval")).toEqual(["approved", "rejected"]);
  });

  it("requires approver for under_approval decisions", () => {
    expect(isApprovalTransition("pr", "under_approval", "approved")).toBe(true);
    expect(isApprovalTransition("pr", "raised", "under_approval")).toBe(false);
  });

  it("rejects invalid jumps", () => {
    expect(() => assertTransitionAllowed("pr", "not_raised", "approved")).toThrow();
  });
});

describe("PO transitions", () => {
  it("maps preparation to approval gate", () => {
    expect(nextPoStatuses("preparation")).toEqual(["under_approval"]);
    expect(isApprovalTransition("po", "under_approval", "issued")).toBe(true);
  });
});
