import type { Ad } from "../data/ads";
import PawLogo from "./PawLogo";

// การ์ดโฆษณา ขนาดเท่าการ์ดน้อง จะได้วางแทรกใน grid เดียวกันได้
export default function AdCard({ ad }: { ad: Ad }) {
  const dark = ad.tone === "navy";

  return (
    <aside
      aria-label={`${ad.label}: ${ad.title}`}
      className={`rounded-2xl overflow-hidden flex flex-col p-5 gap-3 relative ${
        dark ? "bg-navy text-white" : "bg-sand text-ink border border-line"
      }`}
    >
      <span
        className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full ${
          dark ? "bg-white/15 text-white" : "bg-white text-navy"
        }`}
      >
        {ad.label}
      </span>

      <PawLogo className={`size-24 absolute -right-4 top-10 ${dark ? "fill-white/10" : "fill-navy/10"}`} />

      <h3 className="font-display font-semibold text-xl leading-snug mt-6 relative">{ad.title}</h3>
      <p className={`text-sm relative ${dark ? "text-white/80" : "text-muted"}`}>{ad.description}</p>

      <a
        href={ad.href}
        className={`mt-auto min-h-11 flex items-center justify-center rounded-xl font-semibold relative ${
          dark ? "bg-white text-navy" : "bg-navy text-white"
        }`}
      >
        {ad.cta}
      </a>
    </aside>
  );
}
