// ทดสอบการต่ออายุ session ใน client.ts: token หมดอายุ / refresh / refresh ไม่ผ่าน / ยิงพร้อมกัน / logout / หลายแท็บ
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---- สภาพแวดล้อมแบบ browser ที่ใช้ร่วมกันทุกแท็บ: localStorage + storage event + Web Locks ----
const win = new EventTarget();
const data = new Map<string, string>();
const localStorageFake = {
  getItem: (k: string) => data.get(k) ?? null,
  setItem: (k: string, v: string) => {
    data.set(k, v);
    // browser ส่ง storage event ไปให้แท็บอื่นเป็น task ภายหลัง (ไม่ใช่ทันที) — แท็บอื่นอาจทำงานต่อด้วยค่าเก่าไปก่อน
    setTimeout(() => win.dispatchEvent(Object.assign(new Event("storage"), { key: k })), 0);
  },
  removeItem: (k: string) => void data.delete(k),
  clear: () => data.clear(),
  key: (i: number) => [...data.keys()][i] ?? null,
  get length() {
    return data.size;
  },
};
const chains = new Map<string, Promise<unknown>>();
const locks = {
  request<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const run = (chains.get(name) ?? Promise.resolve()).then(fn);
    chains.set(name, run.catch(() => {}));
    return run;
  },
};
vi.stubGlobal("window", Object.assign(win, { localStorage: localStorageFake })); // zustand persist ใช้ window.localStorage
vi.stubGlobal("localStorage", localStorageFake);
vi.stubGlobal("navigator", { locks });
vi.stubEnv("VITE_API_URL", "http://api.test");
vi.stubEnv("VITE_USE_MOCK", "false");

// แต่ละแท็บ = โหลด module ใหม่ (store ในหน่วยความจำแยกกัน แต่ localStorage ร่วมกัน)
async function openTab() {
  vi.resetModules();
  const client = await import("./client");
  const { useAuthStore } = await import("../stores/useAuthStore");
  return { ...client, store: useAuthStore };
}

const { request, refreshSession, revokeSession, ApiError, store: useAuthStore } = await openTab();

const now = () => Math.floor(Date.now() / 1000);
const user = { id: "u1", name: "มายด์", email: "mind@pawhome.test" };
const session = (n: number, expiresIn = 3600) => ({ user, token: `t${n}`, refreshToken: `r${n}`, expiresAt: now() + expiresIn });
const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

type Call = { url: string; auth: string | null; body: string | null };
let calls: Call[];
const refreshCalls = () => calls.filter((c) => c.url.endsWith("/auth/refresh"));
function mockFetch(handler: (call: Call) => Response | Promise<Response>) {
  vi.stubGlobal("fetch", async (url: string, init: RequestInit = {}) => {
    const call = { url, auth: new Headers(init.headers).get("Authorization"), body: (init.body as string) ?? null };
    calls.push(call);
    return handler(call);
  });
}
// เซิร์ฟเวอร์จำลอง: refresh token ใช้ได้ครั้งเดียว (ใช้ซ้ำ = 401 เหมือน Supabase ตรวจจับการใช้ซ้ำ)
function rotatingServer() {
  let current = 1;
  return (c: Call) => {
    if (!c.url.endsWith("/auth/refresh")) return json(200, []);
    if (JSON.parse(c.body!).refreshToken !== `r${current}`) return json(401, { message: "เซสชันหมดอายุ" });
    current += 1;
    return json(200, session(current));
  };
}
const settle = () => new Promise((r) => setTimeout(r, 0));

beforeEach(async () => {
  calls = [];
  useAuthStore.getState().logout();
  await settle();
});

