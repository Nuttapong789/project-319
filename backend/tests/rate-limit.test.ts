// Rate limit ของ /auth/* (ไฟล์แยก เพราะต้องตั้ง limit ต่ำก่อนโหลด app)
import request from "supertest";
import { afterAll, describe, expect, it, vi } from "vitest";

vi.mock("../src/config/supabase.js", () => import("./fake-supabase.js"));

// ฐานข้อมูลทดสอบรับได้ทีละ connection → ปิด Prisma ทุกตัวที่เปิดในไฟล์นี้ ก่อนไฟล์ถัดไปเริ่ม
const disconnects: (() => Promise<void>)[] = [];
afterAll(() => Promise.all(disconnects.map((d) => d())));

async function loadApp(envOverrides: Record<string, string>) {
  Object.assign(process.env, envOverrides);
  vi.resetModules();
  const { prisma } = await import("../src/config/prisma.js");
  disconnects.push(() => prisma.$disconnect());
  return request((await import("../src/app.js")).app);
}

const login = { email: "pong@pawhome.test", password: "123456" };

describe("rate limit (no trusted proxy)", async () => {
  const api = await loadApp({
    TRUST_PROXY: "false",
    RATE_LIMIT_LOGIN_PER_MINUTE: "3",
    RATE_LIMIT_REGISTER_PER_MINUTE: "2",
    RATE_LIMIT_REFRESH_PER_MINUTE: "2",
  });

  it("login: allows the limit, then 429 with Retry-After", async () => {
    for (let i = 0; i < 3; i++) expect((await api.post("/api/auth/login").send(login)).status).toBe(200);
    const blocked = await api.post("/api/auth/login").send(login);
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers["retry-after"])).toBeGreaterThan(0);
    expect(blocked.body.message).toMatch(/ถี่เกินไป/);
  });

  it("a fake X-Forwarded-For does not get around the limit", async () => {
    const res = await api.post("/api/auth/login").set("X-Forwarded-For", "203.0.113.9").send(login);
    expect(res.status).toBe(429);
  });

  it("limits are separate per endpoint", async () => {
    const bad = { name: "x", email: "bad", password: "1" };
    expect((await api.post("/api/auth/register").send(bad)).status).toBe(400); // นับแม้ข้อมูลผิด (กันสแปม)
    expect((await api.post("/api/auth/register").send(bad)).status).toBe(400);
    expect((await api.post("/api/auth/register").send(bad)).status).toBe(429);
    expect((await api.post("/api/auth/refresh").send({ refreshToken: "x" })).status).toBe(401);
    expect((await api.post("/api/auth/refresh").send({ refreshToken: "x" })).status).toBe(401);
    expect((await api.post("/api/auth/refresh").send({ refreshToken: "x" })).status).toBe(429);
  });

  it("other routes are not limited", async () => {
    for (let i = 0; i < 5; i++) expect((await api.get("/api/pets/1")).status).toBe(200);
  });
});

describe("rate limit behind a trusted proxy (TRUST_PROXY=1)", async () => {
  // refresh ด้วย token ปลอมไม่แตะฐานข้อมูล (app ตัวที่สองจะได้ไม่เปิด connection ซ้อน)
  const api = await loadApp({ TRUST_PROXY: "1", RATE_LIMIT_REFRESH_PER_MINUTE: "1" });

  it("counts each client IP from X-Forwarded-For separately", async () => {
    const from = (ip: string) => api.post("/api/auth/refresh").set("X-Forwarded-For", ip).send({ refreshToken: "x" });
    expect((await from("198.51.100.1")).status).toBe(401);
    expect((await from("198.51.100.1")).status).toBe(429);
    expect((await from("198.51.100.2")).status).toBe(401);
  });
});
