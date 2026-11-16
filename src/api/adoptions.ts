// =========================================================
// คำขอรับเลี้ยง (ต้องล็อกอิน) — ตาราง AdoptionRequest มี @@unique([userId, petId])
//   GET    /me/adoptions            คำขอที่ฉันยื่นไว้
//   POST   /pets/:id/adoptions      ยื่นคำขอ { phone, housing, message }
//   DELETE /adoptions/:id           ยกเลิกคำขอของตัวเอง (เฉพาะที่ยัง PENDING)
//   GET    /pets/:id/adoptions      คำขอทั้งหมดของน้องตัวนี้ (เฉพาะเจ้าของโพสต์)
//   PATCH  /adoptions/:id           อนุมัติ / ไม่ผ่าน { status: "APPROVED" | "REJECTED" } (เฉพาะเจ้าของโพสต์)
// =========================================================

import type { AdoptionInput, AdoptionRequest, AdoptionStatus } from "../types/adoption";
import { request, USE_MOCK } from "./client";
import {
  mockCancelAdoption,
  mockCreateAdoption,
  mockGetMyAdoptions,
  mockGetPetAdoptions,
  mockReviewAdoption,
} from "./mockPets";

export type ReviewStatus = Exclude<AdoptionStatus, "PENDING">;

export function getMyAdoptions(): Promise<AdoptionRequest[]> {
  if (USE_MOCK) return mockGetMyAdoptions();
  return request<AdoptionRequest[]>("/me/adoptions");
}

export function getPetAdoptions(petId: number): Promise<AdoptionRequest[]> {
  if (USE_MOCK) return mockGetPetAdoptions(petId);
  return request<AdoptionRequest[]>(`/pets/${petId}/adoptions`);
}

export function createAdoption(petId: number, input: AdoptionInput): Promise<AdoptionRequest> {
  if (USE_MOCK) return mockCreateAdoption(petId, input);
  return request<AdoptionRequest>(`/pets/${petId}/adoptions`, { method: "POST", body: JSON.stringify(input) });
}

export function cancelAdoption(id: number): Promise<void> {
  if (USE_MOCK) return mockCancelAdoption(id);
  return request<void>(`/adoptions/${id}`, { method: "DELETE" });
}

export function reviewAdoption(id: number, status: ReviewStatus): Promise<AdoptionRequest> {
  if (USE_MOCK) return mockReviewAdoption(id, status);
  return request<AdoptionRequest>(`/adoptions/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
}
