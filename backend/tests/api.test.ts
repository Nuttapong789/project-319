// ทดสอบทุก endpoint ผ่าน Express → Prisma → PostgreSQL จริง (PGlite ที่ seed ด้วย database/*.sql)
// แทนเฉพาะ Supabase Auth / Storage (tests/fake-supabase.ts) เพราะต้องใช้ credentials จริง
// เทสต์ในไฟล์นี้รันตามลำดับและใช้ข้อมูลต่อกัน (เหมือนผู้ใช้กดตามขั้นตอน)
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/config/supabase.js", () => import("./fake-supabase.js"));

const { app } = await import("../src/app.js");
const { confirmEmail, expireToken, failNextAuthCall, setConfirmEmailRequired, signUps, tokenFor, uploadedPaths } =
  await import("./fake-supabase.js");
const { prisma } = await import("../src/config/prisma.js");

const api = request(app);
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const pong = tokenFor("pong@pawhome.test");
const shelter = tokenFor("shelter@pawhome.test");
const mind = tokenFor("mind@pawhome.test");

const newPet = {
  name: "ทองคำ",
  species: "DOG",
  breed: "พันทาง",
  ageMonths: 5,
  sex: "MALE",
  province: "ภูเก็ต",
  imageUrl: "",
  description: "ลูกหมาร่าเริง กินเก่ง ฉีดวัคซีนเข็มแรกแล้ว",
  vaccinated: true,
  sterilized: false,
  urgent: false,
};
const adoptionForm = { phone: "0811111111", housing: "HOUSE", message: "มีบ้านเดี่ยว มีคนอยู่บ้านตลอด เคยเลี้ยงสุนัขมาก่อน" };

