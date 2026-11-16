import { inject } from "vitest";

// ค่าปลอมให้ src/config/env.ts ผ่าน — Supabase Auth/Storage ถูกแทนด้วย tests/fake-supabase.ts
process.env.DATABASE_URL = inject("databaseUrl");
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY = "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
// api.test ล็อกอินหลายสิบครั้งจาก IP เดียว — rate limit ทดสอบแยกใน rate-limit.test.ts
process.env.RATE_LIMIT_LOGIN_PER_MINUTE = "10000";
process.env.RATE_LIMIT_REGISTER_PER_MINUTE = "10000";
process.env.RATE_LIMIT_REFRESH_PER_MINUTE = "10000";
process.env.TRUST_PROXY = "false";
delete process.env.APP_URL;
process.env.CORS_ORIGIN = "http://localhost:5173";
