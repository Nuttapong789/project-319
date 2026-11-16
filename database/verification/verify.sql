-- =========================================================
-- PawHome — ตรวจฐานข้อมูล (รันหลัง schema.sql + mock-data.sql)
-- อ่านอย่างเดียว: การทดสอบ RLS ที่ต้องลองเขียน จะ rollback ตัวเองทุกครั้ง
-- ผลลัพธ์เป็นตารางเดียว ทุกแถวต้อง ok = true
-- จำนวนแถว (data counts) คาดหวังตามข้อมูลจำลองบนฐานข้อมูลที่เพิ่ง seed ถ้าใช้งานจริงแล้วจำนวนจะเปลี่ยน
-- =========================================================

drop table if exists pg_temp.rls_results;
create temp table rls_results (check_name text, expected text, actual text);

-- ---------- ทดสอบ RLS โดยสวมบทเป็น anon / ผู้ใช้ "มายด์" ----------
do $$
declare
  v_mind    uuid := (select id from auth.users where email = 'mind@pawhome.test');
  v_shelter uuid := (select id from auth.users where email = 'shelter@pawhome.test');
  anon_pets int; anon_adoptions int; anon_favorites int;
  mind_adoptions int; mind_favorites int; mind_update_other int;
  mind_fav_other text; mind_fav_self text; mind_req_adopted text;
