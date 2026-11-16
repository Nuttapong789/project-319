# PawHome — Frontend

เว็บหาบ้านให้น้องหมาแมวจร (Final Project · ส่วน Frontend)

Vite + React (TypeScript) · React Router v7 · TanStack Query · Zustand · Tailwind CSS v4

## วิธีรัน

```bash
cd frontend
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run dev
```

เปิด http://localhost:5173 · `npm test` = unit tests ของการต่ออายุ session (`src/api/client.test.ts`)

- **ใช้ Backend จริง (ค่าเริ่มต้น):** `VITE_API_URL=http://localhost:3000/api` และ `VITE_USE_MOCK=false` แล้วรัน Backend (`cd backend && npm run dev`) — ดู [README หลัก](../README.md)
- **ไม่มี Backend:** ตั้ง `VITE_USE_MOCK=true` เว็บจะใช้ฐานข้อมูลจำลองใน `src/api/mockPets.ts` ทำได้ทุกอย่าง แต่รีเฟรชแล้วข้อมูลกลับเป็นค่าเดิม
- บัญชีทดลอง (รหัส `123456`) ใช้ได้ทั้งสองโหมด: `pong@pawhome.test` (เจ้าของโพสต์มะลิ ส้มโอ ส้มจี๊ด) · `shelter@pawhome.test` · `mind@pawhome.test`

## โครงโฟลเดอร์

```
src/
├─ main.tsx              จุดเริ่ม: QueryClientProvider + RouterProvider
├─ router.tsx            รายชื่อหน้าทั้งหมด + หน้าที่ต้องล็อกอิน (RequireAuth)
├─ index.css             Tailwind + สีธีม PawHome (@theme)
├─ types/                pet.ts, user.ts, adoption.ts (ต้องตรงกับ backend/src/types/dto.ts)
├─ api/
│  ├─ client.ts          fetch กลาง + แนบ token + ต่ออายุ token อัตโนมัติ (refresh) + จัดการ error จาก Backend
│  ├─ pets.ts            /pets, /me/pets
│  ├─ auth.ts            /auth/login, /auth/register, /auth/logout
│  ├─ favorites.ts       /me/favorites
│  ├─ adoptions.ts       /me/adoptions, /pets/:id/adoptions, /adoptions/:id
│  ├─ uploads.ts         /uploads (อัปโหลดรูป)
│  └─ mockPets.ts        ฐานข้อมูลจำลอง (VITE_USE_MOCK=true) — ข้อมูลชุดเดียวกับ database/mock-data.sql
├─ hooks/                TanStack Query: usePets, useAuth, useFavorites, useAdoptions, useUpload
├─ stores/               Zustand: useFilterStore (ตัวกรอง), useAuthStore (คนที่ล็อกอิน + token), useToastStore (แจ้งเตือน)
├─ layouts/RootLayout.tsx     Navbar (เปลี่ยนตามการล็อกอิน) + <Outlet /> + Footer + Toaster
├─ data/                 promos.ts (การ์ดข่าวสาร/ร่วมช่วยเหลือ/ผู้สนับสนุน + เนื้อหาหน้ารายละเอียด), guide.ts (เนื้อหาหน้าความรู้)
├─ components/           PetCard, PetList, FavoriteButton, AdoptionPanel, OwnerRequests, ImageUpload, UserMenu (avatar + เมนูบัญชี), AdStrip, Toaster, RequireAuth, Field ฯลฯ
└─ pages/
   ├─ PetsPage.tsx       /              หน้าแรก: น้องที่ต้องการบ้านด่วน
   ├─ AllPetsPage.tsx    /pets          ฟีดน้องทั้งหมด + ตัวกรอง
   ├─ PetDetailPage.tsx  /pets/:id      รายละเอียด, ♡, ขอรับเลี้ยง / (เจ้าของ) แก้ไข ลบ อนุมัติคำขอ
   ├─ PetFormPage.tsx    /pets/new      สร้าง + อัปโหลดรูป        🔒
   │                     /pets/:id/edit แก้ไข (เฉพาะเจ้าของ)       🔒
   ├─ FavoritesPage.tsx  /favorites     รายการโปรด                🔒
   ├─ MyPage.tsx         /me            โพสต์ของฉัน / คำขอที่ยื่นไว้ / รายการโปรด  🔒
   ├─ GuidePage.tsx      /guide         ความรู้เบื้องต้นเรื่องหมาแมว
   ├─ PromoPage.tsx      /announcements/rabies-vaccine · /support/donate-food · /partners/spay-neuter
   │                     หน้ารายละเอียดของการ์ดในหน้าแรก (route สร้างจาก data/promos.ts อัตโนมัติ)
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
                          Express (GET /api/pets) → Prisma → Supabase PostgreSQL
```

