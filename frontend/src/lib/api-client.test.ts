import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.API_SECRET_KEY = "test-key";
});

const authMock = vi.fn();
const freshRoleMock = vi.fn();

vi.mock("@/auth", () => ({ auth: () => authMock() }));
vi.mock("@/lib/session-role", () => ({
  freshRole: (id: string) => freshRoleMock(id),
}));

import { backendFetch, requireRole } from "@/lib/api-client";

async function thrown(p: Promise<unknown>): Promise<Response> {
  try {
    await p;
  } catch (e) {
    return e as Response;
  }
  throw new Error("expected a thrown Response");
}

describe("requireRole", () => {
  beforeEach(() => {
    authMock.mockReset();
    freshRoleMock.mockReset();
  });

  it("401 with no session", async () => {
    authMock.mockResolvedValue(null);
    expect((await thrown(requireRole("guest"))).status).toBe(401);
  });

  it("403 for a session without user.id", async () => {
    authMock.mockResolvedValue({ user: { role: "guest" } });
    expect((await thrown(requireRole("guest"))).status).toBe(403);
    expect(freshRoleMock).not.toHaveBeenCalled();
  });

  it("503 for an owner session without user.id (sync fallback)", async () => {
    authMock.mockResolvedValue({ user: { role: "owner" } });
    const res = await thrown(requireRole("guest"));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Try again in a moment" });
  });

  it("503 when freshRole throws, ignoring the cookie role", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", role: "owner" } });
    freshRoleMock.mockRejectedValue(new Error("down"));
    const res = await thrown(requireRole("guest"));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Try again in a moment" });
  });

  it("403 when the cookie says guest but the backend says pending", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", role: "guest" } });
    freshRoleMock.mockResolvedValue("pending");
    expect((await thrown(requireRole("guest"))).status).toBe(403);
  });

  it("403 when the fresh rank is below the minimum", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", role: "owner" } });
    freshRoleMock.mockResolvedValue("family");
    expect((await thrown(requireRole("owner"))).status).toBe(403);
  });

  it("returns the session with the fresh role written in", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", role: "guest" } });
    freshRoleMock.mockResolvedValue("owner");
    const session = await requireRole("owner");
    expect(session.user.role).toBe("owner");
    expect(session.user.id).toBe("u1");
    expect(freshRoleMock).toHaveBeenCalledWith("u1");
  });
});

describe("backendFetch", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    authMock.mockReset();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);
  });

  it("sends X-App-User from the session", async () => {
    authMock.mockResolvedValue({ user: { id: "u1" } });
    await backendFetch("/portfolio");
    const init = fetchMock.mock.calls[0][1];
    expect(new Headers(init.headers).get("X-App-User")).toBe("u1");
  });

  it("the session's id wins over a caller-supplied header", async () => {
    authMock.mockResolvedValue({ user: { id: "u1" } });
    await backendFetch("/portfolio", { headers: { "x-app-user": "evil" } });
    const headers = new Headers(fetchMock.mock.calls[0][1].headers);
    expect(headers.get("X-App-User")).toBe("u1");
  });

  it("omits the header without a session and keeps caller headers", async () => {
    authMock.mockResolvedValue(null);
    await backendFetch("/portfolio", { headers: { "X-Extra": "1" } });
    const headers = new Headers(fetchMock.mock.calls[0][1].headers);
    expect(headers.get("X-App-User")).toBeNull();
    expect(headers.get("X-Extra")).toBe("1");
  });

  it("still refuses a traversal path", async () => {
    authMock.mockResolvedValue({ user: { id: "u1" } });
    await expect(backendFetch("/a/../b")).rejects.toBeInstanceOf(Response);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
