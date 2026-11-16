import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import type { AdoptionRequest, AdoptionStatus, Housing } from "../types/dto.js";
import type { AdoptionInput } from "../validators/adoptions.validator.js";
import { toPet, withOwner } from "./pets.repository.js";

type Db = Prisma.TransactionClient;

const include = {
  pet: { include: withOwner },
  user: { select: { name: true } },
} satisfies Prisma.AdoptionRequestInclude;
type Row = Prisma.AdoptionRequestGetPayload<{ include: typeof include }>;

function toAdoption(row: Row): AdoptionRequest {
  return {
    id: row.id,
    petId: row.petId,
    userId: row.userId,
    userName: row.user.name,
    phone: row.phone,
    housing: row.housing as Housing,
    message: row.message,
    status: row.status as AdoptionStatus,
    createdAt: row.createdAt.toISOString(),
    pet: toPet(row.pet),
  };
}

const newest = { createdAt: "desc" } as const;

export const adoptionsRepository = {
  async listByUser(userId: string): Promise<AdoptionRequest[]> {
    return (await prisma.adoptionRequest.findMany({ where: { userId }, include, orderBy: newest })).map(toAdoption);
  },

  async listByPet(petId: number): Promise<AdoptionRequest[]> {
    return (await prisma.adoptionRequest.findMany({ where: { petId }, include, orderBy: newest })).map(toAdoption);
  },

  // แบบดิบ (มี pet.ownerId) ไว้ตรวจสิทธิ์ใน service
  findById: (id: number, db: Db = prisma) =>
    db.adoptionRequest.findUnique({ where: { id }, include: { pet: { select: { ownerId: true } } } }),

  exists: async (userId: string, petId: number, db: Db = prisma) =>
    (await db.adoptionRequest.count({ where: { userId, petId } })) > 0,

  async get(id: number, db: Db = prisma): Promise<AdoptionRequest> {
    return toAdoption(await db.adoptionRequest.findUniqueOrThrow({ where: { id }, include }));
  },

  create: (userId: string, petId: number, input: AdoptionInput, db: Db = prisma) =>
    db.adoptionRequest.create({ data: { ...input, userId, petId } }),

  // เปลี่ยนเฉพาะคำขอที่ยัง PENDING ในคำสั่งเดียว (atomic) · คืนจำนวนแถว 0 = มีคนเปลี่ยน/ลบไปก่อนแล้ว
  reviewPending: async (id: number, status: AdoptionStatus, db: Db = prisma) =>
    (await db.adoptionRequest.updateMany({ where: { id, status: "PENDING" }, data: { status } })).count,

  // อนุมัติคนหนึ่งแล้ว คำขออื่นที่ยังรอของน้องตัวเดียวกันไม่ผ่านอัตโนมัติ
  rejectOtherPending: (petId: number, exceptId: number, db: Db = prisma) =>
    db.adoptionRequest.updateMany({
      where: { petId, status: "PENDING", id: { not: exceptId } },
      data: { status: "REJECTED" },
    }),

  // ลบเฉพาะคำขอที่ยัง PENDING ในคำสั่งเดียว — กันกรณีเจ้าของกดอนุมัติระหว่างที่ผู้ขอกดยกเลิก
  deletePending: async (id: number, db: Db = prisma) =>
    (await db.adoptionRequest.deleteMany({ where: { id, status: "PENDING" } })).count,

  statusesOfPet: async (petId: number, db: Db = prisma) =>
    (await db.adoptionRequest.findMany({ where: { petId }, select: { status: true } })).map((r) => r.status as AdoptionStatus),
};
