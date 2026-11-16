# PawHome — Backend

Node.js 22 · TypeScript · Express 5 · Prisma 6 · Zod · Supabase (Auth + Storage + PostgreSQL)

## วิธีรัน

```bash
cd backend
npm install                 # รัน prisma generate ให้เอง
cp .env.example .env        # Windows: copy .env.example .env  แล้วใส่ค่าจาก Supabase
npm run dev                 # http://localhost:3000/api/health
```

ต้องรัน `database/schema.sql` ใน Supabase ก่อน (ดู [database/README.md](../database/README.md))

| Script | ทำอะไร |
|---|---|
| `npm run dev` | รันแบบ watch (tsx) |
| `npm run build` / `npm start` | compile ไป `dist/` แล้วรันด้วย node |
| `npm test` | 118 เทสต์: unit + ทุก endpoint + session/refresh + ยืนยันอีเมล + rate limit + ยกเลิก/อนุมัติพร้อมกัน + `verify.sql` + ความปลอดภัยของ seed บน PostgreSQL จำลอง (PGlite) ไม่ต้องมี credentials |
| `npm run typecheck` | ตรวจ type ทั้ง src และ tests |
| `npm run seed:users` | สร้างบัญชีทดลอง 3 บัญชีใน Supabase Auth (ก่อนรัน `mock-data.sql`) |
| `npm run smoke:live` | ทดสอบทุก endpoint กับ Supabase จริงผ่าน server ที่รันอยู่ (51 รายการ รวมยกเลิก/อนุมัติพร้อมกัน 5 รอบ) แล้วลบข้อมูลทดสอบ · ไม่สมัครผ่านหน้าสาธารณะ (ไม่ส่งอีเมล) · dev/demo เท่านั้น |

## โครงสร้าง

```
src/
├─ app.ts              express app (cors, json, /api/health, routes, error handler)
├─ server.ts           listen
├─ config/             env (ตรวจด้วย Zod), prisma, supabase (service role + anon client)
├─ routes/index.ts     รายชื่อ 21 endpoint
├─ middleware/         auth (ตรวจ Supabase token) · error (ApiError → { message }) · upload (multer)
├─ controllers/        แปลง HTTP ↔ service · parse input ด้วย validators
├─ services/           กฎธุรกิจ + ตรวจสิทธิ์เจ้าของ + transaction
├─ repositories/       query ผ่าน Prisma + แปลงแถวเป็นรูปแบบที่หน้าเว็บใช้
├─ validators/         Zod schema (กฎเดียวกับฟอร์มในหน้าเว็บ)
└─ types/dto.ts        type ที่ส่งให้หน้าเว็บ (ตรงกับ frontend/src/types)
prisma/schema.prisma   แผนที่ตาราง (โครงสร้างจริงอยู่ที่ database/schema.sql)
scripts/seed-users.ts  บัญชีทดลอง
tests/                 global-setup (PGlite) · fake-supabase · api / database / unit tests
```

API ทั้งหมด: [docs/backend-api.md](../docs/backend-api.md)

## ความปลอดภัย

- รหัสผ่านอยู่ใน Supabase Auth (bcrypt) Backend ไม่เคยเก็บ
- `SUPABASE_SERVICE_ROLE_KEY` และ `DATABASE_URL` อยู่ใน `.env` ฝั่ง Backend เท่านั้น
- ทุก route ที่แก้ข้อมูลตรวจเจ้าของจาก token ไม่เชื่อ `ownerId`/`userId` ใน body
- รูปตรวจจากไบต์หัวไฟล์ (ไม่เชื่อนามสกุล/Content-Type) · ชื่อไฟล์สุ่ม
- CORS เปิดเฉพาะ `CORS_ORIGIN`
- Rate limit `/auth/login` `/auth/register` `/auth/refresh` ต่อ IP (`RATE_LIMIT_*`) · ไม่เชื่อ `X-Forwarded-For` จนกว่าจะตั้ง `TRUST_PROXY`
- สมัครสมาชิกใช้ `signUp` ปกติ (ยืนยันอีเมลตามการตั้งค่าโปรเจกต์) · Admin API ใช้เฉพาะ `seed:users`, logout และสคริปต์ทดสอบ
- `SUPABASE_URL` ต้องเป็น Project URL อย่างเดียว (https หรือ http://localhost) ไม่งั้น server ไม่ยอมเริ่มพร้อมบอกว่าผิดตรงไหน
