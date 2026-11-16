# Backend API — PawHome

Base URL: `http://localhost:3000/api` (หน้าเว็บอ่านจาก `VITE_API_URL`) · สเปกแบบ OpenAPI: [openapi.yaml](openapi.yaml)

## กติการ่วม

- ส่ง/รับ JSON · body ไม่เกิน 100 KB (ยกเว้น `/uploads` ที่เป็น multipart ≤ 2 MB)
- ต้องล็อกอิน (🔒) = ส่ง `Authorization: Bearer <token>` · token คือ **access token ของ Supabase Auth** ที่ได้จาก `/auth/login` หรือ `/auth/register`
- สำเร็จ: ตอบข้อมูลตรง ๆ (ไม่มี envelope) ตามที่ `frontend/src/api/*.ts` อ่าน · สร้าง = `201` · ลบ = `204` (ไม่มี body)
- ผิดพลาด: `{ "message": "ข้อความภาษาไทย" }` — หน้าเว็บแสดงข้อความนี้ตรง ๆ

| Code | เมื่อไหร่ |
|---|---|
| 400 | ข้อมูลไม่ผ่าน validation / ผิดกฎ (ขอรับเลี้ยงน้องตัวเอง, น้องได้บ้านแล้ว, คำขอถูกพิจารณาแล้ว) / ไฟล์ไม่ใช่รูป / JSON พัง |
| 401 | ไม่มี token / token ผิดหรือหมดอายุ / อีเมลหรือรหัสผ่านผิด / refresh token ใช้ไม่ได้ |
| 403 | ไม่ใช่เจ้าของ / ยังไม่ได้ยืนยันอีเมล / บัญชีถูกระงับ |
| 429 | ส่ง `/auth/login` `/auth/register` `/auth/refresh` ถี่เกิน limit ของ Backend (มี `Retry-After`) หรือ Supabase Auth ตอบว่าเกิน limit |
| 502 | Supabase Auth ขัดข้อง (ไม่ใช่ความผิดของผู้ใช้) |
| 404 | ไม่พบน้อง / คำขอ / route (id ที่ไม่ใช่ตัวเลขบวกก็ตอบ 404) |
| 409 | ซ้ำ: อีเมลสมัครแล้ว, ♡ ซ้ำ, ยื่นคำขอซ้ำ |
| 502 | อัปโหลดไป Supabase Storage ไม่สำเร็จ |
| 503 | `/health` ต่อฐานข้อมูลไม่ได้ |
| 500 | อื่น ๆ (log ที่ server ไม่ส่งรายละเอียดออกไป) |

## Types

```ts
User            { id: string(uuid), name, email }
Pet             { id: number, name, species: "DOG"|"CAT"|"OTHER", breed, ageMonths, sex: "MALE"|"FEMALE", province,
                  imageUrl, description, vaccinated, sterilized, urgent, status: "AVAILABLE"|"PENDING"|"ADOPTED",
                  createdAt: ISO string, ownerId: string(uuid), ownerName }
PetInput        Pet ที่ไม่มี id, status, createdAt, ownerId, ownerName
AdoptionRequest { id: number, petId, userId: string(uuid), userName, phone, housing: "HOUSE"|"CONDO"|"DORM",
                  message, status: "PENDING"|"APPROVED"|"REJECTED", createdAt, pet: Pet }
```

## Endpoints (21)

`Session` = `{ user, token, refreshToken, expiresAt }` · `token` = Supabase access token (อายุสั้น ค่าเริ่มต้น 1 ชม.) · `refreshToken` ใช้ได้ครั้งเดียว · `expiresAt` = วินาที unix