describe("health + errors", () => {
  it("GET /api/health → database ok", async () => {
    const res = await api.get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", database: "ok" });
  });

  it("unknown route → 404 { message }", async () => {
    const res = await api.get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body.message).toBeTypeOf("string");
  });

  it("CORS allows the Vite dev origin only", async () => {
    const ok = await api.options("/api/pets").set("Origin", "http://localhost:5173").set("Access-Control-Request-Method", "POST");
    expect(ok.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    const evil = await api.get("/api/pets").set("Origin", "https://evil.example");
    expect(evil.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("broken JSON → 400", async () => {
    const res = await api.post("/api/auth/login").set("Content-Type", "application/json").send("{bad");
    expect(res.status).toBe(400);
  });
});

describe("pets (public)", () => {
  it("GET /pets → 12 seeded pets, newest first, with ownerName", async () => {
    const res = await api.get("/api/pets");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(12);
    expect(res.body.map((p: { id: number }) => p.id)).toEqual([1, 8, 4, 9, 2, 7, 10, 3, 11, 5, 12, 6]);
    expect(res.body[0]).toMatchObject({ name: "ข้าวตัง", ownerName: "บ้านพักน้องจร", status: "AVAILABLE", urgent: true });
  });

  it.each([
    ["urgent=true", [1, 8, 4, 9]],
    ["urgent=false&species=CAT", [2, 10, 11, 6]],
    ["postedWithin=1", [1, 8, 4]],
    ["province=" + encodeURIComponent("เชียงใหม่"), [9, 3]],
    ["search=" + encodeURIComponent("แมวส้ม"), [4, 10]],
    ["search=" + encodeURIComponent("ขอนแก่น") + "&postedWithin=7", [4]],
  ])("GET /pets?%s", async (query, ids) => {
    const res = await api.get(`/api/pets?${query}`);
    expect(res.status).toBe(200);
    expect(res.body.map((p: { id: number }) => p.id)).toEqual(ids);
  });

  it("rejects bad filters with 400", async () => {
    expect((await api.get("/api/pets?species=BIRD")).status).toBe(400);
    expect((await api.get("/api/pets?postedWithin=3")).status).toBe(400);
  });

  it("GET /pets/:id", async () => {
    const res = await api.get("/api/pets/6");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 6, name: "ไข่ตุ๋น", status: "ADOPTED", imageUrl: "https://cdn2.thecatapi.com/images/HDxfaNlLj.jpg" });
    expect((await api.get("/api/pets/999")).status).toBe(404);
    expect((await api.get("/api/pets/abc")).status).toBe(404);
  });
});

describe("auth", () => {
  it("protected routes need a valid token", async () => {
    expect((await api.post("/api/pets").send(newPet)).status).toBe(401);
    expect((await api.get("/api/me/favorites").set(auth("forged"))).status).toBe(401);
  });

  it("login", async () => {
    expect((await api.post("/api/auth/login").send({ email: "pong@pawhome.test", password: "wrong1" })).status).toBe(401);
    const res = await api.post("/api/auth/login").send({ email: "PONG@pawhome.test", password: "123456" });
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ id: "00000000-0000-4000-8000-000000000001", name: "ปอง", email: "pong@pawhome.test" });
    expect((await api.get("/api/auth/me").set(auth(res.body.token))).body.name).toBe("ปอง");
  });

  it("register with email verification: no token until the email is confirmed", async () => {
    const body = { name: "นุ่น", email: "noon@pawhome.test", password: "secret1" };
    const res = await api.post("/api/auth/register").send(body);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ needsVerification: true, email: "noon@pawhome.test" });
    expect(signUps.at(-1)).toEqual({ email: "noon@pawhome.test", emailRedirectTo: "http://localhost:5173/login?verified=1" });

    // profile ถูกสร้างโดย trigger on_auth_user_created ทันทีที่สมัคร (Backend ไม่ได้เขียนเอง)
    const profile = await prisma.profile.findFirst({ where: { name: "นุ่น" } });
    expect(profile).not.toBeNull();

    const unconfirmed = await api.post("/api/auth/login").send({ email: body.email, password: body.password });
    expect(unconfirmed.status).toBe(403);
    expect(unconfirmed.body.message).toMatch(/ยืนยันอีเมล/);

    confirmEmail(body.email);
    const login = await api.post("/api/auth/login").send({ email: body.email, password: body.password });
    expect(login.status).toBe(200);
    expect(login.body.user).toMatchObject({ id: profile!.id, name: "นุ่น" });
    expect((await api.get("/api/me/pets").set(auth(login.body.token))).body).toEqual([]);
  });

  it("register an existing email: same answer as a new one (no account enumeration)", async () => {
    const res = await api.post("/api/auth/register").send({ name: "ซ้ำ", email: "pong@pawhome.test", password: "secret1" });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ needsVerification: true, email: "pong@pawhome.test" });
  });

  it("register when the project does not require confirmation: logged in at once · duplicate 409", async () => {
    setConfirmEmailRequired(false);
    try {
      const body = { name: "ทันที", email: "instant@pawhome.test", password: "secret1" };
      const res = await api.post("/api/auth/register").send(body);
      expect(res.status).toBe(201);
      expect(res.body.user).toMatchObject({ name: "ทันที", email: body.email });
      expect(res.body.token).toBeTypeOf("string");
      expect((await api.post("/api/auth/register").send(body)).status).toBe(409);
    } finally {
      setConfirmEmailRequired(true);
    }
  });

  it("register validation → 400", async () => {
    const bad = await api.post("/api/auth/register").send({ name: "นุ่น", email: "new@pawhome.test", password: "123" });
    expect(bad.status).toBe(400);
    expect(bad.body.message).toBe("รหัสผ่านอย่างน้อย 6 ตัวอักษร");
  });

  it("Supabase errors keep their meaning (not everything is 'wrong password')", async () => {
    const creds = { email: "pong@pawhome.test", password: "123456" };
    failNextAuthCall("over_request_rate_limit", 429);
    expect((await api.post("/api/auth/login").send(creds)).status).toBe(429);
    failNextAuthCall("unexpected_failure", 500);
    expect((await api.post("/api/auth/login").send(creds)).status).toBe(502);
    failNextAuthCall("over_request_rate_limit", 429);
    expect((await api.post("/api/auth/refresh").send({ refreshToken: "whatever" })).status).toBe(429);
    expect((await api.post("/api/auth/login").send({ ...creds, password: "wrong1" })).body.message).toBe("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  });

  it("login creates a missing profile instead of failing (trigger missing in some environment)", async () => {
    // ผู้ใช้ใหม่ที่ไม่มี profile (ลบทิ้งหลังสมัคร) แทนกรณี trigger ไม่ทำงาน
    setConfirmEmailRequired(false);
    try {
      const res = await api.post("/api/auth/register").send({ name: "ไร้โปรไฟล์", email: "noprofile@pawhome.test", password: "secret1" });
      await prisma.profile.delete({ where: { id: res.body.user.id } });
      const login = await api.post("/api/auth/login").send({ email: "noprofile@pawhome.test", password: "secret1" });
      expect(login.status).toBe(200);
      expect(login.body.user.name).toBe("ไร้โปรไฟล์");
      expect(await prisma.profile.count({ where: { id: res.body.user.id } })).toBe(1);
    } finally {
      setConfirmEmailRequired(true);
    }
  });

  it("login returns a refresh token and expiry", async () => {
    const res = await api.post("/api/auth/login").send({ email: "mind@pawhome.test", password: "123456" });
    expect(res.body.refreshToken).toBeTypeOf("string");
    expect(res.body.expiresAt).toBeGreaterThan(Date.now() / 1000);
  });

  it("expired access token → 401, refresh → new working token, old refresh token is single-use", async () => {
    const login = (await api.post("/api/auth/login").send({ email: "mind@pawhome.test", password: "123456" })).body;
    expireToken(login.token);
    const expired = await api.get("/api/me/pets").set(auth(login.token));
    expect(expired.status).toBe(401);
    expect(expired.body.message).toBe("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");

    const refreshed = await api.post("/api/auth/refresh").send({ refreshToken: login.refreshToken });
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.user.name).toBe("มายด์");
    expect(refreshed.body.token).not.toBe(login.token);
    expect(refreshed.body.refreshToken).not.toBe(login.refreshToken);
    expect((await api.get("/api/me/pets").set(auth(refreshed.body.token))).status).toBe(200);

    expect((await api.post("/api/auth/refresh").send({ refreshToken: login.refreshToken })).status).toBe(401);
    expect((await api.post("/api/auth/refresh").send({})).status).toBe(400);
  });

  it("logout revokes the refresh token too", async () => {
    const login = (await api.post("/api/auth/login").send({ email: "mind@pawhome.test", password: "123456" })).body;
    expect((await api.post("/api/auth/logout").set(auth(login.token))).status).toBe(204);
    expect((await api.post("/api/auth/refresh").send({ refreshToken: login.refreshToken })).status).toBe(401);
  });

  it("PATCH /me/profile: edit display name → shows everywhere (auth/me, ownerName)", async () => {
    expect((await api.patch("/api/me/profile").send({ name: "ใหม่" })).status).toBe(401);
    setConfirmEmailRequired(false);
    let token: string;
    try {
      token = (await api.post("/api/auth/register").send({ name: "ชื่อเดิม", email: "rename@pawhome.test", password: "secret1" })).body.token;
    } finally {
      setConfirmEmailRequired(true);
    }
    const bad = await api.patch("/api/me/profile").set(auth(token)).send({ name: " ก " });
    expect(bad.status).toBe(400);
    expect(bad.body.message).toBe("กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร");

    const pet = (await api.post("/api/pets").set(auth(token)).send(newPet)).body;
    const res = await api.patch("/api/me/profile").set(auth(token)).send({ name: "  ชื่อใหม่  ", email: "hacker@x.y" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: "ชื่อใหม่", email: "rename@pawhome.test" }); // อีเมลแก้ผ่านช่องนี้ไม่ได้
    expect((await api.get("/api/auth/me").set(auth(token))).body.name).toBe("ชื่อใหม่");
    expect((await api.get(`/api/pets/${pet.id}`)).body.ownerName).toBe("ชื่อใหม่");
    expect((await api.delete(`/api/pets/${pet.id}`).set(auth(token))).status).toBe(204);
  });

  it("logout revokes the session", async () => {
    const token = tokenFor("mind@pawhome.test");
    expect((await api.post("/api/auth/logout").set(auth(token))).status).toBe(204);
    expect((await api.get("/api/auth/me").set(auth(token))).status).toBe(401);
  });
});

