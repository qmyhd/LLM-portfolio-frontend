import { describe, expect, it } from "vitest";
import { formatTimeAgo } from "@/lib/format";

describe("formatTimeAgo", () => {
  const now = new Date(2026, 10, 12, 15, 0, 0).getTime(); // 12 Nov 2026, 15:00 local
  const at = (y: number, m: number, d: number, h = 12, min = 0) =>
    new Date(y, m, d, h, min).toISOString();

  it("says just now under a minute and for the future", () => {
    expect(formatTimeAgo(new Date(now - 20_000).toISOString(), now)).toBe("just now");
    expect(formatTimeAgo(new Date(now + 60_000).toISOString(), now)).toBe("just now");
  });
  it("uses minutes and hours with plurals", () => {
    expect(formatTimeAgo(new Date(now - 60_000).toISOString(), now)).toBe("1 minute ago");
    expect(formatTimeAgo(new Date(now - 5 * 60_000).toISOString(), now)).toBe("5 minutes ago");
    expect(formatTimeAgo(new Date(now - 3600_000).toISOString(), now)).toBe("1 hour ago");
    expect(formatTimeAgo(new Date(now - 3 * 3600_000).toISOString(), now)).toBe("3 hours ago");
  });
  it("says yesterday for the previous calendar day beyond 24 hours", () => {
    expect(formatTimeAgo(at(2026, 10, 11, 9), now)).toBe("yesterday");
  });
  it("uses days up to a week, then a short date", () => {
    expect(formatTimeAgo(at(2026, 10, 9, 9), now)).toBe("3 days ago");
    expect(formatTimeAgo(at(2026, 10, 1, 9), now)).toBe("1 Nov");
    expect(formatTimeAgo(at(2026, 9, 12, 9), now)).toBe("12 Oct");
  });
  it("adds the year for an earlier year", () => {
    expect(formatTimeAgo(at(2025, 11, 25, 9), now)).toBe("25 Dec 2025");
  });
  it("returns a placeholder for bad input", () => {
    expect(formatTimeAgo(null, now)).toBe("—");
    expect(formatTimeAgo("nope", now)).toBe("—");
  });
});
