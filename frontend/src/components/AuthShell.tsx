import type { ReactNode } from "react";
import PawLogo from "./PawLogo";

// กรอบของหน้าเข้าสู่ระบบ / สมัครสมาชิก
export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="bg-white rounded-3xl border border-line p-6 sm:p-8 flex flex-col gap-5">
        <div className="flex flex-col items-center text-center gap-2">
          <PawLogo className="size-12 fill-navy" />
          <h1 className="font-display font-bold text-3xl">{title}</h1>
          <p className="text-muted">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
