import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../middleware/error.js";
import { adoptionsRepository } from "../repositories/adoptions.repository.js";
import { petsRepository } from "../repositories/pets.repository.js";
import type { AdoptionRequest, AdoptionStatus, PetStatus } from "../types/dto.js";
import type { AdoptionInput, ReviewStatus } from "../validators/adoptions.validator.js";
import { findPetOr404 } from "./pets.service.js";

// สถานะน้องตามคำขอ: มีที่อนุมัติ = ได้บ้านแล้ว, มีที่รอ = มีคนขอรับเลี้ยง, ไม่มี = รอบ้าน (ย้ายมาจาก syncPetStatus() ใน mockPets.ts)
export function derivePetStatus(statuses: AdoptionStatus[]): PetStatus {
  if (statuses.includes("APPROVED")) return "ADOPTED";
  if (statuses.includes("PENDING")) return "PENDING";
  return "AVAILABLE";
}

async function syncPetStatus(petId: number, tx: Prisma.TransactionClient) {
  const status = derivePetStatus(await adoptionsRepository.statusesOfPet(petId, tx));
  await petsRepository.setStatus(petId, status, tx);
}

async function findRequestOr404(id: number, tx: Prisma.TransactionClient) {
  const request = await adoptionsRepository.findById(id, tx);
  if (!request) throw new ApiError(404, "ไม่พบคำขอ");
  return request;
}

export const adoptionsService = {
  listMine: (userId: string) => adoptionsRepository.listByUser(userId),

  // มีเบอร์โทรผู้ขอ → ให้ดูเฉพาะเจ้าของโพสต์
  async listForPet(userId: string, petId: number): Promise<AdoptionRequest[]> {
    const pet = await findPetOr404(petId);
    if (pet.ownerId !== userId) throw new ApiError(403, "ดูคำขอได้เฉพาะเจ้าของโพสต์");
    return adoptionsRepository.listByPet(petId);
  },

  create(userId: string, petId: number, input: AdoptionInput): Promise<AdoptionRequest> {
    return prisma.$transaction(async (tx) => {
      const pet = await petsRepository.findById(petId, tx);
      if (!pet) throw new ApiError(404, "ไม่พบน้องที่ต้องการ");
      if (pet.ownerId === userId) throw new ApiError(400, "ขอรับเลี้ยงน้องที่ตัวเองโพสต์ไม่ได้");
      if (pet.status === "ADOPTED") throw new ApiError(400, "น้องได้บ้านแล้ว");
      if (await adoptionsRepository.exists(userId, petId, tx)) throw new ApiError(409, "คุณยื่นคำขอน้องตัวนี้ไปแล้ว");

      const created = await adoptionsRepository.create(userId, petId, input, tx);
      await syncPetStatus(petId, tx);
      return adoptionsRepository.get(created.id, tx);
    });
  },

  cancel(userId: string, id: number): Promise<void> {
    return prisma.$transaction(async (tx) => {
      const request = await findRequestOr404(id, tx);
      if (request.userId !== userId) throw new ApiError(403, "ยกเลิกได้เฉพาะคำขอของตัวเอง");
      const alreadyReviewed = new ApiError(400, "คำขอนี้ถูกพิจารณาไปแล้ว ยกเลิกไม่ได้");
      if (request.status !== "PENDING") throw alreadyReviewed;
      // สถานะอาจเปลี่ยนระหว่างอ่านกับลบ (เจ้าของกดอนุมัติพร้อมกัน) → ลบแบบมีเงื่อนไข แล้วเช็คจำนวนแถว
      if ((await adoptionsRepository.deletePending(id, tx)) === 0) throw alreadyReviewed;
      await syncPetStatus(request.petId, tx);
    });
  },

  review(userId: string, id: number, status: ReviewStatus): Promise<AdoptionRequest> {
    return prisma.$transaction(async (tx) => {
      const request = await findRequestOr404(id, tx);
      if (request.pet.ownerId !== userId) throw new ApiError(403, "พิจารณาได้เฉพาะเจ้าของโพสต์");
      const notPending = new ApiError(400, "คำขอนี้ถูกพิจารณาหรือถูกยกเลิกไปแล้ว");
      if (request.status !== "PENDING") throw notPending;

      // เปลี่ยนแบบมีเงื่อนไขก่อน: ถ้าผู้ขอเพิ่งยกเลิก/มีคนพิจารณาไปแล้ว ได้ 0 แถว → throw → transaction ย้อนกลับทั้งหมด
      if ((await adoptionsRepository.reviewPending(id, status, tx)) === 0) throw notPending;
      if (status === "APPROVED") await adoptionsRepository.rejectOtherPending(request.petId, id, tx);
      await syncPetStatus(request.petId, tx);
      return adoptionsRepository.get(id, tx);
    });
  },
};
