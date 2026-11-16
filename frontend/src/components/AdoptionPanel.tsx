import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { useCancelAdoption, useCreateAdoption, useMyAdoptions } from "../hooks/useAdoptions";
import { useAuthStore } from "../stores/useAuthStore";
import { housingLabel, type AdoptionInput, type AdoptionRequest, type Housing } from "../types/adoption";
import { timeAgo, type Pet } from "../types/pet";
import AdoptionBadge from "./AdoptionBadge";
import { Field, inputClass } from "./Field";

// กล่อง "ขอรับเลี้ยง" ในหน้ารายละเอียด (สำหรับคนที่ไม่ใช่เจ้าของโพสต์)
// ยังไม่ล็อกอิน → ชวนเข้าสู่ระบบ | เคยยื่นแล้ว → แสดงสถานะคำขอ | ยังไม่เคยยื่น → แสดงฟอร์ม
export default function AdoptionPanel({ pet }: { pet: Pet }) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const { data: myRequests, isLoading } = useMyAdoptions();

  if (!user) {
    return (
      <Box title={`อยากรับ${pet.name}ไปดูแล?`}>
        <p className="text-muted">เข้าสู่ระบบก่อน แล้วกรอกฟอร์มสั้น ๆ ผู้โพสต์จะติดต่อกลับ</p>
        <Link
          to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
          className="self-start min-h-12 px-6 flex items-center rounded-xl bg-navy text-white font-semibold"
        >
          เข้าสู่ระบบเพื่อขอรับเลี้ยง
        </Link>
      </Box>
    );
  }

  if (isLoading) {
    return <div aria-hidden="true" className="h-40 rounded-2xl bg-white border border-line animate-pulse" />;
  }

  const mine = myRequests?.find((r) => r.petId === pet.id);
  if (mine) return <MyRequestStatus request={mine} />;

  if (pet.status === "ADOPTED") {
    return (
      <Box title={`${pet.name}ได้บ้านแล้ว`}>
        <p className="text-muted">ขอบคุณที่สนใจนะ ลองดูน้องตัวอื่นที่ยังรอบ้านอยู่</p>
        <Link to="/pets" className="self-start min-h-11 px-5 flex items-center rounded-xl border border-navy text-navy font-semibold">
          ดูน้องตัวอื่น →
        </Link>
      </Box>
    );
  }

  return <AdoptionForm pet={pet} />;
}

function MyRequestStatus({ request }: { request: AdoptionRequest }) {
  const cancel = useCancelAdoption();

  function handleCancel() {
    if (!window.confirm("ยกเลิกคำขอรับเลี้ยงนี้ใช่ไหม?")) return;
    cancel.mutate(request.id);
  }

  return (
    <Box title="คำขอรับเลี้ยงของคุณ">
      <div className="flex flex-wrap items-center gap-2">
        <AdoptionBadge status={request.status} />
        <span className="text-sm text-muted">ยื่นเมื่อ {timeAgo(request.createdAt)}</span>
      </div>
      {request.status === "PENDING" && <p className="text-muted">ผู้โพสต์จะติดต่อกลับทางเบอร์ {request.phone}</p>}
      {request.status === "APPROVED" && <p>ยินดีด้วย! ผู้โพสต์อนุมัติแล้ว รอผู้โพสต์โทรนัดรับน้องได้เลย</p>}
      {request.status === "REJECTED" && <p className="text-muted">ครั้งนี้ยังไม่ผ่าน ลองดูน้องตัวอื่นที่รอบ้านอยู่นะ</p>}
      {request.status === "PENDING" && (
        <button
          type="button"
          onClick={handleCancel}
          disabled={cancel.isPending}
          className="self-start min-h-11 px-5 rounded-xl border border-danger text-danger font-semibold disabled:opacity-50"
        >
          {cancel.isPending ? "กำลังยกเลิก..." : "ยกเลิกคำขอ"}
        </button>
      )}
    </Box>
  );
}

type Errors = Partial<Record<keyof AdoptionInput | "agree", string>>;

function AdoptionForm({ pet }: { pet: Pet }) {
  const [form, setForm] = useState<AdoptionInput>({ phone: "", housing: "HOUSE", message: "" });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const create = useCreateAdoption(pet.id);

  function update<K extends keyof AdoptionInput>(key: K, value: AdoptionInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const phone = form.phone.replace(/[\s-]/g, "");
    const found: Errors = {};
    if (!/^0\d{8,9}$/.test(phone)) found.phone = "เบอร์โทรต้องขึ้นต้นด้วย 0 และมี 9–10 หลัก";
    if (form.message.trim().length < 20) found.message = "เล่าเกี่ยวกับตัวคุณอย่างน้อย 20 ตัวอักษร";
    if (!agree) found.agree = "กรุณายอมรับเงื่อนไขก่อนส่งคำขอ";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    create.mutate({ ...form, phone, message: form.message.trim() });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl border border-line p-5 flex flex-col gap-4">
      <div>
        <h2 className="font-display font-semibold text-lg">ขอรับเลี้ยง{pet.name}</h2>
        <p className="text-sm text-muted">ข้อมูลนี้ผู้โพสต์จะเห็นคนเดียว ใช้ติดต่อกลับและดูความพร้อม</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="เบอร์โทรติดต่อ *" error={errors.phone}>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="08x-xxx-xxxx"
            className={inputClass(Boolean(errors.phone))}
          />
        </Field>
        <Field label="ที่พักอาศัย *">
          <select
            value={form.housing}
            onChange={(e) => update("housing", e.target.value as Housing)}
            className={inputClass(false)}
          >
            {(Object.keys(housingLabel) as Housing[]).map((h) => (
              <option key={h} value={h}>
                {housingLabel[h]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="แนะนำตัวสั้น ๆ *" hint="เช่น เคยเลี้ยงสัตว์ไหม มีคนอยู่บ้านช่วงไหน ที่พักอนุญาตให้เลี้ยงไหม" error={errors.message}>
        <textarea
          rows={4}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          className={`${inputClass(Boolean(errors.message))} py-3`}
        />
      </Field>

      <label className="flex items-start gap-2 min-h-11">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="size-5 mt-0.5 accent-navy" />
        <span>
          ฉันจะดูแลน้องตลอดชีวิต พาไปฉีดวัคซีนตามนัด และยินดีให้ผู้โพสต์ติดตามความเป็นอยู่ของน้อง
          {errors.agree && <span className="block text-sm text-danger">{errors.agree}</span>}
        </span>
      </label>

      {create.isError && <p role="alert" className="text-danger">{create.error?.message}</p>}

      <button
        type="submit"
        disabled={create.isPending}
        className="self-start min-h-12 px-8 rounded-xl bg-navy text-white font-semibold disabled:opacity-50"
      >
        {create.isPending ? "กำลังส่ง..." : "ส่งคำขอรับเลี้ยง"}
      </button>
    </form>
  );
}

function Box({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-line p-5 flex flex-col gap-3">
      <h2 className="font-display font-semibold text-lg">{title}</h2>
      {children}
    </section>
  );
}
