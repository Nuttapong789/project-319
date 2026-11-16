# Frontend Audit — PawHome

ตรวจจากโค้ดจริงทุกไฟล์ใน `src/` (commit `7b31a16`) ก่อนแยกโฟลเดอร์ ไม่มีส่วนไหนเดาเอา

## 1. Project Architecture

| เรื่อง | ที่พบ |
|---|---|
| Framework | Vite 6 + React 19 + TypeScript 5.8 (strict) |
| Routing | React Router v7 (`createBrowserRouter`) ใน `src/router.tsx` |
| Server State | TanStack Query v5 (`src/hooks/*`) |
| Client State | Zustand v5 (`useAuthStore` persist ลง localStorage key `pawhome-auth`, `useFilterStore`, `useToastStore`) |
| Styling | Tailwind CSS v4 (`@theme` ใน `src/index.css`) + Google Fonts (IBM Plex Sans Thai, Prompt, Sriracha) |
| API layer | `src/api/client.ts` → `fetch(VITE_API_URL + path)` แนบ `Authorization: Bearer <token>` · error อ่านจาก `{ message }` · 401 แล้วล็อกเอาต์อัตโนมัติ |
| Mock | `src/api/mockPets.ts` ใช้เมื่อ `VITE_USE_MOCK=true` หรือไม่มี `VITE_API_URL` — ทุกฟังก์ชันใน `src/api/*.ts` สลับ mock/จริงด้วย `USE_MOCK` |
| Deploy | `vercel.json` rewrite ทุก path → `index.html` |
| Backend เดิม | **ไม่มี** มีแต่สัญญา API ใน README และคอมเมนต์ใน `src/api/*.ts` |
| Supabase เดิม | **ไม่มี** ทั้งโค้ดและ migration (`.mcp.json` เพิ่งเพิ่ม ยังไม่ได้เชื่อมต่อในเซสชันนี้) |

ID ทุกตัวใน mock เป็น `number` · เวลาเป็น ISO string · Enum เป็นตัวพิมพ์ใหญ่ (`DOG`, `PENDING` ฯลฯ)

## 2. Pages Inventory

| Page | Route | Auth | จุดประสงค์ | ข้อมูล / API ที่เรียก | Action | สถานะ (mock) |
|---|---|---|---|---|---|---|
| PetsPage | `/` | – | หน้าแรก น้องที่ต้องการบ้านด่วน | `GET /pets?urgent=true` (PetList urgentOnly) · โฆษณาจาก `data/ads.ts` | ♡, ลิงก์ไป `/pets`, `/pets/new` | ทำงาน |
| AllPetsPage | `/pets` | – | ฟีดน้องทั้งหมด + ตัวกรอง | `GET /pets?species&province&search&postedWithin&urgent` | FilterBar (ค้นหา, จังหวัด, ช่วงเวลา, ความด่วน, ชนิด, ล้าง) | ทำงาน |
| PetDetailPage | `/pets/:id` | – (บางส่วนต้องล็อกอิน) | รายละเอียดน้อง | `GET /pets/:id` · เจ้าของ: `GET /pets/:id/adoptions` · คนอื่น: `GET /me/adoptions` | ♡ · เจ้าของ: แก้ไข / ลบ (`DELETE /pets/:id`) / อนุมัติ-ไม่ผ่าน (`PATCH /adoptions/:id`) · คนอื่น: ยื่นคำขอ (`POST /pets/:id/adoptions`) / ยกเลิก (`DELETE /adoptions/:id`) | ทำงาน |
| PetFormPage | `/pets/new`, `/pets/:id/edit` | ✓ (แก้ไขเฉพาะเจ้าของ) | สร้าง/แก้ไขโพสต์ | `GET /pets/:id` (แก้ไข) · `POST /uploads` · `POST /pets` · `PUT /pets/:id` | อัปโหลดรูป, ลบรูป, บันทึก | ทำงาน |
| FavoritesPage | `/favorites` | ✓ | รายการโปรด | `GET /me/favorites` | ♡ เอาออก | ทำงาน |
| MyPage | `/me?tab=posts\|requests\|favorites` | ✓ | โพสต์ของฉัน / คำขอที่ยื่น / รายการโปรด | `GET /me/pets`, `GET /me/adoptions`, `GET /me/favorites` | ยกเลิกคำขอ | ทำงาน |
| GuidePage | `/guide` | – | ความรู้เลี้ยงหมาแมว | static `data/guide.ts` | แท็บ ทั้งหมด/สุนัข/แมว (useState) | ทำงาน (ไม่ต้องใช้ API) |
| LoginPage | `/login?redirect=` | – | เข้าสู่ระบบ | `POST /auth/login` | submit | ทำงาน |
| RegisterPage | `/register?redirect=` | – | สมัครสมาชิก | `POST /auth/register` | submit | ทำงาน |
| NotFoundPage | `*` | – | 404 | – | กลับหน้าแรก | ทำงาน |

