import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import { Field, inputClass } from "../components/Field";
import AuthShell from "../components/AuthShell";
import { USE_MOCK } from "../api/client";
import { useLogin } from "../hooks/useAuth";
import { useAuthStore } from "../stores/useAuthStore";
import { EMAIL_PATTERN, safeRedirect } from "../types/user";

// /login?redirect=/pets/3 → ล็อกอินเสร็จแล้วกลับไปหน้าเดิม
export default function LoginPage() {
  const [params] = useSearchParams();
  const redirect = safeRedirect(params.get("redirect"));
  const user = useAuthStore((s) => s.user);
  const login = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // ลิงก์ยืนยันอีเมลพากลับมาที่ /login?verified=1#access_token=... (หรือ #error=... ถ้าลิงก์หมดอายุ)
  const [verified] = useState(() =>
    params.get("verified") ? (window.location.hash.includes("error") || params.has("error") ? "failed" : "ok") : null,
  );
  useEffect(() => {
    // ไม่เก็บ token ที่ติดมากับลิงก์ไว้ใน URL / ประวัติ browser (เข้าสู่ระบบด้วยรหัสผ่านตามปกติ)
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }, []);

  // ล็อกอินสำเร็จ → user ใน Zustand เปลี่ยน → หน้านี้ render ใหม่แล้วพาไปหน้าที่ตั้งใจไว้
  if (user) return <Navigate to={redirect} replace />;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found: typeof errors = {};
    if (!EMAIL_PATTERN.test(email.trim())) found.email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (password.length < 6) found.password = "รหัสผ่านอย่างน้อย 6 ตัวอักษร";
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    login.mutate({ email: email.trim(), password });
  }

  return (
    <AuthShell title="เข้าสู่ระบบ" subtitle="เก็บน้องไว้ในรายการโปรด ขอรับเลี้ยง และโพสต์หาบ้านให้น้อง">
      {verified && (
        <p role="status" className="text-sm bg-navy-soft text-navy rounded-xl p-3">
          {verified === "ok"
            ? "ยืนยันอีเมลแล้ว เข้าสู่ระบบได้เลย"
            : "ลิงก์ยืนยันหมดอายุหรือถูกใช้ไปแล้ว ลองเข้าสู่ระบบ ถ้ายังไม่ได้ให้สมัครใหม่อีกครั้ง"}
        </p>
      )}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field label="อีเมล" error={errors.email}>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass(Boolean(errors.email))}
          />
        </Field>
        <Field label="รหัสผ่าน" error={errors.password}>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass(Boolean(errors.password))}
          />
        </Field>

        {login.isError && <p role="alert" className="text-danger">{login.error?.message}</p>}

        <button type="submit" disabled={login.isPending} className="min-h-12 rounded-xl bg-navy text-white font-semibold disabled:opacity-50">
          {login.isPending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>
      </form>

      {USE_MOCK && (
        <p className="text-sm bg-navy-soft text-navy rounded-xl p-3">
          โหมดข้อมูลจำลอง: ลองใช้ <b>pong@pawhome.test</b> รหัส <b>123456</b>
        </p>
      )}

      <p className="text-center text-muted">
        ยังไม่มีบัญชี?{" "}
        <Link to={`/register?redirect=${encodeURIComponent(redirect)}`} className="text-navy font-semibold underline">
          สมัครสมาชิก
        </Link>
      </p>
    </AuthShell>
  );
}
