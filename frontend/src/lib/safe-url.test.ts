import { describe, expect, it } from "vitest";
import { safeHttpsImageUrl } from "@/lib/safe-url";

describe("safeHttpsImageUrl", () => {
  it("keeps an https URL", () => {
    expect(safeHttpsImageUrl("https://lh3.googleusercontent.com/a/x=s96")).toBe(
      "https://lh3.googleusercontent.com/a/x=s96",
    );
  });
  it.each([
    "http://example.com/a.png",
    "data:image/png;base64,AAAA",
    "javascript:alert(1)",
    "blob:https://example.com/123",
    "/avatars/a.png",
    "//example.com/a.png",
    "",
    "not a url",
  ])("rejects %s", (v) => {
    expect(safeHttpsImageUrl(v)).toBeNull();
  });
  it("rejects null and undefined", () => {
    expect(safeHttpsImageUrl(null)).toBeNull();
    expect(safeHttpsImageUrl(undefined)).toBeNull();
  });
});