ทุกปุ่มที่มี handler ทำงานจริงใน mock · ยกเว้นปุ่มบนการ์ดโฆษณา (`href: "#"` ตั้งใจให้เป็น placeholder)

## 3. Component Inventory

| Component | ใช้ที่ | หน้าที่ | API |
|---|---|---|---|
| PetList | PetsPage, AllPetsPage | รายการ + skeleton / error / empty | `usePets` |
| PetCard | PetList, FavoritesGrid, MyPage | การ์ดน้อง | – |
| FilterBar | AllPetsPage | ตัวกรอง (Zustand) · export `provinces` (7 จังหวัด) ใช้ใน PetFormPage | – |
| FavoriteButton | PetCard, PetDetailPage | ♡ toggle · ยังไม่ล็อกอิน → ไป `/login` | `useFavorites`, `useToggleFavorite` |
| FavoritesGrid | FavoritesPage, MyPage | กริดรายการโปรด | `useFavorites` |
| AdoptionPanel | PetDetailPage (ไม่ใช่เจ้าของ) | ฟอร์ม/สถานะคำขอ | `useMyAdoptions`, `useCreateAdoption`, `useCancelAdoption` |
| OwnerRequests | PetDetailPage (เจ้าของ) | รายการคำขอ + อนุมัติ/ไม่ผ่าน | `usePetAdoptions`, `useReviewAdoption` |
| ImageUpload | PetFormPage | เลือกไฟล์ JPG/PNG/WEBP ≤ 2 MB → อัปโหลด | `useUploadImage` |
| PetImage | หลายที่ | รูป + fallback รูปเท้าเมื่อรูปเสีย/ว่าง | – |
| AdoptionBadge, States, Field, AuthShell, PawLogo, Toaster, RequireAuth | ทั่วไป | UI / guard | – |
| AdStrip, AdSection, AdCard | PetsPage | โฆษณา static | – |

## 4. Forms & Validation (ฝั่งหน้าเว็บ — Backend ต้องตรวจซ้ำให้ตรงกัน)

| ฟอร์ม | กฎ |
|---|---|
| Login | email ตาม `EMAIL_PATTERN`, password ≥ 6 |
| Register | name ≥ 2 (trim), email, password ≥ 6, confirm ตรงกัน |
| Pet | name ≥ 2 (trim), province ต้องเลือก, ageMonths จำนวนเต็ม 0–300, description ≥ 20 (trim), species `DOG/CAT/OTHER`, sex `MALE/FEMALE` |
| Adoption | phone (ตัดช่องว่าง/ขีด) `^0\d{8,9}$`, message ≥ 20 (trim), housing `HOUSE/CONDO/DORM`, ติ๊กยอมรับ (ฝั่งหน้าเว็บอย่างเดียว) |
| Upload | mime `image/jpeg, image/png, image/webp`, ≤ 2 MB |

## 5. Existing Mock Data (`src/api/mockPets.ts`) — ต้นแบบของ Seed

| ตาราง | จำนวน | รายละเอียด |
|---|---|---|
| users | 3 | `1 ปอง pong@pawhome.test` · `2 บ้านพักน้องจร shelter@pawhome.test` · `3 มายด์ mind@pawhome.test` — รหัส `123456` ทุกบัญชี |
| pets | 12 | id 1–12 · เจ้าของ: ปอง = มะลิ(2), ส้มโอ(4), ส้มจี๊ด(10) · ที่เหลือบ้านพักน้องจร · `createdAt` เป็นเวลาย้อนหลังจากตอนนี้ (5–600 ชม.) · สถานะ AVAILABLE 9, PENDING 2 (ถั่วแดง 3, ส้มโอ 4), ADOPTED 1 (ไข่ตุ๋น 6) · urgent 4 ตัว (1, 4, 8, 9) |
| favorites | 2 | ปอง ♡ ข้าวตัง(1), บราวนี่(5) |
| adoptions | 2 | `1` ปอง → ถั่วแดง(3) HOUSE PENDING · `2` มายด์ → ส้มโอ(4) CONDO PENDING |

ข้อสังเกต: ไข่ตุ๋น (6) เป็น `ADOPTED` โดยไม่มีคำขอที่อนุมัติ — คงไว้ตามต้นฉบับ (สถานะน้องเก็บเป็นคอลัมน์ ไม่ได้คำนวณสด)

รูปภาพ 12 ลิงก์ (Dog CEO, TheCatAPI) — ตรวจแล้วตอบ `200 image/jpeg` ทุกลิงก์ (16 พ.ย. 2026) · `public/pawhome-cat.png` เป็น asset ของหน้าแรก

