-- Replace the stored emoji on notes and categories with icon keys.
--
-- Run this once in the Supabase SQL Editor, after the initial schema. It renames
-- the columns, converts the emoji that were already saved, and drops the emoji
-- from the notification titles the reminder job writes.
--
-- Every step checks its own state first, so running the file twice is harmless.

-- 1. The columns. The length checks that came with them are renamed too, so no
--    constraint is left carrying the old name.
do $rename_icon_columns$
begin
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'notes' and column_name = 'emoji') then
    alter table public.notes rename column emoji to icon;
  end if;
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'categories' and column_name = 'emoji') then
    alter table public.categories rename column emoji to icon;
  end if;
  if exists (select 1 from pg_constraint
              where conrelid = 'public.notes'::regclass and conname = 'notes_emoji_check') then
    alter table public.notes rename constraint notes_emoji_check to notes_icon_length;
  end if;
  if exists (select 1 from pg_constraint
              where conrelid = 'public.categories'::regclass and conname = 'categories_emoji_check') then
    alter table public.categories rename constraint categories_emoji_check to categories_icon_length;
  end if;
end
$rename_icon_columns$;

-- 2. The values that are already stored. Keys must match src/lib/icons.tsx, and
--    the filter skips rows that hold an icon key already.
update public.notes set icon = case icon
  when '📝' then 'note'          when '🛒' then 'shopping-cart'  when '✅' then 'check'
  when '📅' then 'calendar'      when '📚' then 'book'           when '💼' then 'briefcase'
  when '💡' then 'idea'          when '🎉' then 'party'          when '✈️' then 'plane'
  when '💰' then 'wallet'        when '💪' then 'dumbbell'       when '🌱' then 'sprout'
  when '🍳' then 'chef'          when '🎁' then 'gift'           when '🏠' then 'house'
  when '🎮' then 'gamepad'       when '🎵' then 'music'          when '🎨' then 'palette'
  when '🐶' then 'dog'           when '🧺' then 'laundry'        when '💊' then 'pill'
  when '🧳' then 'luggage'       when '🎓' then 'graduation'     when '⭐' then 'star'
  when '❤️' then 'heart'         when '🔥' then 'flame'          when '🌈' then 'rainbow'
  when '🍀' then 'clover'        when '☕' then 'coffee'         when '🚗' then 'car'
  when '📦' then 'package'       when '🧠' then 'brain'          when '🏷️' then 'tag'
  when '🍔' then 'salad'         when '🐾' then 'dog'            when '🧘' then 'activity'
  when '🎬' then 'clapper'       when '⚽' then 'trophy'         when '👶' then 'baby'
  when '🧹' then 'house'         when '🔧' then 'wrench'         when '💻' then 'laptop'
  else 'note' end
 where icon !~ '^[a-z][a-z0-9-]{0,30}$';

update public.categories set icon = case icon
  when '🏷️' then 'tag'           when '🛒' then 'shopping-cart'  when '✅' then 'check'
  when '💼' then 'briefcase'     when '📚' then 'book'           when '🎉' then 'party'
  when '💪' then 'dumbbell'      when '💰' then 'wallet'         when '💡' then 'idea'
  when '✈️' then 'plane'         when '🌱' then 'sprout'         when '📝' then 'note'
  when '📅' then 'calendar'      when '🏠' then 'house'          when '🎨' then 'palette'
  when '🎵' then 'music'         when '🎮' then 'gamepad'        when '🍳' then 'chef'
  when '💊' then 'pill'          when '🚗' then 'car'            when '📦' then 'package'
  when '🧠' then 'brain'         when '⭐' then 'star'           when '❤️' then 'heart'
  else 'tag' end
 where icon !~ '^[a-z][a-z0-9-]{0,30}$';

-- 3. Defaults and shape. Icon keys are ascii slugs, so the column can be tight.
alter table public.notes alter column icon set default 'note';
alter table public.categories alter column icon set default 'tag';

