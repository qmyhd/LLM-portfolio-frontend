import { describe, expect, it } from "vitest";
import { canChatFor, hasRole, roleRank } from "@/lib/roles";

describe("roleRank", () => {
  it("ranks a missing role 0", () => {
    expect(roleRank(undefined)).toBe(0);
    expect(roleRank(null)).toBe(0);
  });

  it("ranks the retired roles viewer and editor 0", () => {
    expect(roleRank("viewer")).toBe(0);
    expect(roleRank("editor")).toBe(0);
  });

  it("ranks an unknown string and a prototype key 0", () => {
    expect(roleRank("superuser")).toBe(0);
    expect(roleRank("constructor")).toBe(0);
  });

  it("ranks the four roles", () => {
    expect(roleRank("pending")).toBe(0);
    expect(roleRank("guest")).toBe(1);
    expect(roleRank("family")).toBe(1);
    expect(roleRank("owner")).toBe(3);
  });
});

describe("hasRole", () => {
  it("lets family meet guest", () => {
    expect(hasRole("family", "guest")).toBe(true);
  });

  it("keeps guest out of owner", () => {
    expect(hasRole("guest", "owner")).toBe(false);
  });

  it("keeps pending out of guest", () => {
    expect(hasRole("pending", "guest")).toBe(false);
  });

  it("denies a missing role", () => {
    expect(hasRole(undefined, "guest")).toBe(false);
  });
});

describe("canChatFor", () => {
  it("allows owner, guest and family", () => {
    expect(canChatFor("owner", false)).toBe(true);
    expect(canChatFor("guest", false)).toBe(true);
    expect(canChatFor("family", false)).toBe(true);
  });

  it("denies pending, missing and retired roles", () => {
    expect(canChatFor("pending", false)).toBe(false);
    expect(canChatFor(undefined, false)).toBe(false);
    expect(canChatFor("viewer", false)).toBe(false);
  });

  it("denies everything while loading", () => {
    expect(canChatFor("owner", true)).toBe(false);
    expect(canChatFor("guest", true)).toBe(false);
    expect(canChatFor("family", true)).toBe(false);
  });
});
