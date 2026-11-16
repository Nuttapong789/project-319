// สร้างบัญชีทดลอง 3 บัญชีผ่าน Supabase Auth Admin API (วิธีที่ Supabase รองรับ ไม่ insert ลง auth.users ตรง ๆ)
// รันก่อน database/mock-data.sql:  npm run seed:users
// รันซ้ำได้: บัญชีที่มีอยู่แล้วจะข้าม ไม่แก้รหัสผ่าน
// DEMO เท่านั้น — รหัสผ่าน 123456 ตามข้อมูลจำลองเดิมในหน้าเว็บ

import { supabaseAdmin } from "../src/config/supabase.js";

const demoUsers = [
  { email: "pong@pawhome.test", name: "ปอง" },
  { email: "shelter@pawhome.test", name: "บ้านพักน้องจร" },
  { email: "mind@pawhome.test", name: "มายด์" },
];

let failed = false;
for (const { email, name } of demoUsers) {
  const { error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: "123456",
    email_confirm: true,
    user_metadata: { name },
  });
  if (!error) console.log(`created  ${email}`);
  else if (error.code === "email_exists" || error.code === "user_already_exists") console.log(`exists   ${email}`);
  else {
    failed = true;
    console.error(`failed   ${email}: ${error.message}`);
  }
}
process.exit(failed ? 1 : 0);
