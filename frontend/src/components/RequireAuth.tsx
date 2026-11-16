import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "../stores/useAuthStore";

// ครอบหน้าที่ต้องล็อกอินก่อน (ดู router.tsx)
// ยังไม่ล็อกอิน → ส่งไปหน้า /login พร้อมจำไว้ว่าจะกลับมาหน้าไหน (?redirect=...)
export default function RequireAuth() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  return <Outlet />;
}
