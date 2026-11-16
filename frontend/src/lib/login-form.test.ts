import { describe, expect, it } from "vitest";
import { buildCredentials, INVALID_MESSAGE, loginErrorMessage } from "@/lib/login-form";

describe("loginErrorMessage", () => {
  it("words each code", () => {
    expect(loginErrorMessage("locked")).toBe("Too many wrong passwords. Try again in 15 minutes.");
    expect(loginErrorMessage("rate_limited")).toBe(
      "Too many sign-in attempts. Wait a minute and try again."
    );
    expect(loginErrorMessage("unavailable")).toBe(
      "Can't reach the server right now. Try again in a moment."
    );
  });
  it("falls back to the invalid message", () => {
    for (const code of ["credentials", "", undefined, null, "toString", "constructor"]) {
      expect(loginErrorMessage(code)).toBe(INVALID_MESSAGE);
    }
  });
});

describe("buildCredentials", () => {
  it("sends the password unchanged, spaces included", () => {
    expect(buildCredentials("  sam ", "  pass word  ").password).toBe("  pass word  ");
  });
  it("trims the username", () => {
    expect(buildCredentials("  sam ", "x").username).toBe("sam");
  });
});
