import { Link } from "react-router";
import { homePromos } from "../data/promos";

// ข่าวสาร / ร่วมช่วยเหลือ / ผู้สนับสนุน แบบแถบเล็ก บนรายการน้องในหน้าแรก — กดแล้วไปหน้ารายละเอียด
// มีป้ายหมวดกำกับ จะได้แยกออกจากการ์ดน้องชัดเจน
export default function AdStrip() {
  return (
    <section aria-label="ข่าวสารและผู้สนับสนุน" className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
      {homePromos.map((promo) => (
        <Link
          key={promo.id}
          to={promo.path}
          className={`flex items-center gap-3 rounded-xl px-4 py-3 min-h-16 border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${
            promo.tone === "navy"
              ? "bg-navy text-white border-navy hover:bg-navy-dark"
              : "bg-white text-ink border-line hover:border-navy"
          }`}
        >
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold ${promo.tone === "navy" ? "text-white/70" : "text-navy"}`}>
              {promo.category}
              {promo.isDemo && " · Demo"}
            </p>
            <p className="font-semibold truncate">{promo.title}</p>
          </div>
          <span className="text-sm font-semibold whitespace-nowrap">{promo.cta} →</span>
        </Link>
      ))}
    </section>
  );
}
