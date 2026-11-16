// =========================================================
// รายการโปรด ♡ (Server State — เก็บในตาราง Favorite ของ Database ไม่ใช่ในเครื่อง)
// =========================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addFavorite, getFavorites, removeFavorite } from "../api/favorites";
import { useAuthStore } from "../stores/useAuthStore";
import { toast } from "../stores/useToastStore";

export const favoriteKeys = { all: ["me", "favorites"] as const };

export function useFavorites() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: favoriteKeys.all,
    queryFn: getFavorites,
    enabled: user !== null, // ยังไม่ล็อกอิน ไม่ต้องยิง
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ petId, isFavorite }: { petId: number; isFavorite: boolean }) =>
      isFavorite ? removeFavorite(petId) : addFavorite(petId),
    onSuccess: (_data, { isFavorite }) => {
      toast(isFavorite ? "เอาออกจากรายการโปรดแล้ว" : "เพิ่มในรายการโปรดแล้ว", isFavorite ? "info" : "success");
      return queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
    },
    onError: (error) => toast(error.message, "error"),
  });
}
