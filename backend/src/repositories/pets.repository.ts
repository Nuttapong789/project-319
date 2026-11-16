import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import type { Pet, PetStatus, Sex, Species } from "../types/dto.js";
import type { PetFilters, PetInput } from "../validators/pets.validator.js";

type Db = Prisma.TransactionClient;

export const withOwner = { owner: { select: { name: true } } } satisfies Prisma.PetInclude;
export type PetRow = Prisma.PetGetPayload<{ include: typeof withOwner }>;

export function toPet(row: PetRow): Pet {
  return {
    id: row.id,
    name: row.name,
    species: row.species as Species,
    breed: row.breed,
    ageMonths: row.ageMonths,
    sex: row.sex as Sex,
    province: row.province,
    imageUrl: row.imageUrl,
    description: row.description,
    vaccinated: row.vaccinated,
    sterilized: row.sterilized,
    urgent: row.urgent,
    status: row.status as PetStatus,
    createdAt: row.createdAt.toISOString(),
    ownerId: row.ownerId,
    ownerName: row.owner.name,
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

export const petsRepository = {
  // shortcut: ไม่มี pagination เพราะหน้าเว็บแสดง "พบ N ตัว" จากรายการทั้งหมด, ถ้าน้องเกินหลักพันให้เพิ่ม ?page&limit ทั้งสองฝั่ง
  async list(filters: PetFilters): Promise<Pet[]> {
    const where: Prisma.PetWhereInput = {};
    if (filters.species) where.species = filters.species;
    if (filters.province) where.province = filters.province;
    if (filters.urgent !== undefined) where.urgent = filters.urgent;
    if (filters.postedWithin) where.createdAt = { gte: new Date(Date.now() - filters.postedWithin * DAY_MS) };
    if (filters.search) {
      // ค้นในชื่อ พันธุ์ จังหวัด เหมือน mock เดิม
      where.OR = (["name", "breed", "province"] as const).map((field) => ({
        [field]: { contains: filters.search, mode: "insensitive" },
      }));
    }
    const rows = await prisma.pet.findMany({ where, include: withOwner, orderBy: { createdAt: "desc" } });
    return rows.map(toPet);
  },

  async listByOwner(ownerId: string): Promise<Pet[]> {
    const rows = await prisma.pet.findMany({ where: { ownerId }, include: withOwner, orderBy: { createdAt: "desc" } });
    return rows.map(toPet);
  },

  findById: (id: number, db: Db = prisma) => db.pet.findUnique({ where: { id }, include: withOwner }),

  async create(ownerId: string, input: PetInput): Promise<Pet> {
    return toPet(await prisma.pet.create({ data: { ...input, ownerId }, include: withOwner }));
  },

  async update(id: number, input: PetInput): Promise<Pet> {
    return toPet(await prisma.pet.update({ where: { id }, data: input, include: withOwner }));
  },

  // favorites + adoption_requests ของน้องตัวนี้ถูกลบตาม (ON DELETE CASCADE)
  delete: (id: number) => prisma.pet.delete({ where: { id } }),

  setStatus: (id: number, status: PetStatus, db: Db = prisma) => db.pet.update({ where: { id }, data: { status } }),
};
