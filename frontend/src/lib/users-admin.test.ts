import { describe, expect, it } from "vitest";
import {
  displayName,
  initialsFor,
  normaliseUsername,
  splitUsers,
  validateNewAccount,
  validatePassword,
  validateUsername,
} from "@/lib/users-admin";
import type { AppUserRow } from "@/types/api";

function row(over: Partial<AppUserRow> = {}): AppUserRow {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    provider: "google",
    username: null,
    email: "pat@example.com",
    fullName: null,
    avatarUrl: null,
    role: "guest",
    createdAt: "2026-11-01T10:00:00Z",
    lastSeenAt: "2026-11-10T10:00:00Z",
    isSelf: false,
    ...over,
  };
}

describe("normaliseUsername", () => {
  it("trims and lower-cases", () => {
    expect(normaliseUsername("  Pat.Smith ")).toBe("pat.smith");
  });
});

describe("validateUsername", () => {
  it("accepts a normalised name", () => {
    expect(validateUsername("pat.smith-2")).toBeNull();
    expect(validateUsername("abc")).toBeNull();
  });
  it("accepts a name that only needs normalising", () => {
    expect(validateUsername("  PatSmith ")).toBeNull();
  });
  it("rejects empty, short, long and odd characters", () => {
    expect(validateUsername("")).not.toBeNull();
    expect(validateUsername("ab")).not.toBeNull();
    expect(validateUsername("a".repeat(33))).not.toBeNull();
    expect(validateUsername("a".repeat(32))).toBeNull();
    expect(validateUsername("pat smith")).not.toBeNull();
    expect(validateUsername("-pat")).not.toBeNull();
    expect(validateUsername(".pat")).not.toBeNull();
    expect(validateUsername("pat@x")).not.toBeNull();
  });
});

describe("validatePassword", () => {
  const ok = "correct horse";
  it("accepts 10 characters for guest and family", () => {
    expect(validatePassword("a".repeat(10), "a".repeat(10), "guest")).toBeNull();
    expect(validatePassword("a".repeat(10), "a".repeat(10), "family")).toBeNull();
  });
  it("rejects 9 characters", () => {
    expect(validatePassword("a".repeat(9), "a".repeat(9), "guest")).not.toBeNull();
  });
  it("needs 14 for an owner", () => {
    expect(validatePassword("a".repeat(13), "a".repeat(13), "owner")).not.toBeNull();
    expect(validatePassword("a".repeat(14), "a".repeat(14), "owner")).toBeNull();
  });
  it("allows 128 and rejects 129", () => {
    expect(validatePassword("a".repeat(128), "a".repeat(128), "guest")).toBeNull();
    expect(validatePassword("a".repeat(129), "a".repeat(129), "guest")).not.toBeNull();
  });
  it("rejects whitespace only", () => {
    expect(validatePassword(" ".repeat(12), " ".repeat(12), "guest")).not.toBeNull();
  });
  it("does not trim: leading and trailing spaces count and are allowed", () => {
    const pw = "  " + "a".repeat(8);
    expect(validatePassword(pw, pw, "guest")).toBeNull();
  });
  it("rejects a mismatch, case-sensitively", () => {
    expect(validatePassword(ok, ok + "x", "guest")).toMatch(/match/i);
    expect(validatePassword(ok, ok.toUpperCase(), "guest")).toMatch(/match/i);
  });
  it("counts characters, not UTF-16 units", () => {
    const pw = "😀".repeat(10);
    expect(validatePassword(pw, pw, "guest")).toBeNull();
  });
});

describe("validateNewAccount", () => {
  it("reports the username problem first", () => {
    expect(
      validateNewAccount({ username: "x", password: "a".repeat(12), confirm: "a".repeat(12), role: "guest" }),
    ).toMatch(/username/i);
  });
  it("passes a good account", () => {
    expect(
      validateNewAccount({ username: "Pat", password: "a".repeat(12), confirm: "a".repeat(12), role: "guest" }),
    ).toBeNull();
  });
});

describe("displayName and initialsFor", () => {
  it("falls back from full name to username to email", () => {
    expect(displayName(row({ fullName: "Pat Smith", username: "pat" }))).toBe("Pat Smith");
    expect(displayName(row({ fullName: "  ", username: "pat" }))).toBe("pat");
    expect(displayName(row({ fullName: null, username: null }))).toBe("pat@example.com");
  });
  it("makes initials", () => {
    expect(initialsFor("Pat Smith")).toBe("PS");
    expect(initialsFor("pat")).toBe("P");
    expect(initialsFor("pat@example.com")).toBe("P");
    expect(initialsFor("")).toBe("?");
  });
});

describe("splitUsers", () => {
  it("splits pending from the rest, keeping order", () => {
    const { waiting, withAccess } = splitUsers([
      row({ id: "a", role: "pending" }),
      row({ id: "b", role: "owner", isSelf: true }),
      row({ id: "c", role: "family" }),
      row({ id: "d", role: "pending" }),
    ]);
    expect(waiting.map((u) => u.id)).toEqual(["a", "d"]);
    expect(withAccess.map((u) => u.id)).toEqual(["b", "c"]);
  });
  it("labels rows", () => {
    const { withAccess } = splitUsers([
      row({ id: "a", provider: "password", username: "pat", email: "", isSelf: false }),
      row({ id: "b", provider: "google", fullName: "Qais", isSelf: true, role: "owner" }),
    ]);
    expect(withAccess[0]).toMatchObject({ providerLabel: "Password", name: "pat", isYou: false, secondary: "pat" });
    expect(withAccess[1]).toMatchObject({ providerLabel: "Google", name: "Qais", isYou: true, secondary: "pat@example.com" });
  });
  it("handles an empty list", () => {
    expect(splitUsers([])).toEqual({ waiting: [], withAccess: [] });
  });
});