alter table public.notes drop constraint if exists notes_icon_key;
alter table public.categories drop constraint if exists categories_icon_key;
alter table public.notes add constraint notes_icon_key check (icon ~ '^[a-z][a-z0-9-]{0,30}$');
alter table public.categories add constraint categories_icon_key check (icon ~ '^[a-z][a-z0-9-]{0,30}$');

grant update (icon) on public.notes to authenticated;
grant update (icon) on public.categories to authenticated;

-- 4. Seed new accounts with icon keys instead of emoji.
create or replace function public.handle_new_user() returns trigger as $handle_new_user$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(left(new.raw_user_meta_data ->> 'display_name', 40), ''));

  insert into public.streak_state (user_id) values (new.id);

  insert into public.categories (user_id, name, icon, color, keywords, is_default) values
  (new.id, 'Shopping', 'shopping-cart', '#FCA5A5', '{buy,shop,shopping,grocery,groceries,market,supermarket,milk,eggs,bread,rice,sugar,coffee,snack,snacks,fruit,vegetables,soap,shampoo,toothpaste,detergent,tissue,order,checkout,cart,mall,store,belanja,beli,pasar,sayur,buah,beras,telur,susu,minyak,sabun,gula,kopi,indomaret,alfamart,tokopedia,shopee}', true),
  (new.id, 'Tasks', 'check', '#86EFAC', '{todo,task,tasks,finish,complete,submit,deadline,fix,send,email,reply,call,prepare,review,update,clean,organize,tugas,kerjakan,selesaikan,kirim,beresin,deadline}', true),
  (new.id, 'Work', 'briefcase', '#93C5FD', '{work,office,meeting,client,project,report,presentation,slides,boss,manager,team,sprint,standup,jira,ticket,deploy,invoice,proposal,kantor,kerja,rapat,klien,proyek,laporan,presentasi,atasan}', true),
  (new.id, 'Study', 'book', '#C4B5FD', '{study,class,lecture,homework,assignment,exam,quiz,thesis,paper,research,course,lab,campus,professor,lecturer,read,chapter,midterm,final,journal,kuliah,kelas,tugas kuliah,ujian,uts,uas,skripsi,tesis,dosen,kampus,belajar,makalah,praktikum}', true),
  (new.id, 'Events', 'party', '#FDBA74', '{event,party,birthday,wedding,concert,festival,trip,dinner,lunch,hangout,meetup,appointment,reunion,anniversary,ceremony,webinar,seminar,acara,ulang tahun,nikahan,pernikahan,konser,bukber,arisan,janji,nongkrong}', true),
  (new.id, 'Health', 'dumbbell', '#6EE7B7', '{health,gym,workout,exercise,run,running,jog,yoga,doctor,dentist,medicine,vitamin,pills,sleep,water,diet,checkup,hospital,clinic,therapy,olahraga,lari,dokter,obat,vitamin,tidur,minum air,rumah sakit,klinik,senam}', true),
  (new.id, 'Finance', 'wallet', '#FDE047', '{pay,bill,bills,rent,salary,budget,bank,transfer,tax,loan,debt,saving,savings,invest,investment,insurance,subscription,electricity,internet,bayar,tagihan,sewa,kos,gaji,tabungan,pajak,utang,cicilan,listrik,pulsa,asuransi}', true),
  (new.id, 'Ideas', 'idea', '#F9A8D4', '{idea,ideas,brainstorm,maybe,someday,inspiration,concept,plan,dream,write,blog,side project,startup,ide,gagasan,rencana,inspirasi,mimpi}', true),
  (new.id, 'Travel', 'plane', '#67E8F9', '{travel,trip,flight,hotel,booking,passport,visa,luggage,pack,packing,vacation,holiday,beach,mountain,itinerary,airport,ticket,train,liburan,jalan-jalan,mudik,tiket,pesawat,kereta,koper,penginapan,pantai,gunung}', true),
  (new.id, 'Personal', 'sprout', '#D9F99D', '{personal,family,mom,dad,friend,friends,home,house,self,hobby,journal,gift,call mom,laundry,cook,cooking,keluarga,ibu,ayah,teman,rumah,hobi,hadiah,masak,cuci baju}', true);

  return new;
