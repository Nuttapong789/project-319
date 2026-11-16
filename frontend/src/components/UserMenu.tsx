import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { useLogout } from "../hooks/useAuth";
import { initialOf, shortName, type User } from "../types/user";

// ไอคอนเส้นขนาด 20 (ใช้ currentColor)
const icon = (children: ReactNode) => (
  <svg viewBox="0 0 20 20" aria-hidden="true" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const icons = {
  user: icon(<><circle cx="10" cy="7" r="3.2" /><path d="M4 17c.8-3 3.2-4.6 6-4.6s5.2 1.6 6 4.6" /></>),
  paw: icon(<><circle cx="5" cy="8" r="1.5" /><circle cx="8" cy="4.8" r="1.5" /><circle cx="12" cy="4.8" r="1.5" /><circle cx="15" cy="8" r="1.5" /><path d="M10 9.5c-2.5 0-4.5 3.2-4.5 5.2 0 1.4 1 2.1 2.2 2.1.9 0 1.5-.5 2.3-.5s1.4.5 2.3.5c1.2 0 2.2-.7 2.2-2.1 0-2-2-5.2-4.5-5.2z" /></>),
  heart: icon(<path d="M10 16.5s-6-3.7-7.4-7.4C1.6 6.6 3.2 3.6 6 3.6c1.6 0 3 .9 4 2.4 1-1.5 2.4-2.4 4-2.4 2.8 0 4.4 3 3.4 5.5C16 12.8 10 16.5 10 16.5z" />),
  clipboard: icon(<><rect x="4.5" y="3.5" width="11" height="14" rx="2" /><path d="M7.5 3.5V2.8c0-.4.3-.8.8-.8h3.4c.5 0 .8.4.8.8v.7M7.5 9h5M7.5 12.5h5" /></>),
  logout: icon(<><path d="M8 17H5a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 5 3h3" /><path d="M13 14l4-4-4-4M17 10H8" /></>),
};
const chevronRight = (
  <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4 ml-auto text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 5l5 5-5 5" />
  </svg>
);

// เมนูนำทางเท่านั้น (รายละเอียดบัญชีอยู่ในแท็บ "ข้อมูลส่วนตัว" ของหน้า /me)
const items = [
  { to: "/me?tab=profile", label: "ข้อมูลส่วนตัว", icon: icons.user },
  { to: "/me?tab=posts", label: "โพสต์ของฉัน", icon: icons.paw },
  { to: "/favorites", label: "รายการโปรด", icon: icons.heart },
  { to: "/me?tab=requests", label: "คำขอรับเลี้ยง", icon: icons.clipboard },
];

// เมนูบัญชีบน Navbar: avatar + ชื่อสั้น → กดแล้วเปิดเมนู
// จอใหญ่ลอยใต้ปุ่ม · จอเล็ก (อยู่ในเมนู ☰) กางลงมาในแนวเดียวกับลิงก์อื่น
// คีย์บอร์ด: ↓ เปิด/ไปรายการถัดไป · ↑ ย้อน · Home/End · Esc ปิดแล้วกลับไปที่ปุ่ม · Tab ออกจากเมนู
export default function UserMenu({ user, onNavigate }: { user: User; onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const focusOnOpen = useRef<"first" | "last" | null>(null);
  const menuId = useId();
  const logout = useLogout();
  const location = useLocation();
  const here = location.pathname + location.search;

  const menuItems = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

  // กดที่อื่นนอกเมนู → ปิด · กด Esc ที่ไหนก็ได้ระหว่างเปิด (รวมตอน focus อยู่ที่ปุ่ม) → ปิดแล้วกลับไปที่ปุ่ม
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // เปิดด้วยคีย์บอร์ด → ย้าย focus เข้าไปในเมนู
  useEffect(() => {
    if (!open || !focusOnOpen.current) return;
    const list = menuItems();
    (focusOnOpen.current === "first" ? list[0] : list.at(-1))?.focus();
    focusOnOpen.current = null;
  }, [open]);

  function select() {
    setOpen(false);
    onNavigate?.();
  }

  function onButtonKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      focusOnOpen.current = event.key === "ArrowDown" ? "first" : "last";
      if (open) {
        const list = menuItems();
        (event.key === "ArrowDown" ? list[0] : list.at(-1))?.focus();
      } else setOpen(true);
    }
  }

  function onMenuKeyDown(event: KeyboardEvent) {
    const list = menuItems();
    const index = list.indexOf(document.activeElement as HTMLElement);
    const move = (to: number) => {
      event.preventDefault();
      list[(to + list.length) % list.length]?.focus();
    };
    if (event.key === "ArrowDown") move(index + 1);
    else if (event.key === "ArrowUp") move(index - 1);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(list.length - 1);
    else if (event.key === "Tab") setOpen(false);
  }

  const itemClass =
    "flex items-center gap-3 min-h-11 px-3 rounded-xl text-left hover:bg-navy-soft focus-visible:bg-navy-soft focus-visible:outline-2 focus-visible:outline-navy";
  // /me เฉย ๆ = แท็บข้อมูลส่วนตัว
  const isCurrent = (to: string) => here === to || (to === "/me?tab=profile" && here === "/me");

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onButtonKeyDown}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`เมนูบัญชี ${user.name}`}
        className={`w-full md:w-auto min-h-11 flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-navy-soft focus-visible:outline-2 focus-visible:outline-navy ${
          open ? "bg-navy-soft" : ""
        }`}
      >
        <Avatar user={user} />
        <span className="font-semibold truncate max-w-40">{shortName(user.name)}</span>
        <svg viewBox="0 0 20 20" aria-hidden="true" className={`size-4 ml-auto md:ml-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="เมนูบัญชี"
          onKeyDown={onMenuKeyDown}
          className="mt-2 w-full md:absolute md:right-0 md:top-full md:w-64 bg-white border border-line rounded-2xl shadow-lg p-2 z-50 flex flex-col"
        >
          <div className="flex items-center gap-3 px-3 pt-2 pb-3 mb-1 border-b border-line">
            <span aria-hidden="true" className="size-10 rounded-full bg-navy text-white grid place-items-center shrink-0">
              {icons.user}
            </span>
            <div className="min-w-0">
              <p className="font-semibold truncate">{shortName(user.name)}</p>
              <p className="text-sm text-muted">บัญชีผู้ใช้งาน PawHome</p>
            </div>
          </div>
          {items.map((item) => {
            const current = isCurrent(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                role="menuitem"
                aria-current={current ? "page" : undefined}
                onClick={select}
                className={`${itemClass} ${current ? "bg-navy-soft text-navy font-semibold" : "text-ink font-medium"}`}
              >
                <span className={current ? "text-navy" : "text-muted"}>{item.icon}</span>
                {item.label}
                {chevronRight}
              </Link>
            );
          })}
          <div className="border-t border-line my-1" role="none" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              select();
              logout();
            }}
            className={`${itemClass} text-danger hover:bg-danger/10 focus-visible:bg-danger/10`}
          >
            {icons.logout}
            ออกจากระบบ
          </button>
        </div>
      )}
    </div>
  );
}

export function Avatar({ user, size = "size-8" }: { user: User; size?: string }) {
  if (user.avatarUrl) return <img src={user.avatarUrl} alt="" className={`${size} rounded-full object-cover shrink-0`} />;
  return (
    <span aria-hidden="true" className={`${size} rounded-full bg-navy text-white font-display font-semibold grid place-items-center shrink-0`}>
      {initialOf(user.name)}
    </span>
  );
}