หลังสร้าง แก้ หรือลบ → `useMutation` → `onSuccess` เรียก `invalidateQueries(["pets"])` → TanStack Query โหลดรายการใหม่เอง หน้าเว็บอัปเดตโดยไม่ต้องกด F5 (Zero-Refresh)

## คำถามที่อาจารย์น่าจะถาม

**Zustand กับ TanStack Query ต่างกันยังไง?**
TanStack Query เก็บ **Server State** คือข้อมูลที่มาจาก Database ดูแล cache, loading, error และ refetch ให้ ส่วน Zustand เก็บ **Client State** คือสิ่งที่ผู้ใช้เลือกบนหน้าจอ เช่น ตัวกรอง รายการน้องจึงไม่ได้เก็บซ้ำใน Zustand ข้อมูลมีที่มาที่เดียว (Single Source of Truth)

**ทำไมเปลี่ยนตัวกรองแล้วข้อมูลโหลดใหม่เอง?**
`queryKey` มีตัวกรองอยู่ข้างใน (`["pets", "list", filters]`) พอตัวกรองเปลี่ยน key ก็เปลี่ยน TanStack Query เลยดึงข้อมูลชุดใหม่ให้

**ตรวจข้อมูลก่อนบันทึกตรงไหน?**
ฟังก์ชัน `validate()` ใน `PetFormPage.tsx` ตรวจฝั่งหน้าเว็บ และ Backend ตรวจซ้ำด้วยกฎเดียวกัน (`backend/src/validators/`) แล้วตอบ 400 พร้อม `{ message }` ถ้าข้อมูลผิด หน้าเว็บจะแสดงข้อความนั้นใต้ฟอร์ม

**ทำไมเก็บคนที่ล็อกอินไว้ใน Zustand ไม่ใช่ TanStack Query?**
คนที่ล็อกอินอยู่เป็นสถานะของหน้าเว็บ (ใช้ตัดสินว่าจะโชว์เมนูไหน แนบ token ไปกับ request) ไม่ใช่รายการข้อมูลที่ต้อง cache หรือ refetch ส่วนรายการโปรดและคำขอรับเลี้ยงเป็นข้อมูลใน Database จึงอยู่ใน TanStack Query ใช้ `persist` ของ Zustand ให้กด F5 แล้วยังล็อกอินอยู่

**ออกจากระบบแล้วข้อมูลของคนเก่าหายไปไหน?**
queryKey ของข้อมูลส่วนตัวขึ้นต้นด้วย `"me"` ทั้งหมด (`["me","favorites"]`, `["me","adoptions"]`, `["me","pets"]`) ตอนออกจากระบบเรียก `removeQueries({ queryKey: ["me"] })` ครั้งเดียวล้างหมด และเรียก `POST /auth/logout` ให้ Backend ยกเลิก session ฝั่ง Supabase

**Toast ทำงานยังไง?**
`useToastStore` (Zustand) เก็บรายการแจ้งเตือน `onSuccess` ของ mutation เรียก `toast("บันทึกแล้ว")` แล้ว `<Toaster />` ใน RootLayout แสดงผล หายเองใน 3 วินาที

**ทำไมกด F5 บน Vercel แล้วไม่ 404?**
`vercel.json` ตั้ง rewrite ให้ทุกลิงก์ส่ง `index.html` แล้วให้ React Router เลือกหน้าเอง (บน Vercel ตั้ง Root Directory เป็น `frontend`)

## Backend

สัญญา API ทั้งหมด: [docs/backend-api.md](../docs/backend-api.md) · ฐานข้อมูล: [docs/database-design.md](../docs/database-design.md)

## เครดิต

ภาพแมวหน้าแรก: Claire Abdo / Unsplash · ข้อมูลสัตว์เป็นข้อมูลจำลองเพื่อการศึกษา · เนื้อหาหน้าความรู้เป็นข้อมูลทั่วไป ไม่ใช้แทนคำแนะนำของสัตวแพทย์
