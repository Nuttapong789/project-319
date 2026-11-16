// ฐานข้อมูลทดสอบ: PostgreSQL จริง (PGlite) รัน schema.sql → สร้างบัญชีทดลอง → mock-data.sql → verify.sql
// แล้วเปิดเป็น TCP ให้ Prisma ต่อเหมือนต่อ Supabase — ไม่ต้องใช้ Docker หรือ credentials
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { readFileSync } from "node:fs";
import type { TestProject } from "vitest/node";
import { DEMO_USERS } from "./demo-users.js";

const PORT = 54329;
const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

export type VerifyRow = { check_name: string; expected: string; actual: string; ok: boolean };

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
    verifyRows: VerifyRow[];
  }
}

export default async function setup(project: TestProject) {
  const db = await PGlite.create();
  await db.exec(read("./supabase-stub.sql"));
  await db.exec(read("../../database/schema.sql"));
  // บน Supabase จริงขั้นนี้คือ `npm run seed:users` (Admin API) — ในเทสต์ใส่ตรงลงตารางจำลอง
  for (const u of DEMO_USERS) {
    await db.query("insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)", [u.id, u.email, { name: u.name }]);
  }
  // รันซ้ำสองรอบ: ถ้าไม่ idempotent จะ error หรือจำนวนแถวใน verify.sql จะเพี้ยน
  for (let round = 0; round < 2; round++) {
    await db.exec(read("../../database/schema.sql"));
    await db.exec(read("../../database/mock-data.sql"));
  }
  const verify = await db.exec(read("../../database/verification/verify.sql"));
  project.provide("verifyRows", verify.at(-1)!.rows as VerifyRow[]);

  const server = new PGLiteSocketServer({ db, port: PORT, host: "127.0.0.1" });
  await server.start();
  // PGlite มี session เดียวใช้ร่วมกันทุก connection → pgbouncer=true ให้ Prisma ไม่ทิ้ง prepared statement ชื่อซ้ำไว้ข้ามไฟล์เทสต์
  project.provide(
    "databaseUrl",
    `postgresql://postgres:postgres@127.0.0.1:${PORT}/postgres?connection_limit=1&sslmode=disable&pgbouncer=true`,
  );

  return async () => {
    await server.stop();
    await db.close();
  };
}
