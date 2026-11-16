import type { ReactNode } from "react";

// =========================================================
// สถานะต่าง ๆ ที่ใช้ซ้ำทุกหน้า: Skeleton (isLoading), Error (isError), ว่าง
// =========================================================

export function PetCardSkeleton() {
  return (
    <div aria-hidden="true" className="bg-white rounded-2xl border border-line overflow-hidden animate-pulse">
      <div className="h-48 bg-sand" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-5 w-1/2 rounded bg-sand" />
        <div className="h-3 w-4/5 rounded bg-ground" />
        <div className="h-3 w-2/5 rounded bg-ground" />
        <div className="h-11 rounded-xl bg-ground mt-2" />
      </div>
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="bg-white rounded-2xl border border-danger/30 p-8 flex flex-col items-center text-center gap-3">
      <p className="font-semibold text-lg">โหลดข้อมูลไม่สำเร็จ</p>
      <p className="text-muted">{message ?? "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง"}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="min-h-11 px-6 rounded-xl bg-navy text-white font-semibold">
          ลองใหม่
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-line p-10 flex flex-col items-center text-center gap-3">
      <p className="font-semibold text-lg">{title}</p>
      {action}
    </div>
  );
}
