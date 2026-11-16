import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  forgetRole,
  freshRole,
  refreshRole,
  RoleLookupError,
} from "@/lib/session-role";

const ID = "11111111-1111-1111-1111-111111111111";

function reply(status: number, body: unknown = {}) {
  return new Response(JSON.stringify(body), { status });
}

function ok(role: string, id = ID) {
  return reply(200, { id, role });
}

describe("freshRole", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    forgetRole();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("asks the backend with the API key and X-App-User, uncached", async () => {
    vi.stubEnv("API_SECRET_KEY", "k");
    fetchMock.mockImplementation(async () => ok("family"));
    expect(await freshRole(ID)).toBe("family");
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/auth\/me$/);
    expect(init.cache).toBe("no-store");
    expect(init.headers.Authorization).toBe("Bearer k");
    expect(init.headers["X-App-User"]).toBe(ID);
  });

  it("caches for 30 seconds", async () => {
    fetchMock.mockImplementation(async () => ok("guest"));
    await freshRole(ID);
    vi.advanceTimersByTime(30_000);
    expect(await freshRole(ID)).toBe("guest");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refetches at 31 seconds", async () => {
    fetchMock.mockImplementation(async () => ok("guest"));
    await freshRole(ID);
    vi.advanceTimersByTime(31_000);
    await freshRole(ID);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("maps 404 to pending", async () => {
    fetchMock.mockImplementation(async () => reply(404));
    expect(await freshRole(ID)).toBe("pending");
  });

  it("throws RoleLookupError on 500", async () => {
    fetchMock.mockImplementation(async () => reply(500));
    await expect(freshRole(ID)).rejects.toBeInstanceOf(RoleLookupError);
  });

  it("throws RoleLookupError on a network error", async () => {
    fetchMock.mockRejectedValue(new Error("down"));
    await expect(freshRole(ID)).rejects.toBeInstanceOf(RoleLookupError);
  });

  it("throws RoleLookupError when the body is not JSON", async () => {
    fetchMock.mockImplementation(async () => new Response("<html>", { status: 200 }));
    await expect(freshRole(ID)).rejects.toBeInstanceOf(RoleLookupError);
  });

  it("aborts after 5 seconds and throws RoleLookupError", async () => {
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        })
    );
    const p = freshRole(ID);
    const assertion = expect(p).rejects.toBeInstanceOf(RoleLookupError);
    await vi.advanceTimersByTimeAsync(5_000);
    await assertion;
  });

  it("forgetRole forces a refetch", async () => {
    fetchMock.mockImplementation(async () => ok("guest"));
    await freshRole(ID);
    forgetRole(ID);
    await freshRole(ID);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("treats an unknown role string as pending", async () => {
    fetchMock.mockImplementation(async () => ok("editor"));
    expect(await freshRole(ID)).toBe("pending");
  });

  it("concurrent calls for one id make one request", async () => {
    fetchMock.mockImplementation(async () => ok("family"));
    const roles = await Promise.all(Array.from({ length: 10 }, () => freshRole(ID)));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(roles).toEqual(Array(10).fill("family"));
  });

  it("a failed shared request rejects all waiters and the next call retries", async () => {
    fetchMock.mockImplementationOnce(async () => reply(500));
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () => freshRole(ID))
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    for (const r of results) {
      expect(r.status).toBe("rejected");
      expect((r as PromiseRejectedResult).reason).toBeInstanceOf(RoleLookupError);
    }
    fetchMock.mockImplementation(async () => ok("guest"));
    expect(await freshRole(ID)).toBe("guest");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects a response for a different id and caches nothing", async () => {
    fetchMock.mockImplementationOnce(async () => ok("owner", "someone-else"));
    await expect(freshRole(ID)).rejects.toBeInstanceOf(RoleLookupError);
    fetchMock.mockImplementation(async () => ok("guest"));
    expect(await freshRole(ID)).toBe("guest");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("matches the id case-insensitively", async () => {
    fetchMock.mockImplementation(async () => ok("guest", ID.toUpperCase()));
    expect(await freshRole(ID)).toBe("guest");
  });

  it("drops entries older than 30 seconds when writing", async () => {
    fetchMock.mockImplementation(async (_u: string, init: RequestInit) =>
      ok("guest", (init.headers as Record<string, string>)["X-App-User"])
    );
    await freshRole("old-user");
    vi.advanceTimersByTime(31_000);
    await freshRole("new-user");
    fetchMock.mockClear();
    await freshRole("old-user");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("clears the cache when it grows past 5000 entries", async () => {
    fetchMock.mockImplementation(async (_u: string, init: RequestInit) =>
      ok("guest", (init.headers as Record<string, string>)["X-App-User"])
    );
    for (let i = 0; i < 5002; i++) await freshRole(`u${i}`);
    fetchMock.mockClear();
    await freshRole("u5001"); // the write that saw 5001 entries cleared the map first
    expect(fetchMock).not.toHaveBeenCalled();
    await freshRole("u0"); // cleared
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("refreshRole", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => ok("guest"));
    vi.stubGlobal("fetch", fetchMock);
    forgetRole();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("two calls within 5 seconds make one request", async () => {
    await refreshRole(ID);
    vi.advanceTimersByTime(4_000);
    expect(await refreshRole(ID)).toBe("guest");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("a call after 5 seconds makes a new request", async () => {
    await refreshRole(ID);
    vi.advanceTimersByTime(6_000);
    await refreshRole(ID);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shares the in-flight request with freshRole", async () => {
    await Promise.all([freshRole(ID), refreshRole(ID)]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
