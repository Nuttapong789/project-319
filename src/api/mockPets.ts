// =========================================================
// ฐานข้อมูลจำลองทั้งหมด ใช้ระหว่างที่ Backend ยังไม่เสร็จ (เปิดด้วย VITE_USE_MOCK=true)
// รูปน้องเป็นลิงก์จริงจาก Dog CEO API และ TheCatAPI (ใช้แบบเดียวกันตอน seed ใน Backend ได้)
// มี ผู้ใช้ · น้อง · รายการโปรด · คำขอรับเลี้ยง · อัปโหลดรูป
// ทำงานเหมือน API จริง: มีหน่วงเวลา, มี error 400/401/403/404/409, แต่ข้อมูลหายเมื่อรีเฟรช
//
// บัญชีทดลอง (รหัสผ่าน 123456 ทุกบัญชี)
//   pong@pawhome.test     ปอง — เจ้าของโพสต์ มะลิ, ส้มโอ, ส้มจี๊ด
//   shelter@pawhome.test  บ้านพักน้องจร — เจ้าของโพสต์ที่เหลือ
//   mind@pawhome.test     มายด์ — ยื่นขอรับเลี้ยงส้มโอไว้แล้ว
//
// พอ Backend เสร็จ ตั้ง VITE_API_URL แล้วไฟล์นี้จะไม่ถูกใช้
// =========================================================

import type { AdoptionInput, AdoptionRequest, AdoptionStatus } from "../types/adoption";
import type { Pet, PetFilters, PetInput } from "../types/pet";
import type { AuthResponse, LoginInput, RegisterInput, User } from "../types/user";
import { useAuthStore } from "../stores/useAuthStore";
import { ApiError } from "./client";

// เวลานับย้อนจากตอนนี้ (หน่วยชั่วโมง)
const ago = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

// หน่วงเวลาให้เห็น Skeleton ตอนโหลด
const wait = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------- ตาราง (เหมือนตารางใน PostgreSQL) ----------

interface UserRow extends User {
  password: string; // ของจริง Backend ต้องเก็บแบบ hash (bcrypt) ห้ามเก็บตรง ๆ
}
type AdoptionRow = Omit<AdoptionRequest, "pet">;
interface FavoriteRow {
  userId: number;
  petId: number;
}

let users: UserRow[] = [
  { id: 1, name: "ปอง", email: "pong@pawhome.test", password: "123456" },
  { id: 2, name: "บ้านพักน้องจร", email: "shelter@pawhome.test", password: "123456" },
  { id: 3, name: "มายด์", email: "mind@pawhome.test", password: "123456" },
];

const pong = { ownerId: 1, ownerName: "ปอง" };
const shelter = { ownerId: 2, ownerName: "บ้านพักน้องจร" };

