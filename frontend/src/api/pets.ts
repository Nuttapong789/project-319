// =========================================================
// ฟังก์ชันเรียก API ของ "น้อง" — ตรงกับ route ใน Express
//   GET    /pets            รายการน้อง (มีตัวกรอง)
//   GET    /pets/:id        น้อง 1 ตัว
//   GET    /me/pets         โพสต์ของฉัน (ต้องล็อกอิน)
//   POST   /pets            สร้าง (ต้องล็อกอิน)
//   PUT    /pets/:id        แก้ไข (เฉพาะเจ้าของ)
//   DELETE /pets/:id        ลบ (เฉพาะเจ้าของ)
// ไฟล์นี้ไม่รู้จัก React เลย มีหน้าที่แค่ส่ง request แล้วคืนข้อมูล
// =========================================================

import type { Pet, PetFilters, PetInput } from "../types/pet";
import { request, USE_MOCK } from "./client";
import { mockCreatePet, mockDeletePet, mockGetMyPets, mockGetPet, mockGetPets, mockUpdatePet } from "./mockPets";

export function getPets(filters: PetFilters): Promise<Pet[]> {
  if (USE_MOCK) return mockGetPets(filters);

  const params = new URLSearchParams();
  if (filters.species !== "ALL") params.set("species", filters.species);
  if (filters.province) params.set("province", filters.province);
  if (filters.search) params.set("search", filters.search);
  if (filters.postedWithin) params.set("postedWithin", String(filters.postedWithin)); // จำนวนวัน
  if (filters.urgency !== "ALL") params.set("urgent", String(filters.urgency === "URGENT"));
  const query = params.toString();
  return request<Pet[]>(`/pets${query ? `?${query}` : ""}`);
}

// signal: TanStack Query ยกเลิก request ที่ค้างอยู่ได้ (เช่นตอนลบน้องตัวนี้)
export function getPet(id: number, signal?: AbortSignal): Promise<Pet> {
  if (USE_MOCK) return mockGetPet(id);
  return request<Pet>(`/pets/${id}`, { signal });
}

export function getMyPets(): Promise<Pet[]> {
  if (USE_MOCK) return mockGetMyPets();
  return request<Pet[]>("/me/pets");
}

export function createPet(input: PetInput): Promise<Pet> {
  if (USE_MOCK) return mockCreatePet(input);
  return request<Pet>("/pets", { method: "POST", body: JSON.stringify(input) });
}

export function updatePet(id: number, input: PetInput): Promise<Pet> {
  if (USE_MOCK) return mockUpdatePet(id, input);
  return request<Pet>(`/pets/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export function deletePet(id: number): Promise<void> {
  if (USE_MOCK) return mockDeletePet(id);
  return request<void>(`/pets/${id}`, { method: "DELETE" });
}
