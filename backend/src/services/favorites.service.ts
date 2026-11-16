import { ApiError } from "../middleware/error.js";
import { favoritesRepository } from "../repositories/favorites.repository.js";
import { findPetOr404 } from "./pets.service.js";

export const favoritesService = {
  list: (userId: string) => favoritesRepository.listPets(userId),

  async add(userId: string, petId: number): Promise<void> {
    await findPetOr404(petId);
    if (await favoritesRepository.exists(userId, petId)) throw new ApiError(409, "อยู่ในรายการโปรดแล้ว");
    await favoritesRepository.add(userId, petId);
  },

  // ไม่มีอยู่แล้วก็ตอบสำเร็จ (กดซ้ำไม่ error) เหมือน mock เดิม
  async remove(userId: string, petId: number): Promise<void> {
    await favoritesRepository.remove(userId, petId);
  },
};
