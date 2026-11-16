// =========================================================
// TanStack Query hooks = "Server State" (ข้อมูลที่มาจาก Database)
// - useQuery    ดึงข้อมูล + จัดการ isLoading / isError / cache ให้เอง
// - useMutation สร้าง/แก้/ลบ แล้ว invalidateQueries ให้รายการโหลดใหม่เอง (Zero-Refresh)
// =========================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPet, deletePet, getMyPets, getPet, getPets, updatePet } from "../api/pets";
import { useAuthStore } from "../stores/useAuthStore";
import { toast } from "../stores/useToastStore";
import type { PetFilters, PetInput } from "../types/pet";

// queryKey เก็บรวมไว้ที่เดียว จะได้เรียกใช้ตรงกันทุกที่
// ข้อมูลของคนที่ล็อกอิน ขึ้นต้นด้วย "me" ทั้งหมด → ออกจากระบบแล้วล้างทิ้งได้ในคำสั่งเดียว
export const petKeys = {
  all: ["pets"] as const,
  list: (filters: PetFilters) => ["pets", "list", filters] as const,
  detail: (id: number) => ["pets", "detail", id] as const,
  mine: ["me", "pets"] as const,
};

export function usePets(filters: PetFilters) {
  return useQuery({
    queryKey: petKeys.list(filters), // ตัวกรองเปลี่ยน = key เปลี่ยน = ดึงใหม่อัตโนมัติ
    queryFn: () => getPets(filters),
  });
}

export function usePet(id: number) {
  return useQuery({
    queryKey: petKeys.detail(id),
    queryFn: ({ signal }) => getPet(id, signal),
    enabled: Number.isInteger(id) && id > 0, // id ไม่ถูกต้องก็ไม่ต้องยิง
  });
}

export function useMyPets() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: petKeys.mine,
    queryFn: getMyPets,
    enabled: user !== null,
  });
}

// น้องเปลี่ยน → รายการน้อง และข้อมูลในหน้า "ของฉัน" ต้องโหลดใหม่
// deletedId: ไม่โหลดรายละเอียด/คำขอของน้องที่เพิ่งลบซ้ำ (จะได้ 404 ระหว่างที่หน้ายังไม่เปลี่ยน)
function useRefreshPets() {
  const queryClient = useQueryClient();
  return (deletedId?: number) =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: petKeys.all,
        predicate: ({ queryKey }) => deletedId === undefined || queryKey[2] !== deletedId,
      }),
      queryClient.invalidateQueries({ queryKey: ["me"] }),
    ]);
}

export function useCreatePet() {
  const refresh = useRefreshPets();
  return useMutation({
    mutationFn: (input: PetInput) => createPet(input),
    onSuccess: () => {
      toast("โพสต์หาบ้านให้น้องแล้ว");
      return refresh();
    },
  });
}

export function useUpdatePet(id: number) {
  const refresh = useRefreshPets();
  return useMutation({
    mutationFn: (input: PetInput) => updatePet(id, input),
    onSuccess: () => {
      toast("บันทึกแล้ว");
      return refresh();
    },
  });
}

export function useDeletePet() {
  const refresh = useRefreshPets();
  const queryClient = useQueryClient();
  return useMutation({
    // ยกเลิก request ของน้องตัวนี้ที่ยังค้าง (เช่น โหลดคำขอใหม่หลังกดอนุมัติ) ก่อนลบ ไม่งั้นมาถึงหลังลบแล้วได้ 404
    onMutate: (id: number) =>
      queryClient.cancelQueries({ queryKey: petKeys.all, predicate: ({ queryKey }) => queryKey[2] === id }),
    mutationFn: (id: number) => deletePet(id),
    onSuccess: (_data, id) => {
      toast("ลบแล้ว");
      // ไม่ต้องรอโหลดใหม่ ให้หน้ารายละเอียดเปลี่ยนหน้าออกไปได้ทันที (น้องตัวนี้ไม่มีแล้ว)
      void refresh(id);
    },
  });
}
