# database/

| ไฟล์ | คืออะไร | รันซ้ำได้ |
|---|---|---|
| `schema.sql` | ตาราง, FK, CHECK, index, trigger, RLS, storage bucket | ✓ |
| `mock-data.sql` | ข้อมูลจำลองจากหน้าเว็บเดิม (DEMO เท่านั้น) | ✓ (ไม่เขียนทับ) |
| `verification/verify.sql` | ตรวจโครงสร้าง, ความสัมพันธ์, จำนวน, RLS — ทุกแถวต้อง `ok = true` | ✓ (อ่านอย่างเดียว) |

ไม่มีคำสั่ง `DROP TABLE` / `TRUNCATE` / `DELETE` ในทุกไฟล์

## ลำดับการรัน (Supabase Dashboard → SQL Editor → New query → วางทั้งไฟล์ → Run)

1. `database/schema.sql`
2. สร้างบัญชีทดลองผ่าน Supabase Auth: `cd backend && npm run seed:users` (ต้องตั้ง `backend/.env` ก่อน)
   — ไม่ insert ลง `auth.users` ตรง ๆ เพราะ Supabase ไม่รองรับ (ต้อง hash รหัสผ่านและสร้าง identity ให้ถูก)
3. `database/mock-data.sql` — ถ้ายังไม่ทำข้อ 2 จะหยุดพร้อมบอกให้ทำ
4. `database/verification/verify.sql` — ดูคอลัมน์ `ok` ต้องเป็น `true` ทุกแถว (แถวที่ไม่ผ่านขึ้นบนสุด)

บัญชีทดลอง (รหัส `123456`): `pong@pawhome.test` · `shelter@pawhome.test` · `mind@pawhome.test`

## ข้อควรระวัง

- `mock-data.sql` ใส่ id น้อง 1–12 เอง ให้รันบนโปรเจกต์ demo / ฐานข้อมูลที่ยังว่างเท่านั้น
- `verify.sql` คาดจำนวนแถวตามข้อมูลจำลอง — ถ้าใช้งานจริงไปแล้ว แถว `count: ...` จะไม่ตรง (ปกติ) แต่แถวอื่นต้องผ่าน
- แก้โครงสร้างตารางในอนาคต: เพิ่มไฟล์ใหม่ใน `database/migrations/` (เช่น `0002_add_x.sql`) แล้วแก้ `backend/prisma/schema.prisma` ให้ตรง — **ห้ามใช้** `prisma migrate` / `prisma db push`
- ทดสอบอัตโนมัติ: `cd backend && npm test` รันทั้ง 3 ไฟล์นี้ (schema + mock-data สองรอบ เพื่อตรวจว่ารันซ้ำได้) บน PostgreSQL จำลอง (PGlite) แล้วตรวจผล `verify.sql`
