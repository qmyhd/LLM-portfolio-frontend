import { describe, expect, it } from "vitest";
import { hasRole, roleRank } from "@/lib/roles";

describe("roleRank", () => {
  it("ranks a missing role 0", () => {
    expect(roleRank(undefined)).toBe(0);
    expect(roleRank(null)).toBe(0);
  });

  it("ranks the retired roles viewer and editor 0", () => {
    expect(roleRank("viewer")).toBe(0);
    expect(roleRank("editor")).toBe(0);
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