describe("request() — one tab", () => {
  it("valid token → no refresh", async () => {
    useAuthStore.getState().setAuth(session(1));
    mockFetch(() => json(200, [1]));
    expect(await request("/me/pets")).toEqual([1]);
    expect(calls.map((c) => [c.url, c.auth])).toEqual([["http://api.test/me/pets", "Bearer t1"]]);
  });

  it("expired access token → refreshes first, then uses the new token", async () => {
    useAuthStore.getState().setAuth(session(1, 30)); // เหลือ 30 วิ < 60 วิ
    mockFetch(rotatingServer());
    await request("/me/pets");
    expect(calls.map((c) => c.url)).toEqual(["http://api.test/auth/refresh", "http://api.test/me/pets"]);
    expect(JSON.parse(calls[0].body!)).toEqual({ refreshToken: "r1" });
    expect(calls[1].auth).toBe("Bearer t2");
    expect(useAuthStore.getState()).toMatchObject({ token: "t2", refreshToken: "r2", user });
  });

  it("token rotation: the next refresh uses the new refresh token (and it is saved for other tabs)", async () => {
    useAuthStore.getState().setAuth(session(1, 0));
    mockFetch(rotatingServer());
    await request("/me/pets");
    useAuthStore.setState({ expiresAt: 0 });
    await request("/me/pets");
    expect(refreshCalls().map((c) => JSON.parse(c.body!).refreshToken)).toEqual(["r1", "r2"]);
    expect(JSON.parse(localStorage.getItem("pawhome-auth")!).state.refreshToken).toBe("r3");
  });

  it("401 on a token that looked valid → refresh and retry once", async () => {
    useAuthStore.getState().setAuth(session(1));
    mockFetch((c) => {
      if (c.url.endsWith("/auth/refresh")) return json(200, session(2));
      return c.auth === "Bearer t1" ? json(401, { message: "เซสชันหมดอายุ" }) : json(200, { ok: true });
    });
    expect(await request("/me/favorites")).toEqual({ ok: true });
    expect(calls.map((c) => c.auth ?? "refresh")).toEqual(["Bearer t1", "refresh", "Bearer t2"]);
  });

  it("refresh rejected (401) → logs out and throws 401", async () => {
    useAuthStore.getState().setAuth(session(1));
    mockFetch((c) => (c.url.endsWith("/auth/refresh") ? json(401, { message: "x" }) : json(401, { message: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" })));
    const error = await request("/me/pets").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401, message: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" });
    expect(useAuthStore.getState().user).toBeNull();
    expect(calls.filter((c) => c.url.endsWith("/me/pets"))).toHaveLength(1); // ไม่ยิงซ้ำวน
  });

  it("refresh rate-limited (429) or server down (5xx) → keeps the session, shows the error", async () => {
    for (const status of [429, 502]) {
      useAuthStore.getState().setAuth(session(1, 0));
      mockFetch(() => json(status, { message: `ลองใหม่ (${status})` }));
      await expect(request("/me/pets")).rejects.toMatchObject({ status, message: `ลองใหม่ (${status})` });
      expect(useAuthStore.getState().token).toBe("t1");
    }
  });

  it("network error during refresh keeps the session (offline ≠ logged out)", async () => {
    useAuthStore.getState().setAuth(session(1, 0));
    mockFetch(() => Promise.reject(new TypeError("Failed to fetch")));
    await expect(request("/me/pets")).rejects.toThrow("Failed to fetch");
    expect(useAuthStore.getState().token).toBe("t1");
  });

  it("concurrent expired requests share one refresh", async () => {
    useAuthStore.getState().setAuth(session(1, 0));
    mockFetch(rotatingServer());
    await Promise.all([request("/me/pets"), request("/me/favorites"), request("/me/adoptions")]);
    expect(refreshCalls()).toHaveLength(1);
    expect(calls.filter((c) => !c.url.endsWith("/auth/refresh")).every((c) => c.auth === "Bearer t2")).toBe(true);
  });

  it("logged out while refresh in flight → session is not restored", async () => {
    useAuthStore.getState().setAuth(session(1, 0));
    let release!: () => void;
    mockFetch((c) => (c.url.endsWith("/auth/refresh") ? new Promise((r) => (release = () => r(json(200, session(2))))) : json(200, [])));
    const pending = refreshSession();
    await vi.waitFor(() => expect(release).toBeTypeOf("function"));
    useAuthStore.getState().logout();
    release();
    expect(await pending).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it("no token → no Authorization header, 401 does not trigger refresh", async () => {
    mockFetch(() => json(401, { message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }));
    await expect(request("/auth/login", { method: "POST", body: "{}" })).rejects.toMatchObject({ status: 401 });
    expect(calls).toHaveLength(1);
    expect(calls[0].auth).toBeNull();
  });
});

describe("two tabs sharing one session", () => {
  it("tab B picks up the token tab A just rotated (never reuses the old refresh token)", async () => {
    const a = await openTab();
    const b = await openTab();
    a.store.getState().setAuth(session(1, 0));
    await settle();
    expect(b.store.getState().refreshToken).toBe("r1");

    mockFetch(rotatingServer());
    await a.request("/me/pets");
    await settle();
    expect(b.store.getState()).toMatchObject({ token: "t2", refreshToken: "r2" });

    await b.request("/me/favorites");
    expect(refreshCalls()).toHaveLength(1);
    expect(calls.at(-1)?.auth).toBe("Bearer t2");
    expect(b.store.getState().user).toEqual(user);
  });

  it("both tabs expire at once → only one refresh across tabs, both stay logged in", async () => {
    const a = await openTab();
    const b = await openTab();
    a.store.getState().setAuth(session(1, 0));
    await settle();

    mockFetch(rotatingServer());
    await Promise.all([a.request("/me/pets"), b.request("/me/favorites")]);
    expect(refreshCalls()).toHaveLength(1);
    expect(a.store.getState().token).toBe("t2");
    expect(b.store.getState().token).toBe("t2");
    expect(calls.filter((c) => !c.url.endsWith("/auth/refresh")).map((c) => c.auth)).toEqual(["Bearer t2", "Bearer t2"]);
  });

  it("tab B's stale in-memory state (event not delivered yet) still does not reuse the refresh token", async () => {
    const a = await openTab();
    const b = await openTab();
    a.store.getState().setAuth(session(1, 0));
    await settle();
    mockFetch(rotatingServer());
    await a.request("/me/pets");
    // จำลองแท็บ B ที่ยังไม่ได้รับ event: ใส่ค่าเก่ากลับในหน่วยความจำ (localStorage มีชุดใหม่แล้ว)
    b.store.setState({ token: "t1", refreshToken: "r1", expiresAt: 0 });
    data.set("pawhome-auth", JSON.stringify({ state: { ...session(2), user }, version: 0 }));

    await b.request("/me/favorites");
    expect(refreshCalls()).toHaveLength(1); // B อ่าน localStorage ภายใต้ lock แล้วใช้ t2 เลย
    expect(calls.at(-1)?.auth).toBe("Bearer t2");
  });

  it("logout in tab A logs out tab B", async () => {
    const a = await openTab();
    const b = await openTab();
    a.store.getState().setAuth(session(1));
    await settle();
    expect(b.store.getState().user).toEqual(user);
    a.store.getState().logout();
    await settle();
    expect(b.store.getState()).toMatchObject({ user: null, token: null, refreshToken: null });
  });

  it("tab A logs out while tab B is refreshing → B does not bring the session back", async () => {
    const a = await openTab();
    const b = await openTab();
    a.store.getState().setAuth(session(1, 0));
    await settle();
    let release!: () => void;
    mockFetch((c) => (c.url.endsWith("/auth/refresh") ? new Promise((r) => (release = () => r(json(200, session(2))))) : json(200, [])));
    const pending = b.refreshSession();
    await vi.waitFor(() => expect(release).toBeTypeOf("function"));
    a.store.getState().logout();
    await settle();
    release();
    expect(await pending).toBeNull();
    expect(b.store.getState().token).toBeNull();
    expect(JSON.parse(localStorage.getItem("pawhome-auth")!).state.token).toBeNull();
  });
});

describe("revokeSession()", () => {
  it("valid token → POST /auth/logout with it", async () => {
    mockFetch(() => json(204));
    await revokeSession(session(1));
    expect(calls.map((c) => [c.url, c.auth])).toEqual([["http://api.test/auth/logout", "Bearer t1"]]);
  });

  it("expired token → refresh first so the server session is really revoked", async () => {
    mockFetch((c) => (c.url.endsWith("/auth/refresh") ? json(200, session(2)) : json(204)));
    await revokeSession(session(1, 0));
    expect(calls.map((c) => c.auth ?? "refresh")).toEqual(["refresh", "Bearer t2"]);
    expect(useAuthStore.getState().token).toBeNull(); // ไม่แตะ store
  });
});