| # | Method | Path | Auth | Request | Response | Errors | หน้าเว็บที่ใช้ |
|---|---|---|---|---|---|---|---|
| 1 | GET | `/health` | – | – | `{ status, database }` | 503 | (ตรวจระบบ) |
| 2 | POST | `/auth/register` | – (10/นาที/IP) | `{ name ≥2, email, password 6–72 }` | 201 `{ needsVerification: true, email }` (โปรเจกต์เปิด Confirm email — อีเมลที่มีบัญชีแล้วก็ได้คำตอบเดียวกัน กันการไล่เดาอีเมล) หรือ 201 `Session` (ปิด Confirm email) | 400, 403, 409 (เฉพาะตอนปิด Confirm email), 429, 502 | RegisterPage |
| 3 | POST | `/auth/login` | – (10/นาที/IP) | `{ email, password }` | `Session` | 400, 401, 403 (ยังไม่ยืนยันอีเมล), 429, 502 | LoginPage |
| 3a | POST | `/auth/refresh` | – (30/นาที/IP · ใช้ refresh token) | `{ refreshToken }` | `Session` ชุดใหม่ (refresh token ตัวเก่าใช้ไม่ได้อีก) | 400, 401, 429, 502 | `api/client.ts` อัตโนมัติ |
| 4 | GET | `/auth/me` | 🔒 | – | `User` | 401 | (ตรวจ session) |
| 5 | POST | `/auth/logout` | 🔒 | – | 204 | 401 | Navbar "ออกจากระบบ" |
| 6 | GET | `/pets` | – | query: `species`, `province`, `search`, `postedWithin` (1\|7\|30 วัน), `urgent` (true\|false) | `Pet[]` ใหม่สุดก่อน | 400 | PetsPage, AllPetsPage |
| 7 | GET | `/pets/:id` | – | – | `Pet` | 404 | PetDetailPage, PetFormPage |
| 8 | POST | `/pets` | 🔒 | `PetInput` (เจ้าของมาจาก token ไม่รับจาก body) | 201 `Pet` | 400, 401 | PetFormPage |
| 9 | PUT | `/pets/:id` | 🔒 เจ้าของ | `PetInput` | `Pet` | 400, 401, 403, 404 | PetFormPage |
| 10 | DELETE | `/pets/:id` | 🔒 เจ้าของ | – | 204 (ลบ ♡ และคำขอของน้องด้วย) | 401, 403, 404 | PetDetailPage |
| 11 | GET | `/me/pets` | 🔒 | – | `Pet[]` | 401 | MyPage |
| 12 | GET | `/me/favorites` | 🔒 | – | `Pet[]` (กดล่าสุดก่อน) | 401 | FavoriteButton, FavoritesGrid |
| 13 | POST | `/me/favorites` | 🔒 | `{ petId: number }` | 201 | 400, 401, 404, 409 | FavoriteButton |
| 14 | DELETE | `/me/favorites/:petId` | 🔒 | – | 204 (ไม่มีอยู่แล้วก็ 204) | 401 | FavoriteButton |
| 15 | GET | `/me/adoptions` | 🔒 | – | `AdoptionRequest[]` | 401 | AdoptionPanel, MyPage |
| 16 | POST | `/pets/:id/adoptions` | 🔒 | `{ phone, housing, message ≥20 }` (ตัดช่องว่าง/ขีดในเบอร์ให้) | 201 `AdoptionRequest` · น้องเป็น `PENDING` | 400, 401, 404, 409 | AdoptionPanel |
| 17 | GET | `/pets/:id/adoptions` | 🔒 เจ้าของน้อง | – | `AdoptionRequest[]` | 401, 403, 404 | OwnerRequests |
| 18 | DELETE | `/adoptions/:id` | 🔒 ผู้ยื่น | – | 204 · เฉพาะ `PENDING` · สถานะน้องคำนวณใหม่ | 400, 401, 403, 404 | AdoptionPanel, MyPage |
| 19 | PATCH | `/adoptions/:id` | 🔒 เจ้าของน้อง | `{ status: "APPROVED"\|"REJECTED" }` | `AdoptionRequest` · อนุมัติ → น้อง `ADOPTED` + คำขออื่นที่รอเป็น `REJECTED` | 400, 401, 403, 404 | OwnerRequests |
| 20 | POST | `/uploads` | 🔒 | multipart ช่อง `image` (JPG/PNG/WEBP ≤ 2 MB ตรวจจากไบต์หัวไฟล์) | 201 `{ url }` (public URL ใน bucket `pet-images/<userId>/<uuid>.<ext>`) | 400, 401, 502 | ImageUpload |

