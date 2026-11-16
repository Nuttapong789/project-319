import { Link } from "react-router";
import DemoInterestForm from "../components/DemoInterestForm";
import PawLogo from "../components/PawLogo";
import { promoStatus, promoStatusLabel, type InfoItem, type Promo } from "../data/promos";

// หน้ารายละเอียดข่าวสาร / ร่วมช่วยเหลือ / ผู้สนับสนุน (เนื้อหาทั้งหมดจาก data/promos.ts)
export default function PromoPage({ promo }: { promo: Promo }) {
  const dark = promo.tone === "navy";
  const status = promoStatus(promo);
  const { action } = promo;

  const facts: InfoItem[] = [
    { label: "ผู้จัด", value: promo.organization },
    ...(promo.date ? [{ label: "วันที่", value: promo.date.label }] : []),
    { label: "เวลา", value: promo.time },
    { label: "สถานที่", value: promo.location },
  ];
  const chip = `self-start text-xs font-semibold px-2.5 py-1 rounded-full ${dark ? "bg-white/15" : "bg-white text-navy"}`;

  return (
    <>
      <section className={`overflow-hidden ${dark ? "bg-navy text-white" : "bg-sand text-ink"}`}>
        <div className="mx-auto max-w-4xl px-4 py-10 flex flex-col gap-3 relative">
          <PawLogo className={`size-40 absolute -right-6 -bottom-8 ${dark ? "fill-white/10" : "fill-navy/10"}`} />
          <Link
            to="/"
            className={`self-start font-semibold min-h-11 flex items-center relative ${dark ? "text-white/80 hover:text-white" : "hover:text-navy"}`}
          >
            ← กลับหน้าแรก
          </Link>
          <div className="flex flex-wrap gap-2 relative">
            <span className={chip}>{promo.category}</span>
            <span className={chip}>
              {promoStatusLabel[status]}
              {status === "upcoming" && promo.date ? ` · ${promo.date.label}` : ""}
            </span>
            {promo.isDemo && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white text-danger">ข้อมูลจำลอง (Demo)</span>}
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl relative">{promo.title}</h1>
          <p className={`max-w-2xl relative ${dark ? "text-white/80" : "text-muted"}`}>{promo.description}</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8 flex flex-col gap-6">
        <dl className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
          {facts.map((fact) => (
            <div key={fact.label} className="bg-white rounded-xl border border-line p-3">
              <dt className="text-sm text-muted">{fact.label}</dt>
              <dd className="font-semibold">{fact.value}</dd>
            </div>
          ))}
        </dl>

        {promo.price && (
          <section className="bg-white rounded-2xl border border-line p-5">
            <h2 className="font-display font-semibold text-lg mb-3">
              ค่าบริการ{promo.isDemo && promo.price.length > 1 ? " (ราคาตัวอย่าง ไม่ใช่ราคาจริง)" : ""}
            </h2>
            <dl className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
              {promo.price.map((p) => (
                <div key={p.label} className="rounded-xl bg-ground p-3">
                  <dt className="text-sm text-muted">{p.label}</dt>
                  <dd className="font-display font-semibold text-xl text-navy">{p.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <BulletSection heading="เงื่อนไข" items={promo.requirements} />
        {promo.sections.map((section) => (
          <BulletSection key={section.heading} {...section} />
        ))}

        <section className="bg-white rounded-2xl border border-line p-5 flex flex-col gap-3">
          <h2 className="font-display font-semibold text-lg">ติดต่อ</h2>
          <dl className="flex flex-col gap-2">
            {promo.contact.map((c) => (
              <div key={c.label} className="flex flex-wrap gap-x-3">
                <dt className="text-muted min-w-32">{c.label}</dt>
                <dd className="font-medium flex-1">{c.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {action.kind === "form" && <DemoInterestForm title={action.label} fields={action.fields} success={action.success} />}

        <div className="flex flex-wrap gap-3">
          {action.kind === "link" && (
            <Link to={action.to} className="min-h-12 px-6 flex items-center rounded-xl bg-navy text-white font-semibold">
              {action.label} →
            </Link>
          )}
          <Link to="/pets" className="min-h-12 px-6 flex items-center rounded-xl border border-navy text-navy font-semibold">
            ดูน้องที่รอบ้าน
          </Link>
        </div>
      </div>
    </>
  );
}

function BulletSection({ heading, items, ordered }: { heading: string; items: string[]; ordered?: boolean }) {
  const List = ordered ? "ol" : "ul";
  return (
    <section className="bg-white rounded-2xl border border-line p-5">
      <h2 className="font-display font-semibold text-lg mb-2">{heading}</h2>
      <List className={`flex flex-col gap-1.5 pl-6 marker:text-navy ${ordered ? "list-decimal" : "list-disc"}`}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </List>
    </section>
  );
}