let pets: Pet[] = [
  { id: 1, name: "ข้าวตัง", species: "DOG", breed: "พันทาง", ageMonths: 24, sex: "MALE", province: "กรุงเทพมหานคร", imageUrl: "https://images.dog.ceo/breeds/mix/cheyenne2.jpg", description: "ขี้อ้อน ชอบเดินเล่นตอนเย็น ขับถ่ายเป็นที่แล้ว", vaccinated: true, sterilized: true, urgent: true, status: "AVAILABLE", createdAt: ago(5), ...shelter },
  { id: 2, name: "มะลิ", species: "CAT", breed: "แมวไทย", ageMonths: 8, sex: "FEMALE", province: "นนทบุรี", imageUrl: "https://cdn2.thecatapi.com/images/3rK7HGo7r.jpg", description: "ตัวเล็ก ปรับตัวเก่ง เลี้ยงในคอนโดได้", vaccinated: true, sterilized: false, urgent: false, status: "AVAILABLE", createdAt: ago(48), ...pong },
  { id: 3, name: "ถั่วแดง", species: "DOG", breed: "ชิบะผสม", ageMonths: 48, sex: "MALE", province: "เชียงใหม่", imageUrl: "https://images.dog.ceo/breeds/shiba/shiba-13.jpg", description: "นิ่ง ใจดี เข้ากับเด็กได้", vaccinated: true, sterilized: true, urgent: false, status: "PENDING", createdAt: ago(144), ...shelter },
  { id: 4, name: "ส้มโอ", species: "CAT", breed: "แมวส้ม", ageMonths: 12, sex: "FEMALE", province: "ขอนแก่น", imageUrl: "https://cdn2.thecatapi.com/images/edr.jpg", description: "ชอบนอนตากแดด ไม่กลัวคน", vaccinated: true, sterilized: true, urgent: true, status: "PENDING", createdAt: ago(20), ...pong },
  { id: 5, name: "บราวนี่", species: "DOG", breed: "พันทาง", ageMonths: 72, sex: "FEMALE", province: "ชลบุรี", imageUrl: "https://images.dog.ceo/breeds/mix/floki-the-chilean-mutt-6.jpg", description: "สุนัขโตแล้ว นิ่ง ชอบนอน", vaccinated: true, sterilized: true, urgent: false, status: "AVAILABLE", createdAt: ago(288), ...shelter },
  { id: 6, name: "ไข่ตุ๋น", species: "CAT", breed: "แมวขาวมณี", ageMonths: 36, sex: "MALE", province: "กรุงเทพมหานคร", imageUrl: "https://cdn2.thecatapi.com/images/HDxfaNlLj.jpg", description: "สงบ เคยอยู่กับแมวตัวอื่นมาก่อน", vaccinated: true, sterilized: true, urgent: false, status: "ADOPTED", createdAt: ago(600), ...shelter },
  { id: 7, name: "ขนมปัง", species: "DOG", breed: "พันทาง", ageMonths: 18, sex: "FEMALE", province: "ปทุมธานี", imageUrl: "https://images.dog.ceo/breeds/mix/rilo.jpg", description: "ร่าเริง ชอบเล่นลูกบอล เดินสายจูงได้แล้ว", vaccinated: true, sterilized: true, urgent: false, status: "AVAILABLE", createdAt: ago(72), ...shelter },
  { id: 8, name: "โอวัลติน", species: "DOG", breed: "พันทาง", ageMonths: 10, sex: "MALE", province: "ภูเก็ต", imageUrl: "https://images.dog.ceo/breeds/mix/xeshabelka_(21).jpg", description: "ถูกทิ้งไว้หน้าตลาด ตอนนี้ฝากเลี้ยงชั่วคราว ต้องการบ้านถาวรด่วน", vaccinated: true, sterilized: false, urgent: true, status: "AVAILABLE", createdAt: ago(9), ...shelter },
  { id: 9, name: "ลูกชิ้น", species: "CAT", breed: "แมวบ้าน", ageMonths: 3, sex: "MALE", province: "เชียงใหม่", imageUrl: "https://cdn2.thecatapi.com/images/267.jpg", description: "ลูกแมวกำพร้า กินอาหารเม็ดเองได้แล้ว ขี้เล่นมาก", vaccinated: false, sterilized: false, urgent: true, status: "AVAILABLE", createdAt: ago(30), ...shelter },
  { id: 10, name: "ส้มจี๊ด", species: "CAT", breed: "แมวส้ม", ageMonths: 6, sex: "FEMALE", province: "ชลบุรี", imageUrl: "https://cdn2.thecatapi.com/images/MTY3NjI5MQ.jpg", description: "ช่างประจบ ชอบนอนบนตัก ใช้กระบะทรายเป็นแล้ว", vaccinated: true, sterilized: false, urgent: false, status: "AVAILABLE", createdAt: ago(96), ...pong },
  { id: 11, name: "นมเย็น", species: "CAT", breed: "แมวสามสี", ageMonths: 4, sex: "FEMALE", province: "ขอนแก่น", imageUrl: "https://cdn2.thecatapi.com/images/O-57OLhn7.jpg", description: "ซนตามวัย เข้ากับแมวตัวอื่นได้ดี", vaccinated: true, sterilized: false, urgent: false, status: "AVAILABLE", createdAt: ago(200), ...shelter },
  { id: 12, name: "ดำดี", species: "DOG", breed: "พันทาง", ageMonths: 30, sex: "MALE", province: "นนทบุรี", imageUrl: "https://images.dog.ceo/breeds/mix/xeshabelka_(33).jpg", description: "เฝ้าบ้านเก่ง แต่ใจดีกับคนในบ้าน เหมาะกับบ้านที่มีลาน", vaccinated: true, sterilized: true, urgent: false, status: "AVAILABLE", createdAt: ago(400), ...shelter },
];

let favorites: FavoriteRow[] = [
  { userId: 1, petId: 1 },
  { userId: 1, petId: 5 },
];

let adoptions: AdoptionRow[] = [
  { id: 1, petId: 3, userId: 1, userName: "ปอง", phone: "0812345678", housing: "HOUSE", message: "บ้านมีสนามหญ้า มีคนอยู่บ้านตลอด เคยเลี้ยงสุนัขมาก่อนครับ", status: "PENDING", createdAt: ago(30) },
  { id: 2, petId: 4, userId: 3, userName: "มายด์", phone: "0898765432", housing: "CONDO", message: "คอนโดอนุญาตให้เลี้ยงแมว ติดมุ้งลวดระเบียงแล้วค่ะ", status: "PENDING", createdAt: ago(10) },
];

