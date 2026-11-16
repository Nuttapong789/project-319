-- =========================================================
-- PawHome — ข้อมูลจำลอง (DEMO เท่านั้น ห้ามรันบน Production)
-- ย้ายมาจาก frontend/src/api/mockPets.ts ครบทุกแถว: ผู้ใช้ 3 · น้อง 12 · รายการโปรด 2 · คำขอ 2
--
-- ลำดับ:
--   1) database/schema.sql
--   2) cd backend && npm run seed:users   ← สร้างบัญชีทดลองผ่าน Supabase Auth Admin API (รหัส 123456)
--   3) ไฟล์นี้
--   4) database/verification/verify.sql
--
-- รันซ้ำได้: ON CONFLICT DO NOTHING ไม่เขียนทับแถวที่มีอยู่แล้ว
-- id น้อง 1–12 และคำขอ 1–2 ตั้งตามต้นฉบับ (ลิงก์ /pets/3 ชี้น้องตัวเดิม) จึงต้องรันบนฐานข้อมูลว่าง
-- createdAt ต้นฉบับเป็น "ย้อนหลัง N ชั่วโมงจากตอนนี้" จึงใช้ now() - interval เพื่อให้ตัวกรอง 24 ชม. / 7 วัน / 30 วัน ได้ผลเหมือนเดิม ณ เวลาที่ seed
-- =========================================================

-- กันลืมขั้นตอนที่ 2: ต้องมีบัญชีทดลองครบ 3 บัญชีใน auth.users ก่อน
do $$
begin
  if (select count(*) from auth.users
      where email in ('pong@pawhome.test', 'shelter@pawhome.test', 'mind@pawhome.test')) < 3 then
    raise exception 'ยังไม่มีบัญชีทดลองครบ 3 บัญชี — รัน "cd backend && npm run seed:users" ก่อน';
  end if;
  -- กันรันบนฐานข้อมูลที่มีข้อมูลจริง: id 1–12 จะชน แล้ว favorites/คำขอจะผูกผิดตัว
  if exists (
    select 1 from public.pets p join auth.users u on u.id = p.owner_id where u.email not like '%@pawhome.test'
  ) or exists (
    select 1 from public.adoption_requests a join auth.users u on u.id = a.user_id where u.email not like '%@pawhome.test'
  ) then
    raise exception 'พบข้อมูลของผู้ใช้จริงในตาราง pets/adoption_requests — mock-data.sql ใช้กับฐานข้อมูล demo ที่ว่างเท่านั้น';
  end if;
end;
$$;

-- profiles ถูกสร้างโดย trigger on_auth_user_created แล้ว บรรทัดนี้กันกรณีสร้าง user ก่อนรัน schema.sql
insert into public.profiles (id, name)
select u.id, v.name
from (values
  ('pong@pawhome.test', 'ปอง'),
  ('shelter@pawhome.test', 'บ้านพักน้องจร'),
  ('mind@pawhome.test', 'มายด์')
) as v (email, name)
join auth.users u on u.email = v.email
on conflict (id) do nothing;

-- ---------- pets (12) ----------
insert into public.pets
  (id, owner_id, name, species, breed, age_months, sex, province, image_url, description,
   vaccinated, sterilized, urgent, status, created_at)
select v.id, u.id, v.name, v.species, v.breed, v.age_months, v.sex, v.province, v.image_url, v.description,
       v.vaccinated, v.sterilized, v.urgent, v.status, now() - make_interval(hours => v.hours_ago)