end
$handle_new_user$ language plpgsql security definer set search_path = '';

-- 5. home_items() returned note_emoji; it now returns the icon key.
drop function if exists public.home_items();
create function public.home_items() returns table (
  id uuid, note_id uuid, note_title text, note_icon text, text text,
  due_at timestamptz, is_done boolean, bucket text
) as $home_items$
  with me as (
    select (now() at time zone coalesce(p.timezone, 'UTC'))::date as today, coalesce(p.timezone, 'UTC') as tz
      from public.profiles p where p.id = auth.uid()
  )
  select i.id, n.id, n.title, n.icon, i.text, i.due_at, i.is_done,
         case
           when i.due_at < now() then 'overdue'
           when (i.due_at at time zone me.tz)::date = me.today then 'today'
           else 'upcoming'
         end
    from public.note_items i
    join public.notes n on n.id = i.note_id
    cross join me
   where i.user_id = auth.uid()
     and i.due_at is not null
     and not i.is_done
     and n.status <> 'archived'
     and (i.due_at at time zone me.tz)::date <= me.today + 7
   order by i.due_at
   limit 50
$home_items$ language sql stable security invoker set search_path = '';

revoke execute on function public.home_items() from public, anon;
grant execute on function public.home_items() to authenticated;

-- 6. Notification titles carried emoji too; the UI draws the icon now.
create or replace function public._process_due(p_user uuid) returns int as $process_due$
declare
  created int := 0;
  n int;
begin
  with claimed as (
    update public.reminders r
       set status = 'sent'
     where r.id in (
       select id from public.reminders
        where status = 'pending' and fire_at <= now()
          and (p_user is null or user_id = p_user)
        for update skip locked)
    returning r.*
  )
  insert into public.notifications (user_id, kind, title, body, link)
  select c.user_id, 'reminder',
         left(i.text, 80),
         public.format_offset(c.offset_min) || ' · ' || n2.title,
         '/notes/' || n2.id
    from claimed c
    join public.note_items i on i.id = c.item_id
    join public.notes n2 on n2.id = i.note_id
   where not i.is_done
     and n2.status <> 'archived'
     and c.fire_at > now() - interval '1 day';
  get diagnostics n = row_count;
  created := created + n;

  with unlocked as (
    update public.time_capsules
       set notified = true
     where not notified and open_at <= now()
       and (p_user is null or user_id = p_user)
    returning user_id, title
  )
  insert into public.notifications (user_id, kind, title, body, link)
  select user_id, 'capsule', 'A time capsule is ready!',
         '"' || left(title, 60) || '" is waiting to be opened.', '/capsules'
    from unlocked;
  get diagnostics n = row_count;
  created := created + n;

  with nudged as (
    update public.profiles p
       set last_nudge_date = (now() at time zone p.timezone)::date
     where p.journal_nudge_time is not null
       and (p_user is null or p.id = p_user)
       and (now() at time zone p.timezone)::time >= p.journal_nudge_time
       and p.last_nudge_date is distinct from (now() at time zone p.timezone)::date
       and not exists (select 1 from public.journal_entries j
                        where j.user_id = p.id and j.entry_date = (now() at time zone p.timezone)::date)
    returning p.id, p.pet_name
  )
  insert into public.notifications (user_id, kind, title, body, link)
  select id, 'nudge', pet_name || ' is waiting for today''s story',
         'Take two minutes to jot down how your day went.', '/journal/today'
    from nudged;
  get diagnostics n = row_count;
  created := created + n;

  return created;
end
$process_due$ language plpgsql security definer set search_path = '';

revoke execute on function public._process_due(uuid) from public, anon, authenticated;