let nextUserId = users.length + 1;
let nextPetId = pets.length + 1;
let nextAdoptionId = adoptions.length + 1;

// ---------- ตัวช่วย ----------

// คนที่ล็อกอินอยู่ (ของจริง Backend อ่านจาก token)
function currentUser(): User {
  const user = useAuthStore.getState().user;
  if (!user) throw new ApiError(401, "กรุณาเข้าสู่ระบบก่อน");
  return user;
}

function findPet(id: number): Pet {
  const pet = pets.find((p) => p.id === id);
  if (!pet) throw new ApiError(404, "ไม่พบน้องที่ต้องการ");
  return pet;
}

const withPet = (row: AdoptionRow): AdoptionRequest => ({ ...row, pet: findPet(row.petId) });
const newest = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt);

// สถานะน้องเปลี่ยนตามคำขอ: มีคำขอที่อนุมัติ = ได้บ้านแล้ว, มีคำขอรอ = มีคนขอรับเลี้ยง, ไม่มี = รอบ้าน
function syncPetStatus(petId: number) {
  const rows = adoptions.filter((a) => a.petId === petId);
  const status: Pet["status"] = rows.some((a) => a.status === "APPROVED")
    ? "ADOPTED"
    : rows.some((a) => a.status === "PENDING")
      ? "PENDING"
      : "AVAILABLE";
  pets = pets.map((p) => (p.id === petId ? { ...p, status } : p));
}

// ---------- Auth ----------