from (values
  (1,  'shelter@pawhome.test', 'ข้าวตัง',  'DOG', 'พันทาง',    24, 'MALE',   'กรุงเทพมหานคร', 'https://images.dog.ceo/breeds/mix/cheyenne2.jpg',               'ขี้อ้อน ชอบเดินเล่นตอนเย็น ขับถ่ายเป็นที่แล้ว',                     true,  true,  true,  'AVAILABLE', 5),
  (2,  'pong@pawhome.test',    'มะลิ',     'CAT', 'แมวไทย',    8,  'FEMALE', 'นนทบุรี',       'https://cdn2.thecatapi.com/images/3rK7HGo7r.jpg',               'ตัวเล็ก ปรับตัวเก่ง เลี้ยงในคอนโดได้',                               true,  false, false, 'AVAILABLE', 48),
  (3,  'shelter@pawhome.test', 'ถั่วแดง',  'DOG', 'ชิบะผสม',   48, 'MALE',   'เชียงใหม่',     'https://images.dog.ceo/breeds/shiba/shiba-13.jpg',              'นิ่ง ใจดี เข้ากับเด็กได้',                                            true,  true,  false, 'PENDING',   144),
  (4,  'pong@pawhome.test',    'ส้มโอ',    'CAT', 'แมวส้ม',    12, 'FEMALE', 'ขอนแก่น',       'https://cdn2.thecatapi.com/images/edr.jpg',                     'ชอบนอนตากแดด ไม่กลัวคน',                                             true,  true,  true,  'PENDING',   20),
  (5,  'shelter@pawhome.test', 'บราวนี่',  'DOG', 'พันทาง',    72, 'FEMALE', 'ชลบุรี',        'https://images.dog.ceo/breeds/mix/floki-the-chilean-mutt-6.jpg', 'สุนัขโตแล้ว นิ่ง ชอบนอน',                                            true,  true,  false, 'AVAILABLE', 288),
  (6,  'shelter@pawhome.test', 'ไข่ตุ๋น',  'CAT', 'แมวขาวมณี', 36, 'MALE',   'กรุงเทพมหานคร', 'https://cdn2.thecatapi.com/images/HDxfaNlLj.jpg',               'สงบ เคยอยู่กับแมวตัวอื่นมาก่อน',                                     true,  true,  false, 'ADOPTED',   600),
  (7,  'shelter@pawhome.test', 'ขนมปัง',   'DOG', 'พันทาง',    18, 'FEMALE', 'ปทุมธานี',      'https://images.dog.ceo/breeds/mix/rilo.jpg',                    'ร่าเริง ชอบเล่นลูกบอล เดินสายจูงได้แล้ว',                             true,  true,  false, 'AVAILABLE', 72),
  (8,  'shelter@pawhome.test', 'โอวัลติน', 'DOG', 'พันทาง',    10, 'MALE',   'ภูเก็ต',        'https://images.dog.ceo/breeds/mix/xeshabelka_(21).jpg',         'ถูกทิ้งไว้หน้าตลาด ตอนนี้ฝากเลี้ยงชั่วคราว ต้องการบ้านถาวรด่วน',     true,  false, true,  'AVAILABLE', 9),
  (9,  'shelter@pawhome.test', 'ลูกชิ้น',  'CAT', 'แมวบ้าน',   3,  'MALE',   'เชียงใหม่',     'https://cdn2.thecatapi.com/images/267.jpg',                     'ลูกแมวกำพร้า กินอาหารเม็ดเองได้แล้ว ขี้เล่นมาก',                     false, false, true,  'AVAILABLE', 30),
  (10, 'pong@pawhome.test',    'ส้มจี๊ด',  'CAT', 'แมวส้ม',    6,  'FEMALE', 'ชลบุรี',        'https://cdn2.thecatapi.com/images/MTY3NjI5MQ.jpg',              'ช่างประจบ ชอบนอนบนตัก ใช้กระบะทรายเป็นแล้ว',                         true,  false, false, 'AVAILABLE', 96),
  (11, 'shelter@pawhome.test', 'นมเย็น',   'CAT', 'แมวสามสี',  4,  'FEMALE', 'ขอนแก่น',       'https://cdn2.thecatapi.com/images/O-57OLhn7.jpg',               'ซนตามวัย เข้ากับแมวตัวอื่นได้ดี',                                    true,  false, false, 'AVAILABLE', 200),
  (12, 'shelter@pawhome.test', 'ดำดี',     'DOG', 'พันทาง',    30, 'MALE',   'นนทบุรี',       'https://images.dog.ceo/breeds/mix/xeshabelka_(33).jpg',         'เฝ้าบ้านเก่ง แต่ใจดีกับคนในบ้าน เหมาะกับบ้านที่มีลาน',              true,  true,  false, 'AVAILABLE', 400)
) as v (id, owner_email, name, species, breed, age_months, sex, province, image_url, description,
        vaccinated, sterilized, urgent, status, hours_ago)
join auth.users u on u.email = v.owner_email
on conflict (id) do nothing;

-- ---------- favorites (2): ปอง ♡ ข้าวตัง, บราวนี่ ----------
-- created_at ต่างกันเพื่อคงลำดับเดิม (กดล่าสุดอยู่บนสุด: บราวนี่ แล้วข้าวตัง)
insert into public.favorites (user_id, pet_id, created_at)
select u.id, v.pet_id, now() - make_interval(mins => v.mins_ago)
from (values (1, 2), (5, 1)) as v (pet_id, mins_ago)
join auth.users u on u.email = 'pong@pawhome.test'
on conflict (user_id, pet_id) do nothing;

-- ---------- adoption_requests (2) ----------
insert into public.adoption_requests (id, pet_id, user_id, phone, housing, message, status, created_at)
select v.id, v.pet_id, u.id, v.phone, v.housing, v.message, v.status, now() - make_interval(hours => v.hours_ago)
from (values
  (1, 3, 'pong@pawhome.test', '0812345678', 'HOUSE', 'บ้านมีสนามหญ้า มีคนอยู่บ้านตลอด เคยเลี้ยงสุนัขมาก่อนครับ', 'PENDING', 30),
  (2, 4, 'mind@pawhome.test', '0898765432', 'CONDO', 'คอนโดอนุญาตให้เลี้ยงแมว ติดมุ้งลวดระเบียงแล้วค่ะ',       'PENDING', 10)
) as v (id, pet_id, email, phone, housing, message, status, hours_ago)
join auth.users u on u.email = v.email
on conflict (id) do nothing;

-- ใส่ id เองแล้ว ต้องเลื่อนตัวนับ identity ไปต่อจาก id ล่าสุด ไม่งั้นโพสต์ใหม่จะชน id 1
select setval(pg_get_serial_sequence('public.pets', 'id'), (select coalesce(max(id), 1) from public.pets));
select setval(pg_get_serial_sequence('public.adoption_requests', 'id'), (select coalesce(max(id), 1) from public.adoption_requests));
