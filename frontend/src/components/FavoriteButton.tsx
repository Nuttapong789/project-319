import { useLocation, useNavigate } from "react-router";
import { useFavorites, useToggleFavorite } from "../hooks/useFavorites";
import { useAuthStore } from "../stores/useAuthStore";
import { toast } from "../stores/useToastStore";

// ปุ่มหัวใจ ♡ / ♥ ใช้ทั้งบนการ์ดน้องและหน้ารายละเอียด
// รายการโปรดดึงมาครั้งเดียว (useFavorites) ทุกปุ่มใช้ cache เดียวกัน ไม่ยิง API ซ้ำทุกการ์ด
export default function FavoriteButton({ petId, petName, className = "" }: { petId: number; petName: string; className?: string }) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: favorites } = useFavorites();
  const toggle = useToggleFavorite();

  const isFavorite = favorites?.some((p) => p.id === petId) ?? false;

  function handleClick() {
    if (!user) {
      toast("เข้าสู่ระบบก่อน ถึงจะเก็บน้องไว้ในรายการโปรดได้", "info");
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    toggle.mutate({ petId, isFavorite });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={toggle.isPending}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? `เอา${petName}ออกจากรายการโปรด` : `เพิ่ม${petName}ในรายการโปรด`}
      title={isFavorite ? "อยู่ในรายการโปรด" : "เพิ่มในรายการโปรด"}
      className={`size-11 rounded-full flex items-center justify-center shadow-sm transition-colors disabled:opacity-60 ${
        isFavorite ? "bg-danger text-white" : "bg-white text-ink hover:text-danger"
      } ${className}`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
        <path
          d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8.2 3.5 4.5 7 4.5c2 0 3.7 1.1 5 3 1.3-1.9 3-3 5-3 3.5 0 5.5 3.7 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"
          fill={isFavorite ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