describe("pets CRUD", () => {
  let id: number;

  it("POST /pets → 201, owner from token, id continues after seed", async () => {
    const bad = await api.post("/api/pets").set(auth(pong)).send({ ...newPet, description: "สั้น" });
    expect(bad.status).toBe(400);
    expect(bad.body.message).toBe("เล่าเรื่องน้องอย่างน้อย 20 ตัวอักษร");

    const res = await api.post("/api/pets").set(auth(pong)).send({ ...newPet, ownerId: "00000000-0000-4000-8000-000000000002" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ ...newPet, status: "AVAILABLE", ownerName: "ปอง", ownerId: "00000000-0000-4000-8000-000000000001" });
    expect(res.body.id).toBeGreaterThan(12); // ต่อจาก id ของข้อมูลจำลอง ไม่ชนกัน
    id = res.body.id;
  });

  it("PUT /pets/:id → owner only", async () => {
    expect((await api.put(`/api/pets/${id}`).set(auth(shelter)).send(newPet)).status).toBe(403);
    const res = await api.put(`/api/pets/${id}`).set(auth(pong)).send({ ...newPet, urgent: true, name: "ทองคำน้อย" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id, name: "ทองคำน้อย", urgent: true });
    expect((await api.get(`/api/pets/${id}`)).body.name).toBe("ทองคำน้อย");
  });

  it("GET /me/pets → only mine", async () => {
    const res = await api.get("/api/me/pets").set(auth(pong));
    expect(res.body.map((p: { id: number }) => p.id)).toEqual([id, 4, 2, 10]);
  });

  it("DELETE /pets/:id → owner only, cascades favorites", async () => {
    expect((await api.post("/api/me/favorites").set(auth(mind)).send({ petId: id })).status).toBe(201);
    expect((await api.delete(`/api/pets/${id}`).set(auth(shelter))).status).toBe(403);
    expect((await api.delete(`/api/pets/${id}`).set(auth(pong))).status).toBe(204);
    expect((await api.get(`/api/pets/${id}`)).status).toBe(404);
    expect((await api.get("/api/me/favorites").set(auth(mind))).body).toEqual([]);
  });
});