## Session

1. ล็อกอิน/สมัคร → หน้าเว็บเก็บ `Session` ใน localStorage (`pawhome-auth`) → กด F5 ยังล็อกอินอยู่
2. ก่อนยิงทุก request: ถ้า token จะหมดใน 60 วินาที → `POST /auth/refresh` ก่อน (หลาย request พร้อมกันใช้ refresh ครั้งเดียว)
3. Backend ตอบ 401 → refresh แล้วยิงซ้ำ 1 ครั้ง · refresh ได้ 400/401 → ล็อกเอาต์ แล้ว `RequireAuth` พาไป `/login?redirect=...`
4. เน็ตหลุด หรือ refresh ได้ 429/5xx → ไม่ล็อกเอาต์ แสดง error แล้วลองใหม่ได้
4a. **หลายแท็บ:** session อยู่ใน localStorage ร่วมกัน · แท็บหนึ่งเปลี่ยน → แท็บอื่นโหลดค่าใหม่ทันที (storage event) · refresh ทำทีละแท็บด้วย Web Locks API และอ่าน localStorage ใหม่ก่อน refresh ถ้าแท็บอื่นได้ token ใหม่แล้วก็ใช้ตัวนั้น — refresh token ตัวเก่าไม่ถูกใช้ซ้ำ (Supabase ยกเลิก session ทั้งชุดถ้าเจอการใช้ซ้ำหลังช่วงผ่อนผัน 10 วินาที) · ออกจากระบบแท็บหนึ่ง แท็บอื่นออกตาม
5. ออกจากระบบ → `POST /auth/logout` ยกเลิก refresh token ฝั่ง Supabase (token ใกล้หมดจะ refresh ก่อน เพื่อให้ยกเลิกได้จริง) แล้วล้างในเครื่องทันที

Backend ตรวจ access token ด้วย `supabase.auth.getUser(token)` ทุก request — Supabase ตรวจลายเซ็น วันหมดอายุ และ session ที่ถูกยกเลิก · หน้าเว็บไม่มี key ของ Supabase เลย

**Rate limit:** นับต่อ IP ต่อนาที แยกตาม endpoint ปรับได้ด้วย `RATE_LIMIT_*` · IP มาจาก `req.ip` ซึ่งเชื่อ `X-Forwarded-For` เฉพาะเมื่อตั้ง `TRUST_PROXY`

**ยกเลิก / อนุมัติคำขอพร้อมกัน:** ทั้งสองใช้คำสั่งแบบมีเงื่อนไข (`DELETE … WHERE id = ? AND status = 'PENDING'` / `UPDATE … WHERE id = ? AND status = 'PENDING'`) ใน transaction และเช็คจำนวนแถว — ฝั่งที่มาช้าได้ 400 หรือ 404 ข้อมูลไม่เพี้ยน (ทดสอบกับ Supabase จริง 5 รอบใน `npm run smoke:live`)

สถานะน้องคำนวณจากคำขอทุกครั้งที่คำขอเปลี่ยน (ใน transaction เดียวกัน): มีที่อนุมัติ → `ADOPTED` · มีที่รอ → `PENDING` · ไม่มี → `AVAILABLE`

## โครงสร้างโค้ด

`routes/index.ts` → `middleware/auth.ts` (requireAuth) → `controllers/*` (parse ด้วย `validators/*`) → `services/*` (กฎธุรกิจ + สิทธิ์) → `repositories/*` (Prisma) → PostgreSQL · error ทุกชนิดจบที่ `middleware/error.ts`
