import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { describe, expect, inject, it } from "vitest";
import { DEMO_USERS } from "./demo-users.js";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

// ฐานข้อมูลแยก ไม่กระทบตัวที่ api.test ใช้
async function freshDb() {
  const db = await PGlite.create();
  await db.exec(read("./supabase-stub.sql"));
  await db.exec(read("../../database/schema.sql"));
  return db;
}

describe("schema.sql trigger", () => {
  it("creates a profile even without name or email (phone sign-up)", async () => {
    const db = await freshDb();
    await db.query("insert into auth.users (id, email) values ($1, null)", ["00000000-0000-4000-8000-0000000000aa"]);
    const { rows } = await db.query<{ name: string }>("select name from public.profiles");
    expect(rows).toEqual([{ name: "ผู้ใช้" }]);
    await db.close();
  });
});

describe("mock-data.sql safety", () => {
  it("refuses to run when demo users are missing", async () => {
    const db = await freshDb();
    await expect(db.exec(read("../../database/mock-data.sql"))).rejects.toThrow(/seed:users/);
    await db.close();
  });

  it("refuses to run on a database that has real users' pets", async () => {
    const db = await freshDb();
    for (const u of DEMO_USERS) {
      await db.query("insert into auth.users (id, email) values ($1, $2)", [u.id, u.email]);
    }
    await db.exec(`
      insert into auth.users (id, email) values ('00000000-0000-4000-8000-0000000000bb', 'real@gmail.com');
      insert into public.pets (owner_id, name, species, age_months, sex, province, description)
      values ('00000000-0000-4000-8000-0000000000bb', 'จริง', 'DOG', 3, 'MALE', 'ภูเก็ต', 'โพสต์ของผู้ใช้จริง');
    `);
    await expect(db.exec(read("../../database/mock-data.sql"))).rejects.toThrow(/ข้อมูลของผู้ใช้จริง/);
    const { rows } = await db.query<{ n: number }>("select count(*)::int n from public.pets");
    expect(rows[0].n).toBe(1); // ไม่ได้ใส่อะไรเพิ่ม
    await db.close();
  });
});

// ผลของ database/verification/verify.sql ที่รันใน global-setup (หลัง schema.sql + mock-data.sql)
describe("database/verification/verify.sql", () => {
  const rows = inject("verifyRows");

  it("has checks", () => {
    expect(rows.length).toBeGreaterThan(30);
  });

  it.each(rows.map((r) => [r.check_name, r] as const))("%s", (_name, row) => {
    expect(row.actual).toBe(row.expected);
  });
});
