// แทน src/config/supabase.ts ในเทสต์: จำลองเฉพาะเมธอดที่ Backend เรียก (Auth + Storage)
// ฐานข้อมูลยังเป็นของจริง (PGlite) — ผู้ใช้ใหม่ถูก insert ลง auth.users จำลอง แล้ว trigger สร้าง profile เหมือน Supabase
// พฤติกรรมตามโปรเจกต์จริง: เปิด "Confirm email" (สมัครแล้วต้องยืนยันอีเมลก่อนล็อกอิน)
import { randomUUID } from "node:crypto";
import { prisma } from "../src/config/prisma.js";
import { DEMO_USERS } from "./demo-users.js";

type Account = { id: string; email: string; password: string; confirmed: boolean; name: string };

const accounts = new Map<string, Account>(
  DEMO_USERS.map((u) => [u.email, { id: u.id, email: u.email, password: "123456", confirmed: true, name: u.name }]),
);
// เหมือน Supabase: access token มีอายุ · refresh token ใช้ได้ครั้งเดียว (หมุนทุกครั้ง) · signOut ยกเลิก refresh token ของ session นั้น
const accessTokens = new Map<string, { account: Account; expiresAt: number; sessionId: string }>();
const refreshTokens = new Map<string, { account: Account; sessionId: string }>();
export const uploadedPaths: string[] = [];
export const signUps: { email: string; emailRedirectTo?: string }[] = [];

const TOKEN_TTL_SECONDS = 3600;
const authError = (code: string, status: number) => ({ name: "AuthApiError", code, status, message: code });

let confirmEmailRequired = true;
export const setConfirmEmailRequired = (value: boolean) => (confirmEmailRequired = value);
export function confirmEmail(email: string) {
  accounts.get(email)!.confirmed = true;
}

// ให้ Supabase ตอบ error ครั้งถัดไป (เช่น 429 rate limit, 500) เพื่อทดสอบการแปลง error
let nextAuthError: ReturnType<typeof authError> | null = null;
export const failNextAuthCall = (code: string, status: number) => (nextAuthError = authError(code, status));
function takeInjectedError() {
  const error = nextAuthError;
  nextAuthError = null;
  return error;
}

function issueSession(account: Account, sessionId: string = randomUUID()) {
  const access_token = `token-${randomUUID()}`;
  const refresh_token = `refresh-${randomUUID()}`;
  const expires_at = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  accessTokens.set(access_token, { account, expiresAt: expires_at, sessionId });
  refreshTokens.set(refresh_token, { account, sessionId });
  const user = { id: account.id, email: account.email, user_metadata: { name: account.name } };
  return { access_token, refresh_token, expires_at, expires_in: TOKEN_TTL_SECONDS, user };
}

export const tokenFor = (email: string) => issueSession(accounts.get(email)!).access_token;

// ทำให้ access token หมดอายุทันที (จำลองผ่านไป 1 ชม.)
export function expireToken(token: string) {
  const entry = accessTokens.get(token);
  if (entry) entry.expiresAt = 0;
}

export const supabaseAdmin = {
  auth: {
    async getUser(token: string) {
      const entry = accessTokens.get(token);
      if (!entry) return { data: { user: null }, error: authError("bad_jwt", 401) };
      if (entry.expiresAt <= Date.now() / 1000) return { data: { user: null }, error: authError("session_expired", 401) };
      return { data: { user: { id: entry.account.id, email: entry.account.email } }, error: null };
    },
    admin: {
      async signOut(token: string) {
        const sessionId = accessTokens.get(token)?.sessionId;
        for (const [key, value] of refreshTokens) if (value.sessionId === sessionId) refreshTokens.delete(key);
        // access token ของจริงยังใช้ได้จนหมดอายุ (JWT) — จำลองให้ getUser ปฏิเสธเหมือน Supabase ที่ตรวจ session ถูกลบแล้ว
        accessTokens.delete(token);
        return { data: null, error: null };
      },
    },
  },
  storage: {
    from: (bucket: string) => ({
      async upload(path: string) {
        uploadedPaths.push(path);
        return { data: { path }, error: null };
      },
      getPublicUrl: (path: string) => ({ data: { publicUrl: `https://storage.test/${bucket}/${path}` } }),
    }),
  },
};

const noSession = { user: null, session: null };

export const createAnonClient = () => ({
  auth: {
    async signUp({ email, password, options }: { email: string; password: string; options: { data: { name: string }; emailRedirectTo?: string } }) {
      const injected = takeInjectedError();
      if (injected) return { data: noSession, error: injected };
      signUps.push({ email, emailRedirectTo: options.emailRedirectTo });
      const existing = accounts.get(email);
      if (existing) {
        // เหมือน Supabase: เปิด Confirm email = ไม่บอกว่ามีบัญชีแล้ว (identities ว่าง) · ปิด = error
        if (confirmEmailRequired) return { data: { user: { id: randomUUID(), email, identities: [] }, session: null }, error: null };
        return { data: noSession, error: authError("user_already_exists", 422) };
      }
      const id = randomUUID();
      await prisma.$executeRaw`insert into auth.users (id, email, raw_user_meta_data) values (${id}::uuid, ${email}, ${JSON.stringify(options.data)}::jsonb)`;
      const account = { id, email, password, confirmed: !confirmEmailRequired, name: options.data.name };
      accounts.set(email, account);
      if (confirmEmailRequired) return { data: { user: { id, email, identities: [{}] }, session: null }, error: null };
      const session = issueSession(account);
      return { data: { user: session.user, session }, error: null };
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const injected = takeInjectedError();
      if (injected) return { data: noSession, error: injected };
      const a = accounts.get(email);
      if (!a || a.password !== password) return { data: noSession, error: authError("invalid_credentials", 400) };
      if (!a.confirmed) return { data: noSession, error: authError("email_not_confirmed", 400) };
      const session = issueSession(a);
      return { data: { user: session.user, session }, error: null };
    },
    async refreshSession({ refresh_token }: { refresh_token: string }) {
      const injected = takeInjectedError();
      if (injected) return { data: noSession, error: injected };
      const entry = refreshTokens.get(refresh_token);
      if (!entry) return { data: noSession, error: authError("refresh_token_not_found", 400) };
      refreshTokens.delete(refresh_token); // ใช้ได้ครั้งเดียว
      const session = issueSession(entry.account, entry.sessionId);
      return { data: { user: session.user, session }, error: null };
    },
  },
});
