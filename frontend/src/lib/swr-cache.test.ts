import { describe, expect, it } from "vitest";
import { authFailureTarget, cacheStorageKey, isCacheStorageKey, shouldPersistKey } from "@/lib/swr-cache";

describe("cacheStorageKey", () => {
  it("is per user", () => {
    expect(cacheStorageKey("a")).not.toBe(cacheStorageKey("b"));
    expect(cacheStorageKey("a")).toContain("a");
  });
  it("is null without a user id", () => {
    expect(cacheStorageKey(undefined)).toBeNull();
    expect(cacheStorageKey("")).toBeNull();
  });
});

describe("shouldPersistKey", () => {
  it("persists ordinary data", () => {
    expect(shouldPersistKey("/api/portfolio")).toBe(true);
    expect(shouldPersistKey("/api/usersx")).toBe(true);
  });
  it("never persists users or connections", () => {
    expect(shouldPersistKey("/api/users")).toBe(false);
    expect(shouldPersistKey("/api/users/abc")).toBe(false);
    expect(shouldPersistKey("/api/users?x=1")).toBe(false);
    expect(shouldPersistKey("/api/connections")).toBe(false);
    expect(shouldPersistKey("https://h/api/connections/x")).toBe(false);
  });
  it("skips non-string keys", () => {
    expect(shouldPersistKey(["/api/x", 1])).toBe(false);
  });
});

describe("authFailureTarget", () => {
  it("sends waiting-for-approval to /pending", () => {
    expect(authFailureTarget(new Error("This account is waiting for approval"))).toBe("/pending");
    expect(
      authFailureTarget({ status: 403, message: "This account is waiting for approval" })
    ).toBe("/pending");
  });
  it("sends a stale session to /login", () => {
    expect(authFailureTarget(new Error("Please sign in again"))).toBe("/login");
    expect(authFailureTarget({ status: 401, message: "Please sign in again" })).toBe("/login");
  });
  it("ignores other errors and mismatched statuses", () => {
    expect(authFailureTarget(new Error("Request failed (500)"))).toBeNull();
    expect(authFailureTarget({ status: 500, message: "Please sign in again" })).toBeNull();
    expect(authFailureTarget(null)).toBeNull();
    expect(authFailureTarget("x")).toBeNull();
  });
});

describe("isCacheStorageKey", () => {
  it("matches every user's key and the legacy key only", () => {
    expect(isCacheStorageKey(cacheStorageKey("a") as string)).toBe(true);
    expect(isCacheStorageKey("app-swr-cache-v1")).toBe(true);
    expect(isCacheStorageKey("theme")).toBe(false);
  });
});
