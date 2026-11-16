# PawHome — Frontend

เว็บหาบ้านให้น้องหมาแมวจร (Final Project · ส่วน Frontend)

Vite + React (TypeScript) · React Router v7 · TanStack Query · Zustand · Tailwind CSS v4

## วิธีรัน

```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run dev
```

เปิด http://localhost:5173

- **ยังไม่มี Backend:** ใน `.env` ตั้ง `VITE_USE_MOCK=true` เว็บจะใช้ฐานข้อมูลจำลองใน `src/api/mockPets.ts` (ผู้ใช้ น้อง รายการโปรด คำขอรับเลี้ยง) ทำได้ทุกอย่าง แต่รีเฟรชแล้วข้อมูลจะกลับเป็นค่าเดิม
  - บัญชีทดลอง (รหัส `123456`): `pong@pawhome.test` (เจ้าของโพสต์มะลิ ส้มโอ ส้มจี๊ด) · `shelter@pawhome.test` · `mind@pawhome.test`
- **Backend พร้อมแล้ว:** ตั้ง `VITE_API_URL=http://localhost:3000/api` และ `VITE_USE_MOCK=false` แล้วรัน `npm run dev` ใหม่

## โครงโฟลเดอร์

```
src/
├─ main.tsx              จุดเริ่ม: QueryClientProvider + RouterProvider
├─ router.tsx            รายชื่อหน้าทั้งหมด + หน้าที่ต้องล็อกอิน (RequireAuth)
├─ index.css             Tailwind + สีธีม PawHome (@theme)
├─ types/                pet.ts, user.ts, adoption.ts (ต้องตรงกับ schema.prisma)
├─ api/
│  ├─ client.ts          fetch กลาง + แนบ token + จัดการ error จาก Backend
│  ├─ pets.ts            /pets, /me/pets
│  ├─ auth.ts            /auth/login, /auth/register
│  ├─ favorites.ts       /me/favorites
│  ├─ adoptions.ts       /me/adoptions, /pets/:id/adoptions, /adoptions/:id
│  ├─ uploads.ts         /uploads (อัปโหลดรูป)
│  └─ mockPets.ts        ฐานข้อมูลจำลองระหว่างรอ Backend
├─ hooks/                TanStack Query: usePets, useAuth, useFavorites, useAdoptions, useUpload
├─ stores/               Zustand: useFilterStore (ตัวกรอง), useAuthStore (คนที่ล็อกอิน + token), useToastStore (แจ้งเตือน)
├─ layouts/RootLayout.tsx     Navbar (เปลี่ยนตามการล็อกอิน) + <Outlet /> + Footer + Toaster
├─ data/                 ads.ts (โฆษณา), guide.ts (เนื้อหาหน้าความรู้)
├─ components/           PetCard, PetList, FavoriteButton, AdoptionPanel, OwnerRequests, ImageUpload, Toaster, RequireAuth, Field ฯลฯ
└─ pages/
   ├─ PetsPage.tsx       /              หน้าแรก: น้องที่ต้องการบ้านด่วน
   ├─ AllPetsPage.tsx    /pets          ฟีดน้องทั้งหมด + ตัวกรอง
   ├─ PetDetailPage.tsx  /pets/:id      รายละเอียด, ♡, ขอรับเลี้ยง / (เจ้าของ) แก้ไข ลบ อนุมัติคำขอ
   ├─ PetFormPage.tsx    /pets/new      สร้าง + อัปโหลดรูป        🔒
   │                     /pets/:id/edit แก้ไข (เฉพาะเจ้าของ)       🔒
   ├─ FavoritesPage.tsx  /favorites     รายการโปรด                🔒
   ├─ MyPage.tsx         /me            โพสต์ของฉัน / คำขอที่ยื่นไว้ / รายการโปรด  🔒
   ├─ GuidePage.tsx      /guide         ความรู้เบื้องต้นเรื่องหมาแมว
   ├─ LoginPage.tsx      /login
   ├─ RegisterPage.tsx   /register
   └─ NotFoundPage.tsx   *              404
```
🔒 = ต้องล็อกอิน ถ้ายังไม่ล็อกอินจะถูกพาไป `/login?redirect=...` แล้วกลับมาหน้าเดิมเมื่อล็อกอินเสร็จ

