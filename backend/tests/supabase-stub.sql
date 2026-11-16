-- จำลองส่วนที่ Supabase มีให้อยู่แล้ว เพื่อรัน database/*.sql ใน PGlite ตอนทดสอบ (ไม่ใช้กับ Supabase จริง)
create role anon nologin;
create role authenticated nologin;

create schema auth;
create table auth.users (
  id                  uuid primary key default gen_random_uuid(),
  email               text unique,
  raw_user_meta_data  jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);

-- เหมือน auth.uid() ของ Supabase: อ่าน sub จาก JWT claims ที่ PostgREST ตั้งให้
create function auth.uid() returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
  )::uuid
$$;

create schema storage;
create table storage.buckets (
  id                  text primary key,
  name                text not null,
  public              boolean default false,
  file_size_limit     bigint,
  allowed_mime_types  text[]
);

-- Supabase ให้สิทธิ์ตารางใน public กับ anon/authenticated เป็นค่าเริ่มต้น แล้วคุมด้วย RLS
grant usage on schema auth, public to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
