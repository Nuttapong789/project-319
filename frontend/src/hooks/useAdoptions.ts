// =========================================================
// คำขอรับเลี้ยง
// ทุกครั้งที่คำขอเปลี่ยน สถานะน้องก็เปลี่ยนตาม (รอบ้าน / มีคนขอรับเลี้ยง / ได้บ้านแล้ว)
// เลยต้อง invalidate ทั้ง ["pets"] และ ["me"]
// =========================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelAdoption,
  createAdoption,
  getMyAdoptions,
  getPetAdoptions,
  reviewAdoption,
  type ReviewStatus,
} from "../api/adoptions";
import { useAuthStore } from "../stores/useAuthStore";
import { toast } from "../stores/useToastStore";
import type { AdoptionInput } from "../types/adoption";

export const adoptionKeys = {
  mine: ["me", "adoptions"] as const,
  ofPet: (petId: number) => ["pets", "adoptions", petId] as const,
};

export function useMyAdoptions() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: adoptionKeys.mine,
    queryFn: getMyAdoptions,
    enabled: user !== null,
  });
}

// คำขอทั้งหมดของน้อง 1 ตัว ใช้เฉพาะเจ้าของโพสต์ (enabled = false ถ้าไม่ใช่เจ้าของ)
export function usePetAdoptions(petId: number, enabled: boolean) {
  return useQuery({
    queryKey: adoptionKeys.ofPet(petId),
    queryFn: ({ signal }) => getPetAdoptions(petId, signal),
    enabled,
  });
}

function useRefreshAdoptions() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["pets"] }),
      queryClient.invalidateQueries({ queryKey: ["me"] }),
    ]);
}

export function useCreateAdoption(petId: number) {
  const refresh = useRefreshAdoptions();
  return useMutation({
    mutationFn: (input: AdoptionInput) => createAdoption(petId, input),
    onSuccess: () => {
      toast("ส่งคำขอรับเลี้ยงแล้ว รอผู้โพสต์ติดต่อกลับนะ");
      return refresh();
    },
  });
}

export function useCancelAdoption() {
  const refresh = useRefreshAdoptions();
  return useMutation({
    mutationFn: (id: number) => cancelAdoption(id),
    onSuccess: () => {
      toast("ยกเลิกคำขอแล้ว", "info");
      return refresh();
    },
    onError: (error) => toast(error.message, "error"),
  });
}

export function useReviewAdoption() {
  const refresh = useRefreshAdoptions();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: ReviewStatus }) => reviewAdoption(id, status),
    onSuccess: (_data, { status }) => {
      toast(status === "APPROVED" ? "อนุมัติแล้ว น้องได้บ้านแล้ว" : "บันทึกว่าไม่ผ่านแล้ว", status === "APPROVED" ? "success" : "info");
      return refresh();
    },
    onError: (error) => toast(error.message, "error"),
  });
}
