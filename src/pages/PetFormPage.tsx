import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Field, inputClass } from "../components/Field";
import { provinces } from "../components/FilterBar";
import ImageUpload from "../components/ImageUpload";
import { ErrorBox } from "../components/States";
import { useCreatePet, usePet, useUpdatePet } from "../hooks/usePets";
import { useAuthStore } from "../stores/useAuthStore";
import type { PetInput } from "../types/pet";

// ใช้หน้าเดียวทั้ง "สร้าง" (/pets/new) และ "แก้ไข" (/pets/:id/edit)
// ต้องล็อกอินก่อน (router.tsx ครอบด้วย RequireAuth)
export default function PetFormPage() {
  const { id } = useParams();
  const isEdit = id !== undefined;
  const petId = Number(id);
  const user = useAuthStore((s) => s.user);
  const { data: pet, isLoading, isError, error, refetch } = usePet(isEdit ? petId : 0);
  const notOwner = isEdit && pet !== undefined && pet.ownerId !== user?.id;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 flex flex-col gap-6">
      <Link to={isEdit ? `/pets/${petId}` : "/"} className="self-start font-semibold min-h-11 flex items-center hover:text-navy">
        ← ย้อนกลับ
      </Link>
      <h1 className="font-display font-bold text-3xl">{isEdit ? "แก้ไขโพสต์" : "โพสต์หาบ้านให้น้อง"}</h1>

      {!isEdit && <PetForm />}
      {isEdit && isLoading && <p className="text-muted">กำลังโหลดข้อมูลเดิม...</p>}
      {isEdit && isError && <ErrorBox message={error?.message} onRetry={() => refetch()} />}
      {notOwner && <ErrorBox message="แก้ไขได้เฉพาะโพสต์ของคุณเท่านั้น" />}
      {/* key ทำให้ฟอร์มสร้างใหม่ด้วยข้อมูลเดิม เมื่อโหลดเสร็จ */}
      {isEdit && pet && !notOwner && <PetForm key={pet.id} petId={pet.id} initial={pet} />}
    </div>
  );
}

const emptyForm: PetInput = {
  name: "",
  species: "DOG",
  breed: "",
  ageMonths: 12,
  sex: "MALE",
  province: "",
  imageUrl: "",
  description: "",
  vaccinated: false,
  sterilized: false,
  urgent: false,
};

type Errors = Partial<Record<keyof PetInput, string>>;

// ตรวจข้อมูลก่อนส่ง (Backend ต้องตรวจซ้ำอีกรอบด้วย)
function validate(form: PetInput): Errors {
  const errors: Errors = {};
  if (form.name.trim().length < 2) errors.name = "กรุณากรอกชื่อน้องอย่างน้อย 2 ตัวอักษร";
  if (!form.province) errors.province = "กรุณาเลือกจังหวัด";
  if (!Number.isInteger(form.ageMonths) || form.ageMonths < 0 || form.ageMonths > 300)
    errors.ageMonths = "อายุต้องเป็นตัวเลข 0–300 เดือน";
  if (form.description.trim().length < 20) errors.description = "เล่าเรื่องน้องอย่างน้อย 20 ตัวอักษร";
  return errors;
}

function PetForm({ petId, initial }: { petId?: number; initial?: PetInput }) {
  const navigate = useNavigate();
  const [form, setForm] = useState<PetInput>(() => (initial ? pickInput(initial) : emptyForm));
  const [errors, setErrors] = useState<Errors>({});

  const createMutation = useCreatePet();
  const updateMutation = useUpdatePet(petId ?? 0);
  const mutation = petId ? updateMutation : createMutation;

  // ฟังก์ชันเดียวใช้อัปเดตทุกช่อง และ TypeScript เช็คว่า value ตรงชนิดของช่องนั้น
  function update<K extends keyof PetInput>(key: K, value: PetInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    mutation.mutate(form, {
      onSuccess: (saved) => navigate(`/pets/${saved.id}`),
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-white rounded-3xl border border-line p-6 flex flex-col gap-5">
      {/* อัปโหลดรูปจริงจากเครื่อง แทนการวางลิงก์ */}
      <ImageUpload value={form.imageUrl} onChange={(url) => update("imageUrl", url)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ชื่อน้อง *" error={errors.name}>
          <input value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass(Boolean(errors.name))} />
        </Field>
        <Field label="ชนิด *">
          <select value={form.species} onChange={(e) => update("species", e.target.value as PetInput["species"])} className={inputClass(false)}>
            <option value="DOG">สุนัข</option>
            <option value="CAT">แมว</option>
            <option value="OTHER">อื่น ๆ</option>
          </select>
        </Field>
        <Field label="พันธุ์">
          <input value={form.breed} onChange={(e) => update("breed", e.target.value)} placeholder="เช่น พันทาง" className={inputClass(false)} />
        </Field>
        <Field label="จังหวัด *" hint="จังหวัดของผู้โพสต์" error={errors.province}>
          <select value={form.province} onChange={(e) => update("province", e.target.value)} className={inputClass(Boolean(errors.province))}>
            <option value="">-- เลือกจังหวัด --</option>
            {provinces.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="อายุ (เดือน) *" error={errors.ageMonths}>
          <input
            type="number"
            min={0}
            value={form.ageMonths}
            onChange={(e) => update("ageMonths", Number(e.target.value))}
            className={inputClass(Boolean(errors.ageMonths))}
          />
        </Field>
        <Field label="เพศ *">
          <select value={form.sex} onChange={(e) => update("sex", e.target.value as PetInput["sex"])} className={inputClass(false)}>
            <option value="MALE">ผู้</option>
            <option value="FEMALE">เมีย</option>
          </select>
        </Field>
      </div>

      <fieldset className="flex flex-wrap gap-x-6 gap-y-2">
        <legend className="font-medium mb-2">สุขภาพ</legend>
        <Check label="ฉีดวัคซีนแล้ว" checked={form.vaccinated} onChange={(v) => update("vaccinated", v)} />
        <Check label="ทำหมันแล้ว" checked={form.sterilized} onChange={(v) => update("sterilized", v)} />
        <Check label="ต้องการบ้านด่วน" checked={form.urgent} onChange={(v) => update("urgent", v)} />
      </fieldset>

      <Field label="เรื่องของน้อง *" error={errors.description}>
        <textarea
          rows={5}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="นิสัย ความชอบ เหมาะกับบ้านแบบไหน"
          className={`${inputClass(Boolean(errors.description))} py-3`}
        />
      </Field>

      {/* error จาก Backend เช่น 400 Validation หรือ 500 */}
      {mutation.isError && <p role="alert" className="text-danger">{mutation.error?.message}</p>}

      <div className="flex justify-end gap-3 border-t border-line pt-5">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="min-h-12 px-8 rounded-xl bg-navy text-white font-semibold disabled:opacity-50"
        >
          {mutation.isPending ? "กำลังบันทึก..." : "บันทึกโพสต์"}
        </button>
      </div>
    </form>
  );
}

// ตัดช่องที่ไม่ใช่ PetInput (id, status, createdAt, ownerId, ownerName) ออก ก่อนใส่ในฟอร์ม
function pickInput(p: PetInput): PetInput {
  const { name, species, breed, ageMonths, sex, province, imageUrl, description, vaccinated, sterilized, urgent } = p;
  return { name, species, breed, ageMonths, sex, province, imageUrl, description, vaccinated, sterilized, urgent };
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="min-h-11 flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-5 accent-navy" />
      {label}
    </label>
  );
}
