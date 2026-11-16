import { useState } from "react";
import { NavLink, Outlet, ScrollRestoration } from "react-router";
import PawLogo from "../components/PawLogo";
import Toaster from "../components/Toaster";
import { useLogout } from "../hooks/useAuth";
import { useAuthStore } from "../stores/useAuthStore";

// NavLink ใส่สไตล์ "หน้าปัจจุบัน" ให้เองผ่าน isActive
const linkClass = ({ isActive }: { isActive: boolean }) =>
  `py-2 md:py-1.5 border-b-2 whitespace-nowrap ${isActive ? "border-navy text-navy font-semibold" : "border-transparent hover:text-navy"}`;

export default function RootLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  // เมนูบนมือถือ เปิด/ปิด — ใช้แค่ใน component นี้ เลยใช้ useState ธรรมดา
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* กดลิงก์ไปหน้าใหม่แล้วเลื่อนขึ้นบนสุดเอง (ไม่ค้างตำแหน่งเดิมของหน้าก่อน) */}
      <ScrollRestoration />

      <header className="bg-white border-b border-line sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-x-8 gap-y-2">
          <NavLink to="/" onClick={close} className="flex items-center gap-2 font-display font-bold text-xl text-ink">
            <PawLogo className="size-8 fill-navy" />
            PawHome
          </NavLink>

          {/* ปุ่มเมนู แสดงเฉพาะจอเล็ก */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="main-menu"
            aria-label={menuOpen ? "ปิดเมนู" : "เปิดเมนู"}
            className="md:hidden ml-auto size-11 rounded-xl border border-line flex flex-col items-center justify-center gap-1.5"
          >
            <span className={`h-0.5 w-5 bg-ink transition-transform ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`h-0.5 w-5 bg-ink transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`h-0.5 w-5 bg-ink transition-transform ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>

          {/* จอใหญ่: เมนูเรียงแนวนอน | จอเล็ก: ซ่อนไว้ กดปุ่มแล้วเรียงแนวตั้ง */}
          <div
            id="main-menu"
            className={`${menuOpen ? "flex" : "hidden"} md:flex basis-full md:basis-auto flex-1 flex-col md:flex-row md:items-center gap-x-8 gap-y-1 pb-2 md:pb-0`}
          >
            <nav aria-label="เมนูหลัก" className="flex flex-col md:flex-row gap-x-6 flex-1">
              <NavLink to="/" end onClick={close} className={linkClass}>
                หาบ้านให้น้อง
              </NavLink>
              <NavLink to="/pets/new" onClick={close} className={linkClass}>
                โพสต์หาบ้าน
              </NavLink>
              {/* end = ไฮไลต์เฉพาะตอนอยู่ /pets พอดี ไม่ไฮไลต์ตอนอยู่ /pets/new หรือ /pets/3 */}
              <NavLink to="/pets" end onClick={close} className={linkClass}>
                น้องทั้งหมด
              </NavLink>
              <NavLink to="/guide" onClick={close} className={linkClass}>
                ความรู้
              </NavLink>
            </nav>

            {/* เมนูผู้ใช้: เปลี่ยนตามสถานะล็อกอินใน Zustand */}
            <div className="flex flex-col md:flex-row md:items-center gap-x-5 border-t border-line md:border-0 pt-2 md:pt-0">
              {user ? (
                <>
                  <NavLink to="/favorites" onClick={close} className={linkClass}>
                    ♡ รายการโปรด
                  </NavLink>
                  <NavLink to="/me" onClick={close} className={linkClass}>
                    ของฉัน ({user.name})
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      logout();
                    }}
                    className="min-h-10 md:px-3 text-left rounded-lg text-muted hover:text-danger"
                  >
                    ออกจากระบบ
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login" onClick={close} className={linkClass}>
                    เข้าสู่ระบบ
                  </NavLink>
                  <NavLink
                    to="/register"
                    onClick={close}
                    className="mt-2 md:mt-0 min-h-10 px-4 flex items-center justify-center rounded-xl bg-navy text-white font-semibold whitespace-nowrap"
                  >
                    สมัครสมาชิก
                  </NavLink>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-navy-dark text-white/80 text-sm">
        <div className="mx-auto max-w-6xl px-4 py-6 flex flex-wrap justify-between gap-2">
          <span>© 2026 PawHome · Final Project</span>
          <span>ข้อมูลสัตว์เป็นข้อมูลจำลอง · รูปน้อง: Dog CEO, TheCatAPI · ภาพแมวหน้าแรก: Claire Abdo / Unsplash</span>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}
