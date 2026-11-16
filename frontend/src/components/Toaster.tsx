import { useToastStore, type ToastType } from "../stores/useToastStore";

const toneClass: Record<ToastType, string> = {
  success: "bg-navy text-white",
  info: "bg-ink text-white",
  error: "bg-danger text-white",
};

const icon: Record<ToastType, string> = { success: "✓", info: "i", error: "!" };

// กล่องแจ้งเตือนมุมล่าง วางไว้ครั้งเดียวใน RootLayout แล้วเรียก toast("...") จากที่ไหนก็ได้
export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      className="fixed z-50 bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 flex flex-col gap-2 sm:w-80 pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.type === "error" ? "alert" : "status"}
          className={`pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lg ${toneClass[t.type]}`}
        >
          <span aria-hidden="true" className="size-6 shrink-0 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
            {icon[t.type]}
          </span>
          <p className="flex-1 text-sm font-medium">{t.message}</p>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="ปิดการแจ้งเตือน"
            className="size-8 shrink-0 rounded-full hover:bg-white/15"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
