import { prisma } from "../config/prisma.js";
import type { Pet } from "../types/dto.js";
import { toPet, withOwner } from "./pets.repository.js";

export const favoritesRepository = {
  // ที่กดล่าสุดอยู่บนสุด (เหมือน mock เดิม)
  async listPets(userId: string): Promise<Pet[]> {
    const rows = await prisma.favorite.findMany({
      where: { userId },
      include: { pet: { include: withOwner } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => toPet(r.pet));
  },

  exists: async (userId: string, petId: number) =>
    (await prisma.favorite.count({ where: { userId, petId } })) > 0,

  add: (userId: string, petId: number) => prisma.favorite.create({ data: { userId, petId } }),

  remove: (userId: string, petId: number) => prisma.favorite.deleteMany({ where: { userId, petId } }),
};
