import { describe, expect, it } from "vitest";
import { decide } from "@/lib/middleware-rules";

const WAITING = {
  action: "deny",
  status: 403,
  error: "This account is waiting for approval",
} as const;
const NEEDS_OWNER = {
  action: "deny",
  status: 403,
  error: "This action needs the owner",
} as const;
const NEXT = { action: "next" } as const;
const SIGN_IN_AGAIN = {
  action: "deny",
  status: 401,
  error: "Please sign in again",
} as const;

const as =
  (role: string | null | undefined) =>
  (pathname: string, method = "GET") =>
    decide({ pathname, method, signedIn: true, hasUserId: true, role });

const signedOut = (pathname: string, method = "GET") =>
  decide({ pathname, method, signedIn: false, hasUserId: false, role: null });

describe("decide: signed out", () => {
  it("redirects a page to login with callbackUrl", () => {
    expect(signedOut("/portfolio")).toEqual({
      action: "redirect",
      to: "/login?callbackUrl=%2Fportfolio",
    });
  });
  it("lets /login through", () => {
    expect(signedOut("/login")).toEqual(NEXT);
  });
  it("lets a static file through", () => {
    expect(signedOut("/logo.png")).toEqual(NEXT);
  });
  it("does not treat /api/people/x.png as a static file", () => {
    expect(signedOut("/api/people/x.png")).toMatchObject({ action: "redirect" });
  });
  it("lets /api/auth/session through", () => {
    expect(signedOut("/api/auth/session")).toEqual(NEXT);
  });
});

describe("decide: session without a user id", () => {
  const noId = (pathname: string, method = "GET") =>
    decide({ pathname, method, signedIn: true, hasUserId: false, role: "owner" });
  it("redirects a page to login with callbackUrl", () => {
    expect(noId("/")).toEqual({ action: "redirect", to: "/login?callbackUrl=%2F" });
  });
  it("lets /login render instead of bouncing to /", () => {
    expect(noId("/login")).toEqual(NEXT);
  });
  it("answers /api data routes with 401", () => {
    expect(noId("/api/portfolio")).toEqual(SIGN_IN_AGAIN);
    expect(noId("/api/portfolio", "POST")).toEqual(SIGN_IN_AGAIN);
  });
  it("lets /api/auth/session through", () => {
    expect(noId("/api/auth/session")).toEqual(NEXT);
  });
  it("redirects /pending to login", () => {
    expect(noId("/pending")).toEqual({
      action: "redirect",
      to: "/login?callbackUrl=%2Fpending",
    });
  });
});

describe("decide: pending", () => {
  const pending = as("pending");
  it("sends pages to /pending", () => {
    expect(pending("/")).toEqual({ action: "redirect", to: "/pending" });
  });
  it("lets /pending render", () => {
    expect(pending("/pending")).toEqual(NEXT);
  });
  it("sends /login to / (which then moves on to /pending)", () => {
    expect(pending("/login")).toEqual({ action: "redirect", to: "/" });
  });
  it("denies API data routes with the exact text", () => {
    expect(pending("/api/portfolio")).toEqual(WAITING);
  });
  it("lets /api/auth/session through", () => {
    expect(pending("/api/auth/session", "POST")).toEqual(NEXT);
  });
  it("treats an unknown role string as pending", () => {
    expect(as("editor")("/api/portfolio")).toEqual(WAITING);
    expect(as("editor")("/")).toEqual({ action: "redirect", to: "/pending" });
  });
  it("may load a static file", () => {
    expect(pending("/logo.png")).toEqual(NEXT);
  });
  it("treats a missing role as pending", () => {
    expect(as(undefined)("/api/portfolio")).toEqual(WAITING);
    expect(as(null)("/")).toEqual({ action: "redirect", to: "/pending" });
  });
});

describe("decide: guest", () => {
  const guest = as("guest");
  it("is moved off /pending", () => {
    expect(guest("/pending")).toEqual({ action: "redirect", to: "/" });
  });
  it("may read the API", () => {
    expect(guest("/api/portfolio")).toEqual(NEXT);
  });
  it("may POST chat for one ticker", () => {
    expect(guest("/api/stocks/NVDA/chat", "POST")).toEqual(NEXT);
  });
  it("may not POST a longer chat path", () => {
    expect(guest("/api/stocks/NVDA/chat/extra", "POST")).toEqual(NEEDS_OWNER);
  });
  it("may not POST chat under a multi-segment ticker", () => {
    expect(guest("/api/stocks/a/b/chat", "POST")).toEqual(NEEDS_OWNER);
  });
  it("may not DELETE on the chat path", () => {
    expect(guest("/api/stocks/NVDA/chat", "DELETE")).toEqual(NEEDS_OWNER);
  });
  it("may not use an encoded-slash chat path", () => {
    expect(guest("/api/stocks/a%2Fb/chat", "POST")).toEqual(NEEDS_OWNER);
  });
  it("may not use a trailing-slash chat path", () => {
    expect(guest("/api/stocks/NVDA/chat/", "POST")).toEqual(NEEDS_OWNER);
  });
  it("may not PUT other stock routes", () => {
    expect(guest("/api/stocks/NVDA/profile", "PUT")).toEqual(NEEDS_OWNER);
  });
  it("may not read /api/connections", () => {
    expect(guest("/api/connections")).toEqual(NEEDS_OWNER);
  });
  it("may not read /api/users sub-paths", () => {
    expect(guest("/api/users/abc")).toEqual(NEEDS_OWNER);
  });
  it("is not blocked on /api/usersx (path boundary)", () => {
    expect(guest("/api/usersx")).toEqual(NEXT);
  });
  it("is sent from /settings/users to /settings", () => {
    expect(guest("/settings/users")).toEqual({ action: "redirect", to: "/settings" });
    expect(guest("/settings/users/x")).toEqual({ action: "redirect", to: "/settings" });
  });
  it("may open /settings and /settings/usersx", () => {
    expect(guest("/settings")).toEqual(NEXT);
    expect(guest("/settings/usersx")).toEqual(NEXT);
  });
});

describe("decide: family", () => {
  it("may chat but not make other writes", () => {
    expect(as("family")("/api/stocks/NVDA/chat", "POST")).toEqual(NEXT);
    expect(as("family")("/api/journal", "POST")).toEqual(NEEDS_OWNER);
  });
});

describe("decide: owner", () => {
  const owner = as("owner");
  it("passes everywhere", () => {
    expect(owner("/")).toEqual(NEXT);
    expect(owner("/settings/users")).toEqual(NEXT);
    expect(owner("/api/connections")).toEqual(NEXT);
    expect(owner("/api/users/abc", "DELETE")).toEqual(NEXT);
    expect(owner("/api/stocks/NVDA/profile", "PUT")).toEqual(NEXT);
  });
  it("is moved off /pending", () => {
    expect(owner("/pending")).toEqual({ action: "redirect", to: "/" });
  });
});
