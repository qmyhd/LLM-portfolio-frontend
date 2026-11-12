import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { forgetRole, freshRole, RoleLookupError } from "@/lib/session-role";

const ID = "11111111-1111-1111-1111-111111111111";

function reply(status: number, body: unknown = {}) {
  return new Response(JSON.stringify(body), { status });
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
  });

  it("asks the backend with the API key and X-App-User, uncached", async () => {
    vi.stubEnv("API_SECRET_KEY", "k");
    fetchMock.mockResolvedValue(reply(200, { id: ID, role: "family" }));
    expect(await freshRole(ID)).toBe("family");
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/auth\/me$/);
    expect(init.cache).toBe("no-store");
    expect(init.headers["X-App-User"]).toBe(ID);
    vi.unstubAllEnvs();
  });

  it("caches for 30 seconds", async () => {
    fetchMock.mockResolvedValue(reply(200, { role: "guest" }));
    await freshRole(ID);
    vi.advanceTimersByTime(30_000);
    expect(await freshRole(ID)).toBe("guest");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refetches at 31 seconds", async () => {
    fetchMock.mockImplementation(async () => reply(200, { role: "guest" }));
    await freshRole(ID);
    vi.advanceTimersByTime(31_000);
    await freshRole(ID);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("maps 404 to pending", async () => {
    fetchMock.mockResolvedValue(reply(404));
    expect(await freshRole(ID)).toBe("pending");
  });

  it("throws RoleLookupError on 500", async () => {
    fetchMock.mockResolvedValue(reply(500));
    await expect(freshRole(ID)).rejects.toBeInstanceOf(RoleLookupError);
  });

  it("throws RoleLookupError on a network error", async () => {
    fetchMock.mockRejectedValue(new Error("down"));
    await expect(freshRole(ID)).rejects.toBeInstanceOf(RoleLookupError);
  });

  it("forgetRole forces a refetch", async () => {
    fetchMock.mockImplementation(async () => reply(200, { role: "guest" }));
    await freshRole(ID);
    forgetRole(ID);
    await freshRole(ID);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("treats an unknown role string as pending", async () => {
    fetchMock.mockResolvedValue(reply(200, { role: "editor" }));
    expect(await freshRole(ID)).toBe("pending");
  });
});