## ข้อมูลไหลยังไง

```
ผู้ใช้เลือกตัวกรอง → Zustand (useFilterStore)
                       ↓
PetsPage เรียก usePets(filters) → TanStack Query → api/pets.ts → fetch
                                                      ↓
                                     Express (GET /pets) → Prisma → PostgreSQL
```

หลังสร้าง แก้ หรือลบ → `useMutation` → `onSuccess` เรียก `invalidateQueries(["pets"])` → TanStack Query โหลดรายการใหม่เอง หน้าเว็บอัปเดตโดยไม่ต้องกด F5 (Zero-Refresh)

## คำถามที่อาจารย์น่าจะถาม

**Zustand กับ TanStack Query ต่างกันยังไง?**
TanStack Query เก็บ **Server State** คือข้อมูลที่มาจาก Database ดูแล cache, loading, error และ refetch ให้ ส่วน Zustand เก็บ **Client State** คือสิ่งที่ผู้ใช้เลือกบนหน้าจอ เช่น ตัวกรอง รายการน้องจึงไม่ได้เก็บซ้ำใน Zustand ข้อมูลมีที่มาที่เดียว (Single Source of Truth)

**ทำไมเปลี่ยนตัวกรองแล้วข้อมูลโหลดใหม่เอง?**
`queryKey` มีตัวกรองอยู่ข้างใน (`["pets", "list", filters]`) พอตัวกรองเปลี่ยน key ก็เปลี่ยน TanStack Query เลยดึงข้อมูลชุดใหม่ให้

**ตรวจข้อมูลก่อนบันทึกตรงไหน?**
ฟังก์ชัน `validate()` ใน `PetFormPage.tsx` ตรวจฝั่งหน้าเว็บ และ Backend ต้องตรวจซ้ำแล้วตอบ 400 พร้อม `{ message }` ถ้าข้อมูลผิด หน้าเว็บจะแสดงข้อความนั้นใต้ฟอร์ม

**ทำไมเก็บคนที่ล็อกอินไว้ใน Zustand ไม่ใช่ TanStack Query?**
คนที่ล็อกอินอยู่เป็นสถานะของหน้าเว็บ (ใช้ตัดสินว่าจะโชว์เมนูไหน แนบ token ไปกับ request) ไม่ใช่รายการข้อมูลที่ต้อง cache หรือ refetch ส่วนรายการโปรดและคำขอรับเลี้ยงเป็นข้อมูลใน Database จึงอยู่ใน TanStack Query ใช้ `persist` ของ Zustand ให้กด F5 แล้วยังล็อกอินอยู่

**ออกจากระบบแล้วข้อมูลของคนเก่าหายไปไหน?**
queryKey ของข้อมูลส่วนตัวขึ้นต้นด้วย `"me"` ทั้งหมด (`["me","favorites"]`, `["me","adoptions"]`, `["me","pets"]`) ตอนออกจากระบบเรียก `removeQueries({ queryKey: ["me"] })` ครั้งเดียวล้างหมด

**Toast ทำงานยังไง?**
`useToastStore` (Zustand) เก็บรายการแจ้งเตือน `onSuccess` ของ mutation เรียก `toast("บันทึกแล้ว")` แล้ว `<Toaster />` ใน RootLayout แสดงผล หายเองใน 3 วินาที

**ทำไมกด F5 บน Vercel แล้วไม่ 404?**
`vercel.json` ตั้ง rewrite ให้ทุกลิงก์ส่ง `index.html` แล้วให้ React Router เลือกหน้าเอง

## สิ่งที่ต้องตกลงกับคนทำ Backend

