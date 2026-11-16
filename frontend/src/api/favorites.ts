// =========================================================
// รายการโปรด (ต้องล็อกอิน) — ตาราง Favorite มี @@unique([userId, petId]) กดซ้ำไม่ได้
//   GET    /me/favorites          → Pet[]
//   POST   /me/favorites          { petId } → 201
//   DELETE /me/favorites/:petId   → 204
// =========================================================

import type { Pet } from "../types/pet";
import { request, USE_MOCK } from "./client";
import { mockAddFavorite, mockGetFavorites, mockRemoveFavorite } from "./mockPets";

export function getFavorites(): Promise<Pet[]> {
  if (USE_MOCK) return mockGetFavorites();
  return request<Pet[]>("/me/favorites");
}

export function addFavorite(petId: number): Promise<void> {
  if (USE_MOCK) return mockAddFavorite(petId);
  return request<void>("/me/favorites", { method: "POST", body: JSON.stringify({ petId }) });
}

export function removeFavorite(petId: number): Promise<void> {
  if (USE_MOCK) return mockRemoveFavorite(petId);
  return request<void>(`/me/favorites/${petId}`, { method: "DELETE" });
}
