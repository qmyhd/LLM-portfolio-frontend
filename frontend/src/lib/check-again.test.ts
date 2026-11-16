import { describe, expect, it, vi } from "vitest";
import { checkAgain, nextStepAfterCheck, signedInLabel } from "@/lib/check-again";

describe("nextStepAfterCheck", () => {
  it("enters for guest, family and owner", () => {
    for (const role of ["guest", "family", "owner"]) {
      expect(nextStepAfterCheck({ user: { role } })).toBe("enter");
    }
  });
  it("stays pending for pending, unknown and missing roles", () => {
    expect(nextStepAfterCheck({ user: { role: "pending" } })).toBe("still-pending");
    expect(nextStepAfterCheck({ user: { role: "editor" } })).toBe("still-pending");
    expect(nextStepAfterCheck({ user: {} })).toBe("still-pending");
  });
  it("fails without a session", () => {
    expect(nextStepAfterCheck(null)).toBe("failed");
    expect(nextStepAfterCheck(undefined)).toBe("failed");
  });
});

describe("checkAgain", () => {
  it("calls update with an argument (a bare call is only a GET)", async () => {
    const update = vi.fn().mockResolvedValue({ user: { role: "guest" } });
    expect(await checkAgain(update)).toBe("enter");
    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0]).toHaveLength(1);
    expect(typeof update.mock.calls[0][0]).toBe("object");
    expect(update.mock.calls[0][0]).not.toBeNull();
  });
  it("reports still-pending", async () => {
    const update = vi.fn().mockResolvedValue({ user: { role: "pending" } });
    expect(await checkAgain(update)).toBe("still-pending");
  });
  it("reports failed when update throws or returns nothing", async () => {
    expect(await checkAgain(vi.fn().mockRejectedValue(new Error("x")))).toBe("failed");
    expect(await checkAgain(vi.fn().mockResolvedValue(undefined))).toBe("failed");
  });
});

describe("signedInLabel", () => {
  it("strips the @local suffix", () => {
    expect(signedInLabel({ email: "sam@local", name: "sam" })).toBe("sam");
  });
  it("keeps a real email", () => {
    expect(signedInLabel({ email: "a@b.com" })).toBe("a@b.com");
  });
  it("falls back to the name, then null", () => {
    expect(signedInLabel({ name: "sam" })).toBe("sam");
    expect(signedInLabel(undefined)).toBeNull();
  });
});