**ทั่วไป**
- ตอน error ส่ง JSON `{ "message": "ข้อความภาษาไทย" }` พร้อม status code ที่ถูก: 400 ข้อมูลผิด · 401 ยังไม่ล็อกอิน/token ผิด · 403 ไม่ใช่เจ้าของ · 404 ไม่พบ · 409 ซ้ำ · 500
- ลบสำเร็จตอบ 204 · สร้างสำเร็จตอบ 201
- เปิด `cors` ให้ `http://localhost:5173`
- route ที่ต้องล็อกอิน อ่าน token จาก header `Authorization: Bearer <token>` (เช่นใช้ jsonwebtoken)

**ตาราง (schema.prisma)**
- `User` id, name, email (`@unique`), password (เก็บแบบ bcrypt hash ห้ามส่งกลับมา)
- `Pet` ช่องตาม `src/types/pet.ts` + `ownerId` (FK → User) และตอบ `ownerName` มาด้วย
- `Favorite` userId, petId, createdAt — `@@unique([userId, petId])`
- `AdoptionRequest` id, userId, petId, phone, housing (`HOUSE`/`CONDO`/`DORM`), message, status (`PENDING`/`APPROVED`/`REJECTED`), createdAt — `@@unique([userId, petId])`
- ลบน้องแล้วลบ Favorite และ AdoptionRequest ของน้องตัวนั้นด้วย (`onDelete: Cascade`)

**Route**

| Method | Path | ต้องล็อกอิน | หมายเหตุ |
|---|---|---|---|
| POST | `/auth/register` | | `{ name, email, password }` → `{ user, token }` · อีเมลซ้ำ 409 |
| POST | `/auth/login` | | `{ email, password }` → `{ user, token }` · ผิด 401 |
| GET | `/pets?species&province&search&postedWithin&urgent` | | `postedWithin` = จำนวนวัน (1, 7, 30) · `urgent` = true/false ไม่ส่ง = ทั้งหมด |
| GET | `/pets/:id` | | |
| POST | `/pets` | ✓ | ownerId มาจาก token |
| PUT / DELETE | `/pets/:id` | ✓ เจ้าของ | ไม่ใช่เจ้าของ 403 |
| GET | `/me/pets` | ✓ | โพสต์ของฉัน |
| GET | `/me/favorites` | ✓ | → `Pet[]` |
| POST | `/me/favorites` | ✓ | `{ petId }` · ซ้ำ 409 |
| DELETE | `/me/favorites/:petId` | ✓ | 204 |
| GET | `/me/adoptions` | ✓ | คำขอที่ฉันยื่น (include `pet`) |
| POST | `/pets/:id/adoptions` | ✓ | `{ phone, housing, message }` · ซ้ำ 409 · ขอน้องของตัวเอง/น้องได้บ้านแล้ว 400 · น้องเปลี่ยนเป็น `PENDING` |
| DELETE | `/adoptions/:id` | ✓ ผู้ยื่น | ยกเลิกได้เฉพาะที่ยัง `PENDING` |
| GET | `/pets/:id/adoptions` | ✓ เจ้าของน้อง | คำขอทั้งหมดของน้องตัวนี้ |
| PATCH | `/adoptions/:id` | ✓ เจ้าของน้อง | `{ status: "APPROVED" \| "REJECTED" }` · อนุมัติแล้วน้องเป็น `ADOPTED` และคำขออื่นที่รออยู่เป็น `REJECTED` |
| POST | `/uploads` | ✓ | multipart ช่อง `image` (jpg/png/webp ≤ 2 MB) → `{ url }` ใช้ multer เก็บไฟล์ หรือส่งต่อ Cloudinary / Supabase Storage |

สถานะน้อง: ไม่มีคำขอ = `AVAILABLE` · มีคำขอรอ = `PENDING` · มีคำขออนุมัติ = `ADOPTED` (ดูตัวอย่าง logic ได้ที่ `syncPetStatus()` ใน `mockPets.ts`)

## เครดิต

ภาพแมวหน้าแรก: Claire Abdo / Unsplash · ข้อมูลสัตว์เป็นข้อมูลจำลองเพื่อการศึกษา · เนื้อหาหน้าความรู้เป็นข้อมูลทั่วไป ไม่ใช้แทนคำแนะนำของสัตวแพทย์
#   p r o j e c t - 3 1 9  
 