export async function mockLogin(input: LoginInput): Promise<AuthResponse> {
  await wait();
  const row = users.find((u) => u.email === input.email.toLowerCase());
  if (!row || row.password !== input.password) throw new ApiError(401, "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  return { user: { id: row.id, name: row.name, email: row.email }, token: `mock-token-${row.id}` };
}

export async function mockRegister(input: RegisterInput): Promise<AuthResponse> {
  await wait();
  const email = input.email.toLowerCase();
  if (users.some((u) => u.email === email)) throw new ApiError(409, "อีเมลนี้มีผู้ใช้แล้ว");
  const row: UserRow = { id: nextUserId++, name: input.name, email, password: input.password };
  users = [...users, row];
  return { user: { id: row.id, name: row.name, email: row.email }, token: `mock-token-${row.id}` };
}

// ---------- Pets ----------

export async function mockGetPets(filters: PetFilters): Promise<Pet[]> {
  await wait();
  const keyword = filters.search.trim().toLowerCase();
  const since = Date.now() - filters.postedWithin * 24 * 60 * 60 * 1000;
  return pets
    .filter(
      (pet) =>
        (filters.postedWithin === 0 || new Date(pet.createdAt).getTime() >= since) &&
        (filters.urgency === "ALL" || pet.urgent === (filters.urgency === "URGENT")) &&
        (filters.species === "ALL" || pet.species === filters.species) &&
        (filters.province === "" || pet.province === filters.province) &&
        (keyword === "" || `${pet.name} ${pet.breed} ${pet.province}`.toLowerCase().includes(keyword)),
    )
    .sort(newest);
}

export async function mockGetPet(id: number): Promise<Pet> {
  await wait();
  return findPet(id);
}

export async function mockGetMyPets(): Promise<Pet[]> {
  await wait();
  const user = currentUser();
  return pets.filter((p) => p.ownerId === user.id).sort(newest);
}

export async function mockCreatePet(input: PetInput): Promise<Pet> {
  await wait();
  const user = currentUser();
  const pet: Pet = {
    ...input,
    id: nextPetId++,
    status: "AVAILABLE",
    createdAt: new Date().toISOString(),
    ownerId: user.id,
    ownerName: user.name,
  };
  pets = [pet, ...pets];
  return pet;
}

export async function mockUpdatePet(id: number, input: PetInput): Promise<Pet> {
  await wait();
  const user = currentUser();
  const old = findPet(id);
  if (old.ownerId !== user.id) throw new ApiError(403, "แก้ไขได้เฉพาะโพสต์ของตัวเอง");
  const updated: Pet = { ...old, ...input };
  pets = pets.map((p) => (p.id === id ? updated : p));
  return updated;
}

export async function mockDeletePet(id: number): Promise<void> {
  await wait();
  const user = currentUser();
  if (findPet(id).ownerId !== user.id) throw new ApiError(403, "ลบได้เฉพาะโพสต์ของตัวเอง");
  // ลบน้อง = ลบรายการโปรดและคำขอของน้องตัวนี้ด้วย (ของจริงใช้ onDelete: Cascade ใน Prisma)
  pets = pets.filter((p) => p.id !== id);
  favorites = favorites.filter((f) => f.petId !== id);
  adoptions = adoptions.filter((a) => a.petId !== id);
}

// ---------- Favorites ----------

export async function mockGetFavorites(): Promise<Pet[]> {
  await wait(400);
  const user = currentUser();
  return favorites
    .filter((f) => f.userId === user.id)
    .reverse() // ที่กดล่าสุดอยู่บนสุด
    .map((f) => findPet(f.petId));
}

export async function mockAddFavorite(petId: number): Promise<void> {
  await wait(300);
  const user = currentUser();
  findPet(petId);
  if (favorites.some((f) => f.userId === user.id && f.petId === petId)) throw new ApiError(409, "อยู่ในรายการโปรดแล้ว");
  favorites = [...favorites, { userId: user.id, petId }];
}

export async function mockRemoveFavorite(petId: number): Promise<void> {
  await wait(300);
  const user = currentUser();
  favorites = favorites.filter((f) => !(f.userId === user.id && f.petId === petId));
}

// ---------- Adoptions ----------

export async function mockGetMyAdoptions(): Promise<AdoptionRequest[]> {
  await wait();
  const user = currentUser();
  return adoptions.filter((a) => a.userId === user.id).sort(newest).map(withPet);
}

export async function mockGetPetAdoptions(petId: number): Promise<AdoptionRequest[]> {
  await wait();
  const user = currentUser();
  if (findPet(petId).ownerId !== user.id) throw new ApiError(403, "ดูคำขอได้เฉพาะเจ้าของโพสต์");
  return adoptions.filter((a) => a.petId === petId).sort(newest).map(withPet);
}

export async function mockCreateAdoption(petId: number, input: AdoptionInput): Promise<AdoptionRequest> {
  await wait();
  const user = currentUser();
  const pet = findPet(petId);
  if (pet.ownerId === user.id) throw new ApiError(400, "ขอรับเลี้ยงน้องที่ตัวเองโพสต์ไม่ได้");
  if (pet.status === "ADOPTED") throw new ApiError(400, "น้องได้บ้านแล้ว");
  if (adoptions.some((a) => a.userId === user.id && a.petId === petId))
    throw new ApiError(409, "คุณยื่นคำขอน้องตัวนี้ไปแล้ว");

  const row: AdoptionRow = {
    ...input,
    id: nextAdoptionId++,
    petId,
    userId: user.id,
    userName: user.name,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };
  adoptions = [...adoptions, row];
  syncPetStatus(petId);
  return withPet(row);
}

export async function mockCancelAdoption(id: number): Promise<void> {
  await wait();
  const user = currentUser();
  const row = adoptions.find((a) => a.id === id);
  if (!row) throw new ApiError(404, "ไม่พบคำขอ");
  if (row.userId !== user.id) throw new ApiError(403, "ยกเลิกได้เฉพาะคำขอของตัวเอง");
  if (row.status !== "PENDING") throw new ApiError(400, "คำขอนี้ถูกพิจารณาไปแล้ว ยกเลิกไม่ได้");
  adoptions = adoptions.filter((a) => a.id !== id);
  syncPetStatus(row.petId);
}

export async function mockReviewAdoption(id: number, status: Exclude<AdoptionStatus, "PENDING">): Promise<AdoptionRequest> {
  await wait();
  const user = currentUser();
  const row = adoptions.find((a) => a.id === id);
  if (!row) throw new ApiError(404, "ไม่พบคำขอ");
  if (findPet(row.petId).ownerId !== user.id) throw new ApiError(403, "พิจารณาได้เฉพาะเจ้าของโพสต์");
  if (row.status !== "PENDING") throw new ApiError(400, "คำขอนี้ถูกพิจารณาไปแล้ว");

  adoptions = adoptions.map((a) => {
    if (a.id === id) return { ...a, status };
    // อนุมัติคนหนึ่งแล้ว คำขออื่นที่ยังรอของน้องตัวเดียวกันจะไม่ผ่านอัตโนมัติ
    if (status === "APPROVED" && a.petId === row.petId && a.status === "PENDING") return { ...a, status: "REJECTED" };
    return a;
  });
  syncPetStatus(row.petId);
  return withPet({ ...row, status });
}

// ---------- Upload ----------

// แปลงไฟล์เป็น data URL ให้แสดงรูปได้ทันที (ของจริง Backend เก็บไฟล์แล้วตอบ { url })
export async function mockUploadImage(file: File): Promise<string> {
  await wait(800);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new ApiError(500, "อ่านไฟล์รูปไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });
}