ข้อมูล static ที่ **ไม่ใช่** ข้อมูลจาก Database (คงไว้ในหน้าเว็บ ตามคอมเมนต์ในไฟล์เดิม): `data/ads.ts` (3 โฆษณา), `data/guide.ts` (8 หัวข้อ + 6 อาการฉุกเฉิน), `provinces` (7 จังหวัด)

## 6. Required Backend APIs (ตามที่หน้าเว็บเรียกจริง)

| Method | Path | Auth | ใช้ที่ |
|---|---|---|---|
| POST | `/auth/register` | – | RegisterPage |
| POST | `/auth/login` | – | LoginPage |
| GET | `/pets` | – | PetsPage, AllPetsPage |
| GET | `/pets/:id` | – | PetDetailPage, PetFormPage |
| POST | `/pets` | ✓ | PetFormPage |
| PUT | `/pets/:id` | ✓ เจ้าของ | PetFormPage |
| DELETE | `/pets/:id` | ✓ เจ้าของ | PetDetailPage |
| GET | `/me/pets` | ✓ | MyPage |
| GET / POST | `/me/favorites` | ✓ | FavoriteButton, FavoritesGrid |
| DELETE | `/me/favorites/:petId` | ✓ | FavoriteButton |
| GET | `/me/adoptions` | ✓ | AdoptionPanel, MyPage |
| POST | `/pets/:id/adoptions` | ✓ | AdoptionPanel |
| GET | `/pets/:id/adoptions` | ✓ เจ้าของ | OwnerRequests |
| DELETE | `/adoptions/:id` | ✓ ผู้ยื่น | AdoptionPanel, MyPage |
| PATCH | `/adoptions/:id` | ✓ เจ้าของน้อง | OwnerRequests |
| POST | `/uploads` | ✓ | ImageUpload |

Response: ส่งข้อมูลตรง ๆ (`Pet`, `Pet[]`, `{ user, token }`, `{ url }`) · error `{ message }` · 201 สร้าง · 204 ลบ

ไม่พบใน UI: pagination, sorting ที่เลือกได้, role admin, dashboard/สถิติ, แก้ไขโปรไฟล์, history — จึงไม่สร้าง

## 7. Database Requirements

- `profiles` (ชื่อที่แสดง) ผูกกับ Supabase Auth user
- `pets` + FK เจ้าของ · index สำหรับตัวกรอง species / province / urgent / created_at
- `favorites` unique (user, pet)
- `adoption_requests` unique (user, pet) · อนุมัติได้คนเดียวต่อน้อง
- ลบน้อง → ลบ favorites + adoption_requests (cascade)
- Storage bucket สำหรับรูปน้อง (public read)

## 8. Missing Features / Integration Issues

| เรื่อง | ผลกระทบ | แก้ยังไง |
|---|---|---|
| ไม่มี Backend / Database เลย | ข้อมูลหายเมื่อรีเฟรช | สร้าง `backend/` + `database/` |
| `User.id`, `ownerId`, `userId` เป็น `number` แต่ Supabase Auth ใช้ UUID | type ไม่ตรง | เปลี่ยน type เป็น `string` (การเปรียบเทียบ `user.id === pet.ownerId` ใช้ได้เหมือนเดิม) · id น้อง/คำขอยังเป็นตัวเลข URL `/pets/3` เหมือนเดิม |
| ออกจากระบบลบแค่ token ในเครื่อง | refresh token ฝั่ง Supabase ยังอยู่ | เพิ่ม `POST /auth/logout` แล้วให้หน้าเว็บเรียก |
| token ของ Supabase หมดอายุ (ค่าเริ่มต้น 1 ชม.) | หน้าเว็บไม่มี refresh token flow | ใช้กลไกเดิม: 401 → ล็อกเอาต์อัตโนมัติ (บันทึกเป็น Known Issue) |
| `.gitignore` มีแค่ 3 บรรทัด | | ขยายตาม Phase 8 |

## 9. Recommended Implementation Order

1. ย้ายไฟล์เข้า `frontend/` แล้วยืนยันว่า build ผ่าน
2. `database/schema.sql` → ทดสอบรัน
3. Backend: config → auth middleware → pets → favorites → adoptions → uploads
4. สร้างบัญชีทดลองผ่าน Supabase Auth Admin API (`npm run seed:users`) → `database/mock-data.sql` → `verify.sql`
5. เปลี่ยน type ID ฝั่งหน้าเว็บ + เรียก logout → ปิด mock
6. ทดสอบ backend + SQL · ทดสอบ E2E กับ Supabase จริง (ต้องมี credentials)
