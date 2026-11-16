import { useState, type FormEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import { Field, inputClass } from "../components/Field";
import { useRegister } from "../hooks/useAuth";
import { useAuthStore } from "../stores/useAuthStore";
import { EMAIL_PATTERN, safeRedirect, type RegisterInput } from "../types/user";
import AuthShell from "../components/AuthShell";

type Errors = Partial<Record<keyof RegisterInput | "confirm", string>>;

export default function RegisterPage() {
  const [params] = useSearchParams();
  const redirect = safeRedirect(params.get("redirect"));
  const user = useAuthStore((s) => s.user);
  const register = useRegister();

  const [form, setForm] = useState<RegisterInput>({ name: "", email: "", password: "" });
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  // สมัครสำเร็จ = ล็อกอินให้เลย แล้วพาไปหน้าที่ตั้งใจไว้
  if (user) return <Navigate to={redirect} replace />;

  // โปรเจกต์เปิดยืนยันอีเมล: ยังไม่ล็อกอิน ต้องกดลิงก์ในอีเมลก่อน
  if (register.data && "needsVerification" in register.data) {
    return (
      <AuthShell title="ตรวจอีเมลของคุณ" subtitle={`ถ้าอีเมล ${register.data.email} ยังไม่เคยสมัคร เราส่งลิงก์ยืนยันไปให้แล้ว`}>
        <p role="status" className="text-sm bg-navy-soft text-navy rounded-xl p-3">
          กดลิงก์ในอีเมลเพื่อยืนยัน แล้วกลับมาเข้าสู่ระบบ (ไม่เจอให้ลองดูในโฟลเดอร์สแปม)
        </p>
        <Link
          to={`/login?redirect=${encodeURIComponent(redirect)}`}
          className="min-h-12 rounded-xl bg-navy text-white font-semibold flex items-center justify-center"
        >
          ไปหน้าเข้าสู่ระบบ
        </Link>
      </AuthShell>
    );
  }

  function update<K extends keyof RegisterInput>(key: K, value: RegisterInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found: Errors = {};
    if (form.name.trim().length < 2) found.name = "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร";
    if (!EMAIL_PATTERN.test(form.email.trim())) found.email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (form.password.length < 6) found.password = "รหัสผ่านอย่างน้อย 6 ตัวอักษร";
    if (confirm !== form.password) found.confirm = "รหัสผ่านทั้งสองช่องไม่ตรงกัน";
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    register.mutate({ name: form.name.trim(), email: form.email.trim(), password: form.password });
  }

  return (
    <AuthShell title="สมัครสมาชิก" subtitle="สมัครฟรี ใช้เวลาไม่ถึงนาที">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field label="ชื่อที่แสดง" hint="ผู้โพสต์จะเห็นชื่อนี้ตอนคุณขอรับเลี้ยง" error={errors.name}>
          <input autoComplete="name" value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass(Boolean(errors.name))} />
        </Field>
        <Field label="อีเมล" error={errors.email}>
          <input
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className={inputClass(Boolean(errors.email))}
          />
        </Field>
        <Field label="รหัสผ่าน" hint="อย่างน้อย 6 ตัวอักษร" error={errors.password}>
          <input
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            className={inputClass(Boolean(errors.password))}
          />
        </Field>
        <Field label="ยืนยันรหัสผ่าน" error={errors.confirm}>
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass(Boolean(errors.confirm))}
          />
        </Field>

        {register.isError && <p role="alert" className="text-danger">{register.error?.message}</p>}

        <button type="submit" disabled={register.isPending} className="min-h-12 rounded-xl bg-navy text-white font-semibold disabled:opacity-50">
          {register.isPending ? "กำลังสมัคร..." : "สมัครสมาชิก"}
        </button>
      </form>

      <p className="text-center text-muted">
        มีบัญชีแล้ว?{" "}
        <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-navy font-semibold underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </AuthShell>
  );
}
