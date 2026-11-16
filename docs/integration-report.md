# Integration Report — PawHome

วันที่ทดสอบ: 16 พ.ย. 2026 · Windows 11 · Node 22.15.0 · Supabase project `xlbjxpsaciesbtpnxelw` (dev/demo)

## รอบล่าสุด: แก้ 6 ข้อจาก Code Review (16 พ.ย. 2026)

| # | เรื่อง | แก้ | ทดสอบ |
|---|---|---|---|
| 1 | หลายแท็บใช้ refresh token ซ้ำ → หลุดทุกแท็บ | storage event → `persist.rehydrate()` · refresh ทีละแท็บด้วย Web Locks + อ่าน localStorage ใหม่ก่อน refresh · 429/5xx ไม่ล็อกเอาต์ · ล้าง cache "ของฉัน" เมื่อคนล็อกอินเปลี่ยน (ทุกแท็บ) | Unit 7 กรณีหลายแท็บ (ลองถอด rehydrate / lock ออกแล้วเทสต์จับได้) · Playwright 2 แท็บจริงบน Supabase: refresh 1 ครั้ง, รอเกิน 10 วิแล้ว refresh ต่อยังล็อกอิน, ออกพร้อมกัน |
| 2 | สมัครด้วย Admin API ข้ามการยืนยันอีเมล + ไม่มี rate limit | `signUp` ปกติ (ยืนยันอีเมลตามโปรเจกต์) · หน้าเว็บแสดง "ตรวจอีเมล" และผลหลังกดลิงก์ · rate limit ต่อ IP แยก endpoint (`RATE_LIMIT_*`) 429 + Retry-After · `TRUST_PROXY` | API: ยืนยันอีเมล, ยังไม่ยืนยัน 403, ไม่บอกว่ามีบัญชีแล้ว, rate limit, X-Forwarded-For ปลอมไม่ช่วย, หลัง proxy นับแยก IP · Live: 10 ครั้งแล้ว 429 |
| 3 | Error ทุกแบบกลายเป็น "รหัสผิด" | แยก 401 / 403 / 429 / 502 · README มีตาราง rate limit ของ Supabase จากเอกสาร + วิธีเตรียมเดโม | API test จำลอง Supabase 429/500 · Live: ยังไม่ยืนยันอีเมล → 403 |
| 4 | ยกเลิก/อนุมัติพร้อมกัน | `deleteMany`/`updateMany` แบบ `status = PENDING` + เช็คจำนวนแถว ใน transaction · ตรวจเจ้าของก่อนเหมือนเดิม | API (PGlite รันทีละ connection) + **Live บน Postgres จริง 5 รอบพร้อมกัน: ผู้ชนะ 1 ฝั่ง ข้อมูลตรงทุกรอบ** |
| 5 | `SUPABASE_URL` ผิดรูปแบบผ่านได้ | รับเฉพาะ Project URL (https / http://localhost) ไม่มี path, query, # · ข้อความบอกว่าต้องตัดอะไรออก | Unit 9 กรณี |
| 6 | เขียน profile ซ้ำกับ trigger | ลบการเขียนตอนสมัคร · ถ้าไม่มี profile (trigger ไม่ทำงาน) สร้างตอนล็อกอินแทน การสมัครไม่ล้ม | API: profile มาจาก trigger · login สร้าง profile ที่หายได้ · Live: trigger เปิดอยู่, ผู้ใช้จริง 1 คนได้ profile ภายใน 5 วิหลังสมัคร |

Bug เพิ่มเติมจาก E2E: ลบโพสต์ทันทีหลังอนุมัติ → request โหลดคำขอที่ค้างอยู่มาถึงหลังลบ (404) → ยกเลิก request ของน้องตัวนั้นก่อนลบ (`onMutate` + `AbortSignal`)

| ชุดทดสอบ | ผล |
|---|---|
| Backend `npm test` | **118/118** PASS |
| Frontend `npm test` | **17/17** PASS |
| Typecheck backend / frontend | PASS / PASS |
| Build frontend · compile backend | PASS · PASS (`prisma generate` ต้องปิด dev server ก่อนบน Windows) |
| `npm run smoke:live` (Supabase จริง) | **51/51** PASS |
| Browser E2E Desktop / Mobile / 2 แท็บ | **17/17 · 17/17 · 4/4** PASS (รัน 2 รอบติด) |
| Lint | NOT TESTED — ไม่มี ESLint ในโปรเจกต์ |
| ส่งอีเมลยืนยันจริง + กดลิงก์จริง | NOT TESTED — ไม่ส่งไปที่อยู่ทดสอบ (bounce + โควตา 2 ฉบับ/ชม.) · ทดสอบ UI ด้วยการตอบแทน Backend ใน browser และทดสอบ Backend ด้วย Supabase จำลอง |

หมายเหตุ: ระหว่างทดสอบพบโพสต์ของผู้ใช้จริง 1 โพสต์ในฐานข้อมูล — การทดสอบไม่ได้แตะข้อมูลนั้น (สร้าง/ลบเฉพาะผู้ใช้ทดสอบ) และเทสต์นับจำนวนจาก API แทนเลขตายตัว

## ยืนยันโปรเจกต์ก่อนเขียนข้อมูล

ตรวจแบบอ่านอย่างเดียว (transaction `READ ONLY`) ก่อนรันคำสั่งใด ๆ: `SUPABASE_URL` และ user ของ `DATABASE_URL` ชี้ project ref เดียวกับที่ได้รับอนุญาต · ฐานข้อมูลว่างทั้งหมด (0 ตารางใน `public`, 0 ผู้ใช้ใน Auth, 0 bucket) จึงไม่มีข้อมูล production ที่จะกระทบได้

## ผลการทดสอบ

| ส่วน | รายการ | สถานะ | หลักฐาน |
|---|---|---|---|
| **Database** | `schema.sql` บน Supabase จริง | PASS | รันใน transaction เดียว สำเร็จ |
| | `mock-data.sql` บน Supabase จริง | PASS | 19 แถว (profiles 3, pets 12, favorites 2, คำขอ 2) |
| | `verify.sql` บน Supabase จริง | PASS | **43/43** (ตาราง, คอลัมน์, FK 6, RLS 4 ตาราง/11 policies + พฤติกรรม 10 กรณี, trigger, bucket, จำนวน, orphan, ซ้ำ, ความสอดคล้องสถานะ, identity, สิทธิ์ฟังก์ชัน) |
| | รันซ้ำ `schema.sql` + `mock-data.sql` บน Supabase จริง | PASS | ไม่ error · `verify.sql` ยัง 43/43 (ไม่มีข้อมูลซ้ำ) |
| | Guard: `mock-data.sql` หยุดเองเมื่อมีข้อมูลผู้ใช้จริง / ยังไม่มีบัญชีทดลอง | PASS | `tests/database.test.ts` |
| | Trigger สร้าง profile ได้แม้ไม่มีชื่อและอีเมล | PASS | `tests/database.test.ts` |
| **Supabase Auth** | `npm run seed:users` (Admin API) | PASS | สร้าง 3 บัญชี · trigger สร้าง profiles ครบ |
| | สมัคร / ล็อกอิน / รหัสผิด / อีเมลซ้ำ / token ปลอม | PASS | `npm run smoke:live` |
| | Refresh token → session ใหม่ใช้งานได้ · refresh ปลอม 401 · หลัง logout refresh ใช้ไม่ได้ | PASS | `npm run smoke:live` |
| **Storage** | อัปโหลดผ่าน `/uploads` → public URL เปิดได้ `image/png` · ไฟล์ปลอมถูกปฏิเสธ | PASS | `npm run smoke:live` + Browser E2E ข้อ 4 |
| | รูปจากข้อมูลจำลอง (Dog CEO / TheCatAPI) | PASS | เปิดได้ทั้งใน API test และในเบราว์เซอร์ |
| **Backend** | 21 endpoints กับ Supabase จริง | PASS | `npm run smoke:live` **49/49** |
| | Unit + API + session + database (PGlite) | PASS | `npm test` **97/97** |
| | Typecheck · production build | PASS | `npm run typecheck` · `npm run build` |
| **Frontend** | Unit tests (token หมดอายุ, refresh, retry 401, refresh ล้มเหลว, ยิงพร้อมกัน, เน็ตหลุด, logout ระหว่าง refresh, revoke) | PASS | `npm test` **10/10** |
| | Typecheck + build | PASS | `npm run build` · CSS bundle hash ไม่เปลี่ยน (`index-CFeQFole.css`) = style เหมือนเดิมทุกไบต์ |
| **Browser E2E** | Playwright (Chromium) Desktop 1280×900 | PASS | **16/16** |
| | Playwright Mobile (iPhone 12) | PASS | **16/16** |
| Lint | ESLint | NOT TESTED | โปรเจกต์ไม่มี ESLint config (ไม่ได้เพิ่มให้) |
| Supabase MCP | ใช้ MCP อ่าน schema | NOT TESTED | MCP ยังไม่เชื่อมในเซสชัน — ใช้การเชื่อมต่อตรงด้วย credentials ใน `backend/.env` แทน |

### Browser E2E (ทั้ง Desktop และ Mobile)

1 หน้าแรกน้องด่วน 4 ตัว + รูปขึ้น · 2 หน้าน้องทั้งหมด 12 ตัว + กรองแมว 6 ตัว · 3 สมัครสมาชิก · 4 โพสต์น้อง + อัปโหลดรูปไป Storage · 5 ออกจากระบบ (`/auth/logout` 204, localStorage ว่าง) · 6 สมัครคนที่สอง · 7 ♡ / เอาออก / หน้ารายการโปรด · 8 ส่งคำขอรับเลี้ยง · 9 ดูสถานะใน `/me` · 10 F5 แล้วยังล็อกอิน ข้อมูลยังอยู่ · 11 token หมดอายุ → refresh อัตโนมัติ 1 ครั้ง · 12 token + refresh token เสีย → ไปหน้า login แล้วกลับหน้าเดิม · 13 ยังไม่ล็อกอินเข้า `/favorites` → ไป login · 14 เจ้าของอนุมัติ → ได้บ้านแล้ว · 15 เจ้าของลบโพสต์ · 16 ไม่มี console error ที่ไม่คาดไว้

## Bug ที่พบจากการทดสอบจริงและแก้แล้ว

| Bug | ผลกระทบ | แก้ |
|---|---|---|
| ลบโพสต์แล้ว หน้าเว็บโหลดรายละเอียด/คำขอของน้องที่เพิ่งลบซ้ำ ก่อนเปลี่ยนหน้า | 404 สองครั้ง + console error ทุกครั้งที่ลบ (มีตั้งแต่ frontend เดิม) | `hooks/usePets.ts` ไม่ invalidate query ของน้องที่ลบ |
| Trigger `handle_new_user` ได้ชื่อว่างเมื่อไม่มีอีเมล | การสมัครทั้งก้อนล้ม | fallback เป็น "ผู้ใช้" |
| RLS ให้ยื่นคำขอผ่าน REST ตรงกับน้องของตัวเอง/น้องที่ได้บ้านแล้วได้ | ข้ามกฎธุรกิจ | เพิ่มเงื่อนไขใน policy |
| `mock-data.sql` ไม่กันการรันบนฐานข้อมูลที่มีข้อมูลจริง | id 1–12 ชน ข้อมูลผูกผิด | เพิ่ม guard |
| `handle_new_user` (security definer) เรียกผ่าน `/rest/v1/rpc` ได้ | ผิดหลัก least privilege | `revoke execute` |
| logout ขณะ token ใกล้หมดอายุ อาจ login กลับคืน และทิ้ง session ฝั่ง server | session ค้าง | `revokeSession()` ทำงานจาก snapshot ไม่แตะ store |

## ข้อมูลที่ทดสอบสร้างขึ้น

`smoke:live` และ Browser E2E สร้างผู้ใช้ทดสอบชั่วคราว แล้วลบเอง (ผู้ใช้ → cascade profiles/pets/favorites/คำขอ + ไฟล์ใน Storage) · ข้อมูลจำลองยังครบ (`verify.sql` 43/43 หลังทดสอบทั้งหมด) · ใน Supabase เหลือเฉพาะ: ตาราง/policy/trigger จาก `schema.sql`, bucket `pet-images`, บัญชีทดลอง 3 บัญชี และข้อมูลจำลอง 19 แถว
