import { ApiError } from "../middleware/error.js";
import { petsRepository, toPet, type PetRow } from "../repositories/pets.repository.js";
import type { Pet } from "../types/dto.js";
import type { PetFilters, PetInput } from "../validators/pets.validator.js";

export async function findPetOr404(id: number): Promise<PetRow> {
  const pet = await petsRepository.findById(id);
  if (!pet) throw new ApiError(404, "ไม่พบน้องที่ต้องการ");
  return pet;
}

export const petsService = {
  list: (filters: PetFilters) => petsRepository.list(filters),

  listMine: (userId: string) => petsRepository.listByOwner(userId),

  get: async (id: number): Promise<Pet> => toPet(await findPetOr404(id)),

  // เจ้าของมาจาก token เสมอ ไม่รับจาก body
  create: (userId: string, input: PetInput) => petsRepository.create(userId, input),

  async update(userId: string, id: number, input: PetInput): Promise<Pet> {
    const pet = await findPetOr404(id);
    if (pet.ownerId !== userId) throw new ApiError(403, "แก้ไขได้เฉพาะโพสต์ของตัวเอง");
    return petsRepository.update(id, input);
  },

  async remove(userId: string, id: number): Promise<void> {
    const pet = await findPetOr404(id);
    if (pet.ownerId !== userId) throw new ApiError(403, "ลบได้เฉพาะโพสต์ของตัวเอง");
    await petsRepository.delete(id);
  },
};
