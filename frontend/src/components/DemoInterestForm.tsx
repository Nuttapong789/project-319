import { useState, type FormEvent } from "react";
import type { FormField } from "../data/promos";
import { Field, inputClass } from "./Field";

type Values = Record<string, string | string[]>;

const PHONE = /^0\d{8,9}$/;

// ตรวจแบบฟอร์ม: ช่องบังคับต้องกรอก · เบอร์โทรรูปแบบเดียวกับฟอร์มขอรับเลี้ยง (ตัดช่องว่าง/ขีดก่อน)
export function validateForm(fields: FormField[], values: Values): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const value = values[field.name];
    const empty = Array.isArray(value) ? value.length === 0 : !value?.trim();
    if (field.required && empty) errors[field.name] = field.type === "checks" ? "เลือกอย่างน้อย 1 อย่าง" : `กรุณากรอก${field.label}`;
    else if (field.type === "tel" && !empty && !PHONE.test(String(value).replace(/[\s-]/g, "")))
      errors[field.name] = "เบอร์โทรต้องขึ้นต้นด้วย 0 และมี 9–10 หลัก";
  }
  return errors;
}

// แบบฟอร์มแสดงความสนใจในหน้าข่าวสาร (Demo) — ตรวจข้อมูลแล้วแสดงสรุป ไม่ส่งหรือเก็บข้อมูลไปที่ไหน
export default function DemoInterestForm({ title, fields, success }: { title: string; fields: FormField[]; success: string }) {
  const initial = (): Values => Object.fromEntries(fields.map((f) => [f.name, f.type === "checks" ? [] : ""]));
  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Values | null>(null);

  const set = (name: string, value: string | string[]) => setValues((prev) => ({ ...prev, [name]: value }));

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validateForm(fields, values);
    setErrors(found);
    if (Object.keys(found).length === 0) setSubmitted(values);
  }

  if (submitted) {
    return (
      <section className="bg-white rounded-2xl border border-line p-5 flex flex-col gap-3" aria-live="polite">
        <h2 className="font-display font-semibold text-lg">{title}</h2>
        <p role="status" className="text-sm bg-navy-soft text-navy rounded-xl p-3">{success}</p>
        <dl className="flex flex-col gap-1.5 text-sm">
          {fields
            .filter((f) => (Array.isArray(submitted[f.name]) ? submitted[f.name].length : submitted[f.name]))
            .map((f) => (
              <div key={f.name} className="flex flex-wrap gap-x-3">
                <dt className="text-muted min-w-32">{f.label}</dt>
                <dd className="font-medium flex-1">{[submitted[f.name]].flat().join(", ")}</dd>
              </div>
            ))}
        </dl>
        <button
          type="button"
          onClick={() => {
            setSubmitted(null);
            setValues(initial());
          }}
          className="self-start min-h-11 px-5 rounded-xl border border-navy text-navy font-semibold"
        >
          กรอกใหม่อีกครั้ง
        </button>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl border border-line p-5 flex flex-col gap-4">
      <div>
        <h2 className="font-display font-semibold text-lg">{title}</h2>
        <p className="text-sm text-muted">ระบบ Demo: ตรวจข้อมูลแล้วแสดงสรุปเท่านั้น ไม่มีการส่งหรือเก็บข้อมูลของคุณ</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const error = errors[field.name];
          const label = `${field.label}${field.required ? " *" : ""}`;
          if (field.type === "checks") {
            const selected = values[field.name] as string[];
            return (
              <fieldset key={field.name} className="sm:col-span-2 flex flex-col gap-1.5">
                <legend className="font-medium mb-1.5">{label}</legend>
                <div className="flex flex-wrap gap-x-5">
                  {field.options.map((option) => (
                    <label key={option} className="min-h-11 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selected.includes(option)}
                        onChange={(e) => set(field.name, e.target.checked ? [...selected, option] : selected.filter((o) => o !== option))}
                        className="size-5 accent-navy"
                      />
                      {option}
                    </label>
                  ))}
                </div>
                {error && <span className="text-sm text-danger">{error}</span>}
              </fieldset>
            );
          }
          const value = values[field.name] as string;
          return (
            <div key={field.name} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
              <Field label={label} hint={field.hint} error={error}>
                {field.type === "select" ? (
                  <select value={value} onChange={(e) => set(field.name, e.target.value)} className={inputClass(Boolean(error))}>
                    <option value="">-- เลือก --</option>
                    {field.options.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea rows={3} value={value} onChange={(e) => set(field.name, e.target.value)} className={`${inputClass(Boolean(error))} py-3`} />
                ) : (
                  <input
                    type={field.type}
                    inputMode={field.type === "tel" ? "tel" : undefined}
                    value={value}
                    onChange={(e) => set(field.name, e.target.value)}
                    className={inputClass(Boolean(error))}
                  />
                )}
              </Field>
            </div>
          );
        })}
      </div>
      <button type="submit" className="self-start min-h-12 px-8 rounded-xl bg-navy text-white font-semibold">
        ส่งแบบฟอร์ม (Demo)
      </button>
    </form>
  );
}