describe("favorites", () => {
  it("seeded order: last liked first", async () => {
    const res = await api.get("/api/me/favorites").set(auth(pong));
    expect(res.body.map((p: { id: number }) => p.id)).toEqual([5, 1]);
  });

  it("add / duplicate / missing / remove", async () => {
    expect((await api.post("/api/me/favorites").set(auth(pong)).send({ petId: 1 })).status).toBe(409);
    expect((await api.post("/api/me/favorites").set(auth(pong)).send({ petId: 999 })).status).toBe(404);
    expect((await api.post("/api/me/favorites").set(auth(pong)).send({ petId: "2" })).status).toBe(400);
    expect((await api.post("/api/me/favorites").set(auth(pong)).send({ petId: 2 })).status).toBe(201);
    expect((await api.get("/api/me/favorites").set(auth(pong))).body[0].id).toBe(2);
    expect((await api.delete("/api/me/favorites/2").set(auth(pong))).status).toBe(204);
    expect((await api.delete("/api/me/favorites/2").set(auth(pong))).status).toBe(204);
    expect((await api.get("/api/me/favorites").set(auth(pong))).body).toHaveLength(2);
  });
});

describe("adoptions", () => {
  let mindRequest: number;
  let noonRequest: number;

  it("GET /me/adoptions includes pet", async () => {
    const res = await api.get("/api/me/adoptions").set(auth(mind));
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ id: 2, petId: 4, userName: "มายด์", housing: "CONDO", status: "PENDING", pet: { name: "ส้มโอ" } });
  });

  it("business rules on create", async () => {
    expect((await api.post("/api/pets/4/adoptions").set(auth(mind)).send(adoptionForm)).status).toBe(409);
    expect((await api.post("/api/pets/2/adoptions").set(auth(pong)).send(adoptionForm)).body.message).toBe("ขอรับเลี้ยงน้องที่ตัวเองโพสต์ไม่ได้");
    expect((await api.post("/api/pets/6/adoptions").set(auth(mind)).send(adoptionForm)).body.message).toBe("น้องได้บ้านแล้ว");
    expect((await api.post("/api/pets/999/adoptions").set(auth(mind)).send(adoptionForm)).status).toBe(404);
    expect((await api.post("/api/pets/1/adoptions").set(auth(mind)).send({ ...adoptionForm, phone: "12345" })).status).toBe(400);
  });

  it("create → 201 and pet becomes PENDING", async () => {
    const res = await api.post("/api/pets/1/adoptions").set(auth(mind)).send({ ...adoptionForm, phone: "081-111-1111" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ petId: 1, phone: "0811111111", status: "PENDING", pet: { status: "PENDING" } });
    mindRequest = res.body.id;

    const noon = (await api.post("/api/auth/login").send({ email: "noon@pawhome.test", password: "secret1" })).body.token;
    const second = await api.post("/api/pets/1/adoptions").set(auth(noon)).send(adoptionForm);
    expect(second.status).toBe(201);
    noonRequest = second.body.id;
    expect((await api.get("/api/pets/1")).body.status).toBe("PENDING");
  });

  it("GET /pets/:id/adoptions → pet owner only", async () => {
    expect((await api.get("/api/pets/1/adoptions").set(auth(mind))).status).toBe(403);
    const res = await api.get("/api/pets/1/adoptions").set(auth(shelter));
    expect(res.body.map((r: { id: number }) => r.id)).toEqual([noonRequest, mindRequest]);
  });

  it("approve → pet ADOPTED, other pending → REJECTED", async () => {
    expect((await api.patch(`/api/adoptions/${mindRequest}`).set(auth(mind)).send({ status: "APPROVED" })).status).toBe(403);
    expect((await api.patch(`/api/adoptions/${mindRequest}`).set(auth(shelter)).send({ status: "MAYBE" })).status).toBe(400);

    const res = await api.patch(`/api/adoptions/${mindRequest}`).set(auth(shelter)).send({ status: "APPROVED" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "APPROVED", pet: { status: "ADOPTED" } });

    const all = (await api.get("/api/pets/1/adoptions").set(auth(shelter))).body;
    expect(all.find((r: { id: number }) => r.id === noonRequest).status).toBe("REJECTED");
    expect((await api.patch(`/api/adoptions/${noonRequest}`).set(auth(shelter)).send({ status: "APPROVED" })).status).toBe(400);
  });

  it("cancel → own PENDING only, pet status re-synced", async () => {
    expect((await api.delete(`/api/adoptions/${mindRequest}`).set(auth(mind))).status).toBe(400);
    expect((await api.delete("/api/adoptions/1").set(auth(mind))).status).toBe(403);
    expect((await api.delete("/api/adoptions/999").set(auth(mind))).status).toBe(404);

    expect((await api.delete("/api/adoptions/1").set(auth(pong))).status).toBe(204);
    expect((await api.get("/api/pets/3")).body.status).toBe("AVAILABLE");
  });

  it("reject → pet back to AVAILABLE", async () => {
    const res = await api.patch("/api/adoptions/2").set(auth(pong)).send({ status: "REJECTED" });
    expect(res.body).toMatchObject({ status: "REJECTED", pet: { id: 4, status: "AVAILABLE" } });
  });

  it("cancel and approve at the same time: exactly one wins, data stays consistent", async () => {
    const created = await api.post("/api/pets/5/adoptions").set(auth(pong)).send(adoptionForm);
    expect(created.status).toBe(201);
    const id = created.body.id;

    const [cancel, approve] = await Promise.all([
      api.delete(`/api/adoptions/${id}`).set(auth(pong)),
      api.patch(`/api/adoptions/${id}`).set(auth(shelter)).send({ status: "APPROVED" }),
    ]);
    const statuses = [cancel.status, approve.status].sort();
    // ผู้ชนะได้ 204 หรือ 200 · อีกฝั่งได้ 400 (สถานะเปลี่ยนแล้ว) หรือ 404 (ถูกลบไปก่อนอ่าน)
    expect(statuses.filter((s) => s === 200 || s === 204)).toHaveLength(1);
    expect(statuses.filter((s) => s === 400 || s === 404)).toHaveLength(1);

    const row = await prisma.adoptionRequest.findUnique({ where: { id } });
    const pet = (await api.get("/api/pets/5")).body;
    if (cancel.status === 204) {
      expect(row).toBeNull();
      expect(pet.status).toBe("AVAILABLE");
    } else {
      expect(row?.status).toBe("APPROVED");
      expect(pet.status).toBe("ADOPTED");
    }
  });

  it("approve after cancel → 404 · cancel after approve → 400 (conditional writes)", async () => {
    const r1 = (await api.post("/api/pets/7/adoptions").set(auth(pong)).send(adoptionForm)).body.id;
    expect((await api.delete(`/api/adoptions/${r1}`).set(auth(pong))).status).toBe(204);
    expect((await api.patch(`/api/adoptions/${r1}`).set(auth(shelter)).send({ status: "APPROVED" })).status).toBe(404);

    const r2 = (await api.post("/api/pets/7/adoptions").set(auth(pong)).send(adoptionForm)).body.id;
    expect((await api.patch(`/api/adoptions/${r2}`).set(auth(shelter)).send({ status: "APPROVED" })).status).toBe(200);
    expect((await api.delete(`/api/adoptions/${r2}`).set(auth(pong))).status).toBe(400);
    expect((await prisma.adoptionRequest.findUnique({ where: { id: r2 } }))?.status).toBe("APPROVED");
  });
});

describe("uploads", () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

  it("valid image → { url } in the user's folder", async () => {
    const res = await api.post("/api/uploads").set(auth(pong)).attach("image", png, { filename: "cat.png", contentType: "image/png" });
    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/^https:\/\/storage\.test\/pet-images\/00000000-0000-4000-8000-000000000001\/[0-9a-f-]{36}\.png$/);
    expect(uploadedPaths).toHaveLength(1);
  });

  it("rejects missing, fake and oversized files", async () => {
    expect((await api.post("/api/uploads").set(auth(pong))).status).toBe(400);
    const fake = await api.post("/api/uploads").set(auth(pong)).attach("image", Buffer.from("<svg/>"), { filename: "x.png", contentType: "image/png" });
    expect(fake.status).toBe(400);
    const big = Buffer.concat([png, Buffer.alloc(2 * 1024 * 1024)]);
    const tooBig = await api.post("/api/uploads").set(auth(pong)).attach("image", big, { filename: "big.png", contentType: "image/png" });
    expect(tooBig.status).toBe(400);
    expect(tooBig.body.message).toBe("ไฟล์ใหญ่เกิน 2 MB");
    expect((await api.post("/api/uploads").attach("image", png, "a.png")).status).toBe(401);
  });
});
