import { z } from "zod";

// โหลด backend/.env ถ้ามี (Node 22 มีให้ในตัว ไม่ต้องใช้ dotenv) — บน server จริงตั้ง env ผ่านระบบแทน
try {
  process.loadEnvFile();
} catch {
  // ไม่มีไฟล์ .env ก็ใช้ค่าจาก environment ตรง ๆ
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

// Project URL ของ Supabase เท่านั้น เช่น https://abcd.supabase.co (ไม่มี /rest/v1, query หรือ #)
// https สำหรับโปรเจกต์บน Supabase · http ได้เฉพาะ localhost (supabase start)
export const supabaseUrlSchema = z.string().superRefine((value, ctx) => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    ctx.addIssue({ code: "custom", message: "SUPABASE_URL ไม่ใช่ URL" });
    return;
  }
  const local = LOCAL_HOSTS.has(url.hostname);
  if (url.protocol !== "https:" && !(local && url.protocol === "http:"))
    ctx.addIssue({ code: "custom", message: "SUPABASE_URL ต้องเป็น https:// (http:// ได้เฉพาะ localhost)" });
  if (url.pathname !== "/" || url.search || url.hash || url.username)
    ctx.addIssue({
      code: "custom",
      message: `SUPABASE_URL ต้องเป็น Project URL อย่างเดียว เช่น ${url.protocol}//${url.host} (ตัด "${url.pathname}${url.search}${url.hash}" ออก)`,
    });
});

// express "trust proxy": false = ใช้ IP ที่ต่อเข้ามาตรง ๆ (ไม่เชื่อ X-Forwarded-For) · ตัวเลข = จำนวน proxy ข้างหน้า
const trustProxySchema = z
  .string()
  .default("false")
  .transform((v) => (v === "true" ? true : v === "false" ? false : /^\d+$/.test(v) ? Number(v) : v));

const perMinute = (fallback: number) => z.coerce.number().int().positive().default(fallback);

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"), // หลายโดเมนคั่นด้วย ,
  // หน้าเว็บที่ลิงก์ยืนยันอีเมลพากลับมา (ต้องอยู่ใน Supabase → Authentication → URL Configuration → Redirect URLs)
  APP_URL: z.string().url().optional(),
  DATABASE_URL: z.string().min(1),
  SUPABASE_URL: supabaseUrlSchema,
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STORAGE_BUCKET: z.string().default("pet-images"),
  TRUST_PROXY: trustProxySchema,
  RATE_LIMIT_LOGIN_PER_MINUTE: perMinute(10),
  RATE_LIMIT_REGISTER_PER_MINUTE: perMinute(10),
  RATE_LIMIT_REFRESH_PER_MINUTE: perMinute(30), // refresh เกิดเองอัตโนมัติ ทุกแท็บ ทุกผู้ใช้หลัง NAT เดียวกัน
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const problems = parsed.error.issues
    .map((i) => (i.code === "custom" ? i.message : `${i.path.join(".")}: ${i.message}`))
    .join(" · ");
  throw new Error(`ตั้งค่า environment ไม่ครบ/ไม่ถูกต้อง: ${problems} (ดู backend/.env.example)`);
}

export const env = {
  ...parsed.data,
  APP_URL: parsed.data.APP_URL ?? parsed.data.CORS_ORIGIN.split(",")[0].trim(),
};
