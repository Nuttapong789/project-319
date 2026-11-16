// ทดสอบทุก endpoint กับ Supabase จริง ผ่าน Backend ที่รันอยู่ (npm run dev) — ใช้กับโปรเจกต์ dev/demo เท่านั้น
//   npm run smoke:live            (SMOKE_API_URL ค่าเริ่มต้น http://localhost:3000/api)
// ไม่แก้ข้อมูลจำลอง: สร้างผู้ใช้ทดสอบ 2 คน ทดสอบกับโพสต์ของตัวเอง แล้วลบทุกอย่างที่สร้าง (ผู้ใช้, โพสต์, รูปใน Storage)
// ไม่พิมพ์ token / key ใด ๆ

import { env } from "../src/config/env.js";
import { supabaseAdmin } from "../src/config/supabase.js";

const API = process.env.SMOKE_API_URL ?? `http://localhost:${env.PORT}/api`;
const results: { name: string; ok: boolean; detail?: string }[] = [];
const createdUserIds: string[] = [];
const uploadedPaths: string[] = [];

function check(name: string, ok: boolean, detail?: unknown) {
  results.push({ name, ok, detail: ok ? undefined : JSON.stringify(detail)?.slice(0, 200) });
}

async function call(method: string, path: string, { token, body, form }: { token?: string; body?: unknown; form?: FormData } = {}) {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API}${path}`, { method, headers, body: form ?? (body === undefined ? undefined : JSON.stringify(body)) });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { status: res.status, data };
}

// PNG 1×1 จริง
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const stamp = Date.now();
const petInput = {
  name: "น้องทดสอบระบบ",
  species: "CAT",
  breed: "ทดสอบ",
  ageMonths: 7,
  sex: "FEMALE",
  province: "ภูเก็ต",
  imageUrl: "",
  description: "โพสต์นี้สร้างโดย smoke test และจะถูกลบอัตโนมัติ",
  vaccinated: true,
  sterilized: false,
  urgent: false,
};

// ผู้ใช้ทดสอบผ่าน Admin API (ไม่ส่งอีเมล) — ลบทิ้งตอนจบ
let userCount = 0;
async function createTestUser(name: string, confirmed: boolean): Promise<string> {
  const email = `smoke-${stamp}-${++userCount}@pawhome.test`;
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: "smoke-pass-1",
    email_confirm: confirmed,
    user_metadata: { name },
  });
  if (error) throw new Error(`createUser: ${error.message}`);
  createdUserIds.push(data.user.id);
  return email;
}

async function loginAs(email: string): Promise<{ token: string; refreshToken: string }> {
  const res = await call("POST", "/auth/login", { body: { email, password: "smoke-pass-1" } });
  if (res.status !== 200) throw new Error(`login ${email}: ${res.status}`);
  return res.data;
}

async function main() {
  // ---- Health + public ----
  const health = await call("GET", "/health");
  check("GET /health → database ok", health.status === 200 && health.data?.database === "ok", health);

  const all = await call("GET", "/pets");
  check("GET /pets → อย่างน้อย 12 ตัว (seed)", all.status === 200 && Array.isArray(all.data) && all.data.length >= 12, all.status);
  // ตัวกรองต้องตรงกับข้อมูลจริงในฐานข้อมูล (ผู้ใช้จริงอาจโพสต์เพิ่ม จึงคำนวณจากรายการทั้งหมด ไม่ใช้เลขตายตัว)
  const pets = all.data as { id: number; urgent: boolean; species: string; name: string; breed: string; province: string }[];
  const urgent = await call("GET", "/pets?urgent=true");
  check("GET /pets?urgent=true", urgent.data?.length === pets.filter((p) => p.urgent).length, urgent.data?.length);
  const cats = await call("GET", `/pets?species=CAT&search=${encodeURIComponent("แมวส้ม")}`);
  const expectedCats = pets.filter((p) => p.species === "CAT" && `${p.name} ${p.breed} ${p.province}`.includes("แมวส้ม"));
  check("GET /pets?species&search", cats.data?.map((p: { id: number }) => p.id).join() === expectedCats.map((p) => p.id).join(), cats.data);
  const one = await call("GET", "/pets/6");
  check("GET /pets/6 → ไข่ตุ๋น ADOPTED", one.data?.name === "ไข่ตุ๋น" && one.data?.status === "ADOPTED", one.data);
  check("GET /pets/999 → 404", (await call("GET", "/pets/999")).status === 404);

  const image = await fetch(one.data.imageUrl);
  check("รูปน้องจาก seed เปิดได้", image.ok && (image.headers.get("content-type") ?? "").startsWith("image/"), image.status);

  // ---- Auth (Supabase Auth จริง) ----
  const login = await call("POST", "/auth/login", { body: { email: "mind@pawhome.test", password: "123456" } });
  check("POST /auth/login (demo) → session", login.status === 200 && !!login.data?.token && !!login.data?.refreshToken && login.data?.user?.name === "มายด์", login.status);
  check("POST /auth/login รหัสผิด → 401", (await call("POST", "/auth/login", { body: { email: "mind@pawhome.test", password: "wrong-pass" } })).status === 401);

  // สมัครสาธารณะส่งอีเมลยืนยันจริง (ผู้ส่งในตัวของ Supabase ได้ 2 ฉบับ/ชม. ทั้งโปรเจกต์ + อีเมลปลอมจะ bounce)
  // → ทดสอบเฉพาะ validation ที่ไม่ถึง Supabase · ผู้ใช้ทดสอบสร้างผ่าน Admin API (เหมือน seed:users ไม่ใช่การสมัครสาธารณะ)
  const invalid = await call("POST", "/auth/register", { body: { name: "x", email: "not-an-email", password: "1" } });
  check("POST /auth/register ข้อมูลผิด → 400 (ไม่ส่งอีเมล)", invalid.status === 400, invalid);
  const unconfirmed = await createTestUser("ยังไม่ยืนยัน", false);
  const notConfirmedLogin = await call("POST", "/auth/login", { body: { email: unconfirmed, password: "smoke-pass-1" } });
  check("login ก่อนยืนยันอีเมล → 403 (ไม่ใช่ 'รหัสผิด')", notConfirmedLogin.status === 403, notConfirmedLogin);

  const a = await loginAs(await createTestUser("ทดสอบ A", true));
  const b = await loginAs(await createTestUser("ทดสอบ B", true));
  check("GET /auth/me", (await call("GET", "/auth/me", { token: a.token })).data?.name === "ทดสอบ A");
  check("token ปลอม → 401", (await call("GET", "/auth/me", { token: "not-a-real-token" })).status === 401);
  check("ไม่มี token → 401", (await call("GET", "/me/pets")).status === 401);

  const refreshed = await call("POST", "/auth/refresh", { body: { refreshToken: login.data.refreshToken } });
  check("POST /auth/refresh → session ใหม่", refreshed.status === 200 && refreshed.data?.token !== login.data.token && refreshed.data?.expiresAt > Date.now() / 1000, refreshed.status);
  check("token จาก refresh ใช้ได้", (await call("GET", "/me/adoptions", { token: refreshed.data?.token })).status === 200);
  check("POST /auth/refresh ปลอม → 401", (await call("POST", "/auth/refresh", { body: { refreshToken: "bogus" } })).status === 401);

  // ---- Upload (Supabase Storage จริง) ----
  const form = new FormData();
  form.append("image", new Blob([PNG], { type: "image/png" }), "smoke.png");
  const upload = await call("POST", "/uploads", { token: a.token, form });
  const url: string = upload.data?.url ?? "";
  check("POST /uploads → public URL", upload.status === 201 && url.includes("/storage/v1/object/public/pet-images/"), upload);
  if (url) uploadedPaths.push(url.split("/pet-images/")[1]);
  const fetched = url ? await fetch(url) : null;
  check("รูปที่อัปโหลดเปิดได้ (image/png)", !!fetched?.ok && fetched.headers.get("content-type") === "image/png", fetched?.status);
  const fakeForm = new FormData();
  fakeForm.append("image", new Blob(["<svg/>"], { type: "image/png" }), "x.png");
  check("POST /uploads ไฟล์ปลอม → 400", (await call("POST", "/uploads", { token: a.token, form: fakeForm })).status === 400);

  // ---- Pets CRUD ----
  const created = await call("POST", "/pets", { token: a.token, body: { ...petInput, imageUrl: url } });
  const petId = created.data?.id as number;
  check("POST /pets → 201", created.status === 201 && created.data?.ownerName === "ทดสอบ A" && petId > 12, created);
  check("PUT /pets/:id คนอื่น → 403", (await call("PUT", `/pets/${petId}`, { token: b.token, body: petInput })).status === 403);
  const updated = await call("PUT", `/pets/${petId}`, { token: a.token, body: { ...petInput, imageUrl: url, urgent: true } });
  check("PUT /pets/:id เจ้าของ → 200", updated.status === 200 && updated.data?.urgent === true, updated.status);
  check("GET /me/pets", (await call("GET", "/me/pets", { token: a.token })).data?.[0]?.id === petId);
  check("POST /pets ข้อมูลผิด → 400", (await call("POST", "/pets", { token: a.token, body: { ...petInput, description: "สั้น" } })).status === 400);

  // ---- Favorites ----
  check("POST /me/favorites → 201", (await call("POST", "/me/favorites", { token: b.token, body: { petId } })).status === 201);
  check("POST /me/favorites ซ้ำ → 409", (await call("POST", "/me/favorites", { token: b.token, body: { petId } })).status === 409);
  check("GET /me/favorites", (await call("GET", "/me/favorites", { token: b.token })).data?.[0]?.id === petId);
  check("DELETE /me/favorites/:petId → 204", (await call("DELETE", `/me/favorites/${petId}`, { token: b.token })).status === 204);
  check("favorites ว่างแล้ว", (await call("GET", "/me/favorites", { token: b.token })).data?.length === 0);

  // ---- Adoptions ----
  const form1 = { phone: "081-111-1111", housing: "CONDO", message: "smoke test คำขอรับเลี้ยง จะถูกลบอัตโนมัติ" };
  check("ขอน้องของตัวเอง → 400", (await call("POST", `/pets/${petId}/adoptions`, { token: a.token, body: form1 })).status === 400);
  const req = await call("POST", `/pets/${petId}/adoptions`, { token: b.token, body: form1 });
  check("POST /pets/:id/adoptions → 201 + น้อง PENDING", req.status === 201 && req.data?.phone === "0811111111" && req.data?.pet?.status === "PENDING", req);
  check("ยื่นซ้ำ → 409", (await call("POST", `/pets/${petId}/adoptions`, { token: b.token, body: form1 })).status === 409);
  check("GET /me/adoptions", (await call("GET", "/me/adoptions", { token: b.token })).data?.[0]?.petId === petId);
  check("GET /pets/:id/adoptions คนอื่น → 403", (await call("GET", `/pets/${petId}/adoptions`, { token: b.token })).status === 403);
  check("GET /pets/:id/adoptions เจ้าของ", (await call("GET", `/pets/${petId}/adoptions`, { token: a.token })).data?.length === 1);
  check("DELETE /adoptions/:id → 204 + น้องกลับ AVAILABLE", (await call("DELETE", `/adoptions/${req.data.id}`, { token: b.token })).status === 204 && (await call("GET", `/pets/${petId}`)).data?.status === "AVAILABLE");
  const req2 = await call("POST", `/pets/${petId}/adoptions`, { token: b.token, body: form1 });
  check("PATCH /adoptions/:id ผู้ขอ → 403", (await call("PATCH", `/adoptions/${req2.data?.id}`, { token: b.token, body: { status: "APPROVED" } })).status === 403);
  const approved = await call("PATCH", `/adoptions/${req2.data?.id}`, { token: a.token, body: { status: "APPROVED" } });
  check("PATCH /adoptions/:id อนุมัติ → น้อง ADOPTED", approved.status === 200 && approved.data?.pet?.status === "ADOPTED", approved.status);
  check("ยกเลิกคำขอที่อนุมัติแล้ว → 400", (await call("DELETE", `/adoptions/${req2.data?.id}`, { token: b.token })).status === 400);

  // ---- ยกเลิก vs อนุมัติ พร้อมกันจริง (Postgres จริงมีหลาย connection) — ทำหลายรอบ ทุกรอบต้องมีผู้ชนะ 1 ฝั่งและข้อมูลตรงกัน ----
  let consistentRounds = 0;
  const rounds = 5;
  for (let i = 0; i < rounds; i++) {
    const pet = (await call("POST", "/pets", { token: a.token, body: { ...petInput, name: `แข่งกัน${i + 1}` } })).data;
    const request = (await call("POST", `/pets/${pet.id}/adoptions`, { token: b.token, body: form1 })).data;
    const [cancel, approve] = await Promise.all([
      call("DELETE", `/adoptions/${request.id}`, { token: b.token }),
      call("PATCH", `/adoptions/${request.id}`, { token: a.token, body: { status: "APPROVED" } }),
    ]);
    const after = (await call("GET", `/pets/${pet.id}/adoptions`, { token: a.token })).data as { id: number; status: string }[];
    const petNow = (await call("GET", `/pets/${pet.id}`)).data;
    const cancelWon = cancel.status === 204 && [400, 404].includes(approve.status) && after.length === 0 && petNow.status === "AVAILABLE";
    const approveWon = approve.status === 200 && cancel.status === 400 && after[0]?.status === "APPROVED" && petNow.status === "ADOPTED";
    if (cancelWon !== approveWon) consistentRounds++;
    else check(`แข่งกันรอบ ${i + 1}`, false, { cancel: cancel.status, approve: approve.status, after, pet: petNow.status });
    await call("DELETE", `/pets/${pet.id}`, { token: a.token });
  }
  check(`ยกเลิก/อนุมัติพร้อมกัน ${rounds} รอบ: ผู้ชนะ 1 ฝั่ง ข้อมูลตรงกันทุกรอบ`, consistentRounds === rounds, consistentRounds);

  // ---- Delete + logout ----
  check("DELETE /pets/:id คนอื่น → 403", (await call("DELETE", `/pets/${petId}`, { token: b.token })).status === 403);
  check("DELETE /pets/:id → 204", (await call("DELETE", `/pets/${petId}`, { token: a.token })).status === 204);
  check("คำขอถูกลบตาม (cascade)", (await call("GET", "/me/adoptions", { token: b.token })).data?.length === 0);
  check("POST /auth/logout → 204", (await call("POST", "/auth/logout", { token: b.token })).status === 204);
  check("refresh หลัง logout → 401", (await call("POST", "/auth/refresh", { body: { refreshToken: b.refreshToken } })).status === 401);
  // นับเฉพาะน้องจากข้อมูลจำลอง (id 1–12) — ผู้ใช้จริงอาจโพสต์เพิ่มได้
  const seedIds = ((await call("GET", "/pets")).data as { id: number }[]).map((p) => p.id).filter((id) => id <= 12);
  check("ข้อมูลจำลอง (น้อง id 1–12) ยังครบ", seedIds.length === 12, seedIds);
}

async function cleanup() {
  if (uploadedPaths.length) {
    const { error } = await supabaseAdmin.storage.from(env.STORAGE_BUCKET).remove(uploadedPaths);
    check("cleanup: ลบรูปทดสอบใน Storage", !error, error?.message);
  }
  for (const id of createdUserIds) {
    // ลบผู้ใช้ทดสอบ → profiles / pets / favorites / คำขอ ของผู้ใช้นี้หายตาม (cascade)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    check("cleanup: ลบผู้ใช้ทดสอบ", !error, error?.message);
  }
}

try {
  await main();
} catch (e) {
  check("ไม่มี exception", false, String(e));
} finally {
  await cleanup();
  for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  ${r.detail}` : ""}`);
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}