begin
  -- anon (ไม่ล็อกอิน)
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  execute 'set local role anon';
  select count(*) into anon_pets from public.pets;
  select count(*) into anon_adoptions from public.adoption_requests;
  begin
    select count(*) into anon_favorites from public.favorites;
  exception when insufficient_privilege then anon_favorites := 0;
  end;
  execute 'reset role';

  -- authenticated = มายด์
  perform set_config('request.jwt.claims', json_build_object('sub', v_mind, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into mind_adoptions from public.adoption_requests;
  select count(*) into mind_favorites from public.favorites;

  begin -- แก้โพสต์ของคนอื่น → ต้องไม่เจอแถว
    update public.pets set name = name where owner_id = v_shelter;
    get diagnostics mind_update_other = row_count;
    raise exception 'rollback';
  exception when raise_exception then null;
  end;

  begin -- เพิ่ม favorite ในชื่อคนอื่น → ต้องโดนบล็อก
    insert into public.favorites (user_id, pet_id) values (v_shelter, 2);
    mind_fav_other := 'allowed';
    raise exception 'rollback';
  exception
    when insufficient_privilege then mind_fav_other := coalesce(mind_fav_other, 'blocked');
    when raise_exception then null;
  end;

  begin -- เพิ่ม favorite ของตัวเอง → ต้องทำได้
    insert into public.favorites (user_id, pet_id) values (v_mind, 2);
    mind_fav_self := 'allowed';
    raise exception 'rollback';
  exception
    when insufficient_privilege then mind_fav_self := 'blocked';
    when raise_exception then null;
  end;
  begin -- ยื่นขอน้องที่ได้บ้านแล้ว (ไข่ตุ๋น id 6) ผ่าน REST ตรง → ต้องโดนบล็อก
    insert into public.adoption_requests (pet_id, user_id, phone, housing, message)
    values (6, v_mind, '0800000000', 'HOUSE', 'ทดสอบสิทธิ์ ไม่ควรบันทึกได้');
    mind_req_adopted := 'allowed';
    raise exception 'rollback';
  exception
    when insufficient_privilege then mind_req_adopted := coalesce(mind_req_adopted, 'blocked');
    when raise_exception then null;
  end;
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);

  insert into rls_results values
    ('rls: anon อ่าน pets ได้ทุกตัว',               (select count(*) from public.pets)::text, anon_pets::text),
    ('rls: anon อ่าน adoption_requests ไม่ได้',      '0', anon_adoptions::text),
    ('rls: anon อ่าน favorites ไม่ได้',              '0', anon_favorites::text),
    ('rls: มายด์เห็นคำขอเฉพาะของตัวเอง',            (select count(*) from public.adoption_requests where user_id = v_mind)::text, mind_adoptions::text),
    ('rls: มายด์เห็น favorites เฉพาะของตัวเอง',     (select count(*) from public.favorites where user_id = v_mind)::text, mind_favorites::text),
    ('rls: มายด์แก้โพสต์ของคนอื่นไม่ได้',           '0', mind_update_other::text),
    ('rls: มายด์เพิ่ม favorite ในชื่อคนอื่นไม่ได้', 'blocked', mind_fav_other),
    ('rls: มายด์เพิ่ม favorite ของตัวเองได้',       'allowed', mind_fav_self),
    ('rls: ยื่นขอน้องที่ได้บ้านแล้วไม่ได้',         'blocked', mind_req_adopted),
    ('security: anon เรียก handle_new_user ไม่ได้', 'false',
      has_function_privilege('anon', 'public.handle_new_user()', 'execute')::text);
exception when others then
  execute 'reset role';
  raise;
end;
$$;

-- ---------- ผลรวม ----------
with checks (check_name, expected, actual) as (
  -- ตาราง
  select 'table exists: ' || t, 'yes',
         case when to_regclass('public.' || t) is null then 'no' else 'yes' end
  from unnest(array['profiles', 'pets', 'favorites', 'adoption_requests']) as t

  -- คอลัมน์
  union all
  select 'columns: ' || e.tbl, e.cols,
         coalesce((select string_agg(column_name, ',' order by column_name)
                   from information_schema.columns
                   where table_schema = 'public' and table_name = e.tbl), '')
  from (values
    ('profiles',          'created_at,id,name,updated_at'),
    ('pets',              'age_months,breed,created_at,description,id,image_url,name,owner_id,province,sex,species,status,sterilized,updated_at,urgent,vaccinated'),
    ('favorites',         'created_at,pet_id,user_id'),
    ('adoption_requests', 'created_at,housing,id,message,pet_id,phone,status,updated_at,user_id')
  ) as e (tbl, cols)

  -- Foreign keys
  union all
  select 'foreign keys (public)', '6',
         (select count(*) from information_schema.table_constraints
          where constraint_schema = 'public' and constraint_type = 'FOREIGN KEY'
            and table_name in ('profiles', 'pets', 'favorites', 'adoption_requests'))::text

  -- RLS
  union all
  select 'rls enabled: ' || c.relname, 'true', c.relrowsecurity::text
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname in ('profiles', 'pets', 'favorites', 'adoption_requests')
  union all
  select 'rls policies (public)', '11',
         (select count(*) from pg_policies where schemaname = 'public'
            and tablename in ('profiles', 'pets', 'favorites', 'adoption_requests'))::text
  union all
  select check_name, expected, actual from rls_results

  -- Trigger + Storage
  union all
  select 'trigger: on_auth_user_created', '1',
         (select count(*) from pg_trigger where tgname = 'on_auth_user_created')::text
  union all
  select 'storage bucket: pet-images (public)', 'true',
         coalesce((select public::text from storage.buckets where id = 'pet-images'), 'missing')

  -- จำนวนข้อมูลจำลอง
  union all select 'count: demo profiles', '3',
    (select count(*) from public.profiles p join auth.users u on u.id = p.id
     where u.email in ('pong@pawhome.test', 'shelter@pawhome.test', 'mind@pawhome.test'))::text
  union all select 'count: pets',              '12', (select count(*) from public.pets)::text
  union all select 'count: favorites',         '2',  (select count(*) from public.favorites)::text
  union all select 'count: adoption_requests', '2',  (select count(*) from public.adoption_requests)::text
  union all select 'count: pets AVAILABLE/PENDING/ADOPTED', '9/2/1',
    (select count(*) filter (where status = 'AVAILABLE') || '/' || count(*) filter (where status = 'PENDING')
            || '/' || count(*) filter (where status = 'ADOPTED') from public.pets)
  union all select 'count: urgent pets', '4', (select count(*) from public.pets where urgent)::text

  -- ความสัมพันธ์เสีย (FK ควรกันไว้แล้ว ตรวจซ้ำเผื่อ)
  union all select 'orphan: pets without profile', '0',
    (select count(*) from public.pets p left join public.profiles o on o.id = p.owner_id where o.id is null)::text
  union all select 'orphan: profiles without auth user', '0',
    (select count(*) from public.profiles p left join auth.users u on u.id = p.id where u.id is null)::text
  union all select 'orphan: favorites', '0',
    (select count(*) from public.favorites f
     left join public.pets p on p.id = f.pet_id left join public.profiles u on u.id = f.user_id
     where p.id is null or u.id is null)::text
  union all select 'orphan: adoption_requests', '0',
    (select count(*) from public.adoption_requests a
     left join public.pets p on p.id = a.pet_id left join public.profiles u on u.id = a.user_id
     where p.id is null or u.id is null)::text

  -- ข้อมูลซ้ำ / ไม่สอดคล้อง
  union all select 'duplicate: pets (owner + name)', '0',
    (select count(*) from (select 1 from public.pets group by owner_id, name having count(*) > 1) d)::text
  union all select 'duplicate: adoption (user + pet)', '0',
    (select count(*) from (select 1 from public.adoption_requests group by user_id, pet_id having count(*) > 1) d)::text
  union all select 'integrity: request on own pet', '0',
    (select count(*) from public.adoption_requests a join public.pets p on p.id = a.pet_id where a.user_id = p.owner_id)::text
  union all select 'integrity: pending request but pet AVAILABLE', '0',
    (select count(distinct p.id) from public.pets p join public.adoption_requests a on a.pet_id = p.id
     where a.status = 'PENDING' and p.status = 'AVAILABLE')::text
  union all select 'integrity: approved request but pet not ADOPTED', '0',
    (select count(*) from public.pets p join public.adoption_requests a on a.pet_id = p.id
     where a.status = 'APPROVED' and p.status <> 'ADOPTED')::text
  union all select 'identity: pets next id > max id', 'true',
    ((select last_value from public.pets_id_seq) >= (select coalesce(max(id), 0) from public.pets))::text
  union all select 'identity: adoption next id > max id', 'true',
    ((select last_value from public.adoption_requests_id_seq) >= (select coalesce(max(id), 0) from public.adoption_requests))::text
)
select check_name, expected, actual, expected = actual as ok
from checks
order by ok, check_name;
