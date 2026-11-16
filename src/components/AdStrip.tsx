import { ads } from "../data/ads";

// โฆษณาแบบแถบเล็ก ใช้วางบนรายการน้องในหน้าแรก (เล็กกว่า AdSection ท้ายหน้า)
// มีป้าย "ข่าวสาร" กำกับ จะได้แยกออกจากการ์ดน้องชัดเจน
export default function AdStrip() {
  return (
    <section aria-label="ข่าวสารและผู้สนับสนุน" className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
      {ads.map((ad) => (
        <a
          key={ad.id}
          href={ad.href}
          className={`flex items-center gap-3 rounded-xl px-4 py-3 min-h-16 border transition-colors ${
            ad.tone === "navy"
              ? "bg-navy text-white border-navy hover:bg-navy-dark"
              : "bg-white text-ink border-line hover:border-navy"
          }`}
        >
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold ${ad.tone === "navy" ? "text-white/70" : "text-navy"}`}>{ad.label}</p>
            <p className="font-semibold truncate">{ad.title}</p>
          </div>
          <span className="text-sm font-semibold whitespace-nowrap">{ad.cta} →</span>
        </a>
      ))}
    </section>
  );
}
