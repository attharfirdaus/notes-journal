-- Tuckbury — initial schema
-- Every user-owned table has RLS enabled and is scoped to auth.uid().

-- ─────────────────────────────────────────────────────────────
-- Profiles
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  display_name       text not null default '' check (char_length(display_name) <= 40),
  timezone           text not null default 'UTC',
  theme              text not null default 'sunny'
                     check (theme in ('sunny', 'ocean', 'forest', 'candy', 'midnight')),
  color_mode         text not null default 'system' check (color_mode in ('light', 'dark', 'system')),
  vibe               text not null default 'bubbles'
                     check (vibe in ('none', 'bubbles', 'leaves', 'stars', 'rain')),
  reduce_motion      boolean not null default false,
  sound_effects      boolean not null default false,
  pet_name           text not null default 'Pip' check (char_length(pet_name) between 1 and 20),
  reminder_defaults  int[] not null default '{1440,60}',
  schedule_reminder  int not null default 30 check (schedule_reminder between 0 and 10080),
  journal_nudge_time time,
  last_nudge_date    date,
  onboarded          boolean not null default false,
  created_at         timestamptz not null default now(),
  constraint reminder_defaults_valid check (
    cardinality(reminder_defaults) <= 5
    and 0 <= all (reminder_defaults) and 20160 >= all (reminder_defaults)
  )
);

-- Reject unknown IANA time zones.
create function public.validate_timezone() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'Unknown time zone: %', new.timezone using errcode = '22023';
  end if;
  return new;
end $$;

create trigger profiles_validate_timezone
  before insert or update of timezone on public.profiles
  for each row execute function public.validate_timezone();

-- The user's current local date.
create function public.local_today(p_user uuid) returns date
language sql stable security definer set search_path = '' as $$
  select (now() at time zone coalesce(
    (select timezone from public.profiles where id = p_user), 'UTC'))::date
$$;

-- ─────────────────────────────────────────────────────────────
-- Categories
-- ─────────────────────────────────────────────────────────────
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 30),
  emoji      text not null default '🏷️' check (char_length(emoji) <= 16),
  color      text not null default '#A5B4FC' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  keywords   text[] not null default '{}' check (cardinality(keywords) <= 200),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, name),
  unique (id, user_id)
);

-- ─────────────────────────────────────────────────────────────
-- Notes & items
-- ─────────────────────────────────────────────────────────────
create table public.notes (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title             text not null check (char_length(btrim(title)) between 1 and 120),
  description       text not null default '' check (char_length(description) <= 2000),
  type              text not null default 'checklist'
                    check (type in ('checklist', 'tasks', 'schedule', 'free')),
  emoji             text not null default '📝' check (char_length(emoji) <= 16),
  color             text not null default '#FDE68A' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  status            text not null default 'active' check (status in ('active', 'completed', 'archived')),
  pinned            boolean not null default false,
  categories_locked boolean not null default false,
  completed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (id, user_id)
);
create index notes_user_updated_idx on public.notes (user_id, updated_at desc);

create table public.note_categories (
  note_id     uuid not null,
  category_id uuid not null,
  user_id     uuid not null default auth.uid(),
  source      text not null default 'manual' check (source in ('auto', 'manual')),
  primary key (note_id, category_id),
  foreign key (note_id, user_id) references public.notes (id, user_id) on delete cascade,
  foreign key (category_id, user_id) references public.categories (id, user_id) on delete cascade
);
create index note_categories_category_idx on public.note_categories (category_id);

create table public.note_items (
  id             uuid primary key default gen_random_uuid(),
  note_id        uuid not null,
  user_id        uuid not null default auth.uid(),
  text           text not null check (char_length(btrim(text)) between 1 and 500),
  is_done        boolean not null default false,
  done_at        timestamptz,
  position       double precision not null default 0,
  quantity       text check (char_length(quantity) <= 20),
  due_at         timestamptz,
  remind_offsets int[] check (
    remind_offsets is null or (
      cardinality(remind_offsets) <= 5
      and 0 <= all (remind_offsets) and 20160 >= all (remind_offsets))
  ),
  recurrence     text check (recurrence in ('daily', 'weekly')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  foreign key (note_id, user_id) references public.notes (id, user_id) on delete cascade
);
create index note_items_note_idx on public.note_items (note_id, position);
create index note_items_due_idx on public.note_items (user_id, due_at) where due_at is not null;
create index note_items_done_idx on public.note_items (user_id, done_at) where done_at is not null;

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger notes_touch before update on public.notes
  for each row execute function public.touch_updated_at();

-- Keep completed_at in sync with status.
create function public.notes_status_stamp() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'completed' and (tg_op = 'INSERT' or old.status is distinct from 'completed') then
    new.completed_at := now();
  elsif new.status <> 'completed' then
    new.completed_at := null;
  end if;
  return new;
end $$;

create trigger notes_status_stamp before insert or update of status on public.notes
  for each row execute function public.notes_status_stamp();

-- Item bookkeeping: done_at, recurring items roll forward instead of staying done.
create function public.note_items_before_write() returns trigger
language plpgsql set search_path = '' as $$
declare
  step interval;
begin
  new.updated_at := now();

  if new.is_done and (tg_op = 'INSERT' or not old.is_done) then
    new.done_at := now();
    if new.recurrence is not null and new.due_at is not null then
      step := case new.recurrence when 'daily' then interval '1 day' else interval '7 days' end;
      loop
        new.due_at := new.due_at + step;
        exit when new.due_at > now();
      end loop;
      new.is_done := false;
    end if;
  elsif not new.is_done and tg_op = 'UPDATE' and old.is_done then
    new.done_at := null;
  end if;

  return new;
end $$;

create trigger note_items_before_write before insert or update on public.note_items
  for each row execute function public.note_items_before_write();

-- A note whose items are all done becomes "completed"; un-checking reopens it.
create function public.refresh_note_status(p_note uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  total int;
  open_items int;
begin
  select count(*), count(*) filter (where not is_done)
    into total, open_items
    from public.note_items where note_id = p_note;

  -- Always touch the note so "recently updated" sorting reflects item edits.
  update public.notes
     set status = case
       when status = 'archived' then status
       when total > 0 and open_items = 0 then 'completed'
       else 'active' end
   where id = p_note;
end $$;
revoke execute on function public.refresh_note_status(uuid) from public, anon, authenticated;

create function public.note_items_after_write() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_note_status(old.note_id);
    return old;
  end if;
  perform public.refresh_note_status(new.note_id);
  return new;
end $$;

create trigger note_items_after_write after insert or delete or update of is_done on public.note_items
  for each row execute function public.note_items_after_write();

-- ─────────────────────────────────────────────────────────────
-- Reminders & notifications
-- ─────────────────────────────────────────────────────────────
create table public.reminders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  item_id    uuid not null references public.note_items (id) on delete cascade,
  fire_at    timestamptz not null,
  offset_min int not null,
  status     text not null default 'pending' check (status in ('pending', 'sent', 'cancelled')),
  created_at timestamptz not null default now()
);
create index reminders_pending_idx on public.reminders (fire_at) where status = 'pending';
create index reminders_item_idx on public.reminders (item_id);

-- (Re)build the pending reminders for one item.
create function public.sync_item_reminders() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  offsets int[];
  note_type text;
  inserted int := 0;
begin
  delete from public.reminders where item_id = new.id and status = 'pending';

  if new.due_at is null or new.is_done then
    return new;
  end if;

  select n.type into note_type from public.notes n where n.id = new.note_id;

  offsets := coalesce(
    new.remind_offsets,
    (select case when note_type = 'schedule' then array[p.schedule_reminder] else p.reminder_defaults end
       from public.profiles p where p.id = new.user_id),
    '{60}'
  );

  insert into public.reminders (user_id, item_id, fire_at, offset_min)
  select distinct new.user_id, new.id, new.due_at - make_interval(mins => o), o
    from unnest(offsets) as o
   where new.due_at - make_interval(mins => o) > now();
  get diagnostics inserted = row_count;

  -- Every configured reminder is already in the past but the deadline isn't: remind at due time.
  if inserted = 0 and new.due_at > now() then
    insert into public.reminders (user_id, item_id, fire_at, offset_min)
    values (new.user_id, new.id, new.due_at, 0);
  end if;

  return new;
end $$;

create trigger note_items_sync_reminders
  after insert or update of due_at, remind_offsets, is_done on public.note_items
  for each row execute function public.sync_item_reminders();

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('reminder', 'capsule', 'nudge', 'system')),
  title      text not null,
  body       text not null default '',
  link       text,
  read_at    timestamptz,
  pushed     boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unpushed_idx on public.notifications (created_at) where not pushed;

create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint   text not null unique check (endpoint ~ '^https://'),
  p256dh     text not null,
  auth       text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- ─────────────────────────────────────────────────────────────
-- Journal & streak
-- ─────────────────────────────────────────────────────────────
create table public.journal_entries (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_date        date not null,
  content           text not null default '' check (char_length(content) <= 20000),
  mood              smallint check (mood between 1 and 5),
  feelings          text[] not null default '{}' check (cardinality(feelings) <= 10),
  prompt            text check (char_length(prompt) <= 200),
  counts_for_streak boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, entry_date)
);

create function public.journal_before_write() returns trigger
language plpgsql set search_path = '' as $$
declare
  today date := public.local_today(new.user_id);
begin
  if new.entry_date > today then
    raise exception 'Cannot write a journal entry for a future date' using errcode = '22023';
  end if;
  new.updated_at := now();
  if tg_op = 'INSERT' then
    -- Only entries written on the day itself keep the streak alive.
    new.counts_for_streak := new.entry_date = today;
  else
    new.counts_for_streak := old.counts_for_streak;
    new.entry_date := old.entry_date;
  end if;
  return new;
end $$;

create trigger journal_before_write before insert or update on public.journal_entries
  for each row execute function public.journal_before_write();

create table public.streak_state (
  user_id           uuid primary key references auth.users (id) on delete cascade,
  freezes_available int not null default 0 check (freezes_available between 0 and 2),
  used_dates        date[] not null default '{}',
  last_award_date   date
);

-- ─────────────────────────────────────────────────────────────
-- Focus, capsules, encouragement history
-- ─────────────────────────────────────────────────────────────
create table public.focus_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id      uuid references public.note_items (id) on delete set null,
  started_at   timestamptz not null,
  duration_min int not null check (duration_min between 1 and 180),
  completed    boolean not null default true,
  created_at   timestamptz not null default now()
);
create index focus_sessions_user_idx on public.focus_sessions (user_id, started_at desc);

create table public.time_capsules (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title      text not null check (char_length(btrim(title)) between 1 and 80),
  content    text not null check (char_length(btrim(content)) between 1 and 10000),
  mood       smallint check (mood between 1 and 5),
  open_at    timestamptz not null,
  opened_at  timestamptz,
  notified   boolean not null default false,
  created_at timestamptz not null default now(),
  check (open_at >= created_at + interval '7 days')
);
create index time_capsules_open_idx on public.time_capsules (open_at) where not notified;

create table public.message_history (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  message_id text not null check (char_length(message_id) <= 40),
  shown_at   timestamptz not null default now()
);
create index message_history_user_idx on public.message_history (user_id, shown_at desc);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table public.profiles           enable row level security;
alter table public.categories         enable row level security;
alter table public.notes              enable row level security;
alter table public.note_categories    enable row level security;
alter table public.note_items         enable row level security;
alter table public.reminders          enable row level security;
alter table public.notifications      enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.journal_entries    enable row level security;
alter table public.streak_state       enable row level security;
alter table public.focus_sessions     enable row level security;
alter table public.time_capsules      enable row level security;
alter table public.message_history    enable row level security;

create policy "own profile read"   on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "own profile update" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "own rows" on public.categories for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.notes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.note_categories for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.note_items for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.push_subscriptions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.journal_entries for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.focus_sessions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own read" on public.reminders    for select to authenticated using (user_id = (select auth.uid()));
create policy "own read" on public.streak_state for select to authenticated using (user_id = (select auth.uid()));

create policy "own read"   on public.notifications for select to authenticated using (user_id = (select auth.uid()));
create policy "own update" on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own delete" on public.notifications for delete to authenticated using (user_id = (select auth.uid()));

create policy "own read"   on public.time_capsules for select to authenticated using (user_id = (select auth.uid()));
create policy "own insert" on public.time_capsules for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own delete" on public.time_capsules for delete to authenticated using (user_id = (select auth.uid()));

create policy "own read"   on public.message_history for select to authenticated using (user_id = (select auth.uid()));
create policy "own insert" on public.message_history for insert to authenticated with check (user_id = (select auth.uid()));

-- Column-level privileges on top of RLS.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, timezone, theme, color_mode, vibe, reduce_motion, sound_effects, pet_name,
              reminder_defaults, schedule_reminder, journal_nudge_time, onboarded)
  on public.profiles to authenticated;

revoke all on public.reminders, public.streak_state from anon, authenticated;
grant select on public.reminders, public.streak_state to authenticated;

revoke all on public.notifications from anon, authenticated;
grant select, delete on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

-- A capsule's content stays on the server until it unlocks (see open_capsule).
revoke all on public.time_capsules from anon, authenticated;
grant select (id, user_id, title, mood, open_at, opened_at, created_at) on public.time_capsules to authenticated;
grant insert (title, content, mood, open_at) on public.time_capsules to authenticated;
grant delete on public.time_capsules to authenticated;

revoke all on public.message_history from anon, authenticated;
grant select, insert (message_id) on public.message_history to authenticated;

revoke all on public.journal_entries from anon, authenticated;
grant select, delete on public.journal_entries to authenticated;
grant insert (entry_date, content, mood, feelings, prompt) on public.journal_entries to authenticated;
grant update (entry_date, content, mood, feelings, prompt) on public.journal_entries to authenticated;

revoke all on public.categories, public.notes, public.note_categories, public.note_items,
              public.push_subscriptions, public.focus_sessions from anon;

-- ─────────────────────────────────────────────────────────────
-- New user bootstrap
-- ─────────────────────────────────────────────────────────────
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(left(new.raw_user_meta_data ->> 'display_name', 40), ''));

  insert into public.streak_state (user_id) values (new.id);

  insert into public.categories (user_id, name, emoji, color, keywords, is_default) values
  (new.id, 'Shopping', '🛒', '#FCA5A5', '{buy,shop,shopping,grocery,groceries,market,supermarket,milk,eggs,bread,rice,sugar,coffee,snack,snacks,fruit,vegetables,soap,shampoo,toothpaste,detergent,tissue,order,checkout,cart,mall,store,belanja,beli,pasar,sayur,buah,beras,telur,susu,minyak,sabun,gula,kopi,indomaret,alfamart,tokopedia,shopee}', true),
  (new.id, 'Tasks', '✅', '#86EFAC', '{todo,task,tasks,finish,complete,submit,deadline,fix,send,email,reply,call,prepare,review,update,clean,organize,tugas,kerjakan,selesaikan,kirim,beresin,deadline}', true),
  (new.id, 'Work', '💼', '#93C5FD', '{work,office,meeting,client,project,report,presentation,slides,boss,manager,team,sprint,standup,jira,ticket,deploy,invoice,proposal,kantor,kerja,rapat,klien,proyek,laporan,presentasi,atasan}', true),
  (new.id, 'Study', '📚', '#C4B5FD', '{study,class,lecture,homework,assignment,exam,quiz,thesis,paper,research,course,lab,campus,professor,lecturer,read,chapter,midterm,final,journal,kuliah,kelas,tugas kuliah,ujian,uts,uas,skripsi,tesis,dosen,kampus,belajar,makalah,praktikum}', true),
  (new.id, 'Events', '🎉', '#FDBA74', '{event,party,birthday,wedding,concert,festival,trip,dinner,lunch,hangout,meetup,appointment,reunion,anniversary,ceremony,webinar,seminar,acara,ulang tahun,nikahan,pernikahan,konser,bukber,arisan,janji,nongkrong}', true),
  (new.id, 'Health', '💪', '#6EE7B7', '{health,gym,workout,exercise,run,running,jog,yoga,doctor,dentist,medicine,vitamin,pills,sleep,water,diet,checkup,hospital,clinic,therapy,olahraga,lari,dokter,obat,vitamin,tidur,minum air,rumah sakit,klinik,senam}', true),
  (new.id, 'Finance', '💰', '#FDE047', '{pay,bill,bills,rent,salary,budget,bank,transfer,tax,loan,debt,saving,savings,invest,investment,insurance,subscription,electricity,internet,bayar,tagihan,sewa,kos,gaji,tabungan,pajak,utang,cicilan,listrik,pulsa,asuransi}', true),
  (new.id, 'Ideas', '💡', '#F9A8D4', '{idea,ideas,brainstorm,maybe,someday,inspiration,concept,plan,dream,write,blog,side project,startup,ide,gagasan,rencana,inspirasi,mimpi}', true),
  (new.id, 'Travel', '✈️', '#67E8F9', '{travel,trip,flight,hotel,booking,passport,visa,luggage,pack,packing,vacation,holiday,beach,mountain,itinerary,airport,ticket,train,liburan,jalan-jalan,mudik,tiket,pesawat,kereta,koper,penginapan,pantai,gunung}', true),
  (new.id, 'Personal', '🌱', '#D9F99D', '{personal,family,mom,dad,friend,friends,home,house,self,hobby,journal,gift,call mom,laundry,cook,cooking,keluarga,ibu,ayah,teman,rumah,hobi,hadiah,masak,cuci baju}', true);

  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- RPC: streak (auto-uses a freeze for a single missed day)
-- ─────────────────────────────────────────────────────────────
create function public.get_streak() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  today date;
  st public.streak_state%rowtype;
  days date[];
  cur int := 0;
  longest int := 0;
  run int := 0;
  prev date;
  d date;
  anchor date;
  used_freeze boolean := false;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  today := public.local_today(uid);

  insert into public.streak_state (user_id) values (uid) on conflict do nothing;
  select * into st from public.streak_state where user_id = uid for update;

  -- Missed exactly yesterday, but the day before was active: spend a freeze.
  if st.freezes_available > 0
     and not exists (select 1 from public.journal_entries
                      where user_id = uid and counts_for_streak and entry_date = today - 1)
     and not ((today - 1) = any (st.used_dates))
     and (exists (select 1 from public.journal_entries
                   where user_id = uid and counts_for_streak and entry_date = today - 2)
          or (today - 2) = any (st.used_dates)) then
    update public.streak_state
       set freezes_available = freezes_available - 1,
           used_dates = array_append(used_dates, today - 1)
     where user_id = uid
    returning * into st;
    used_freeze := true;
  end if;

  select coalesce(array_agg(x order by x), '{}') into days from (
    select entry_date as x from public.journal_entries where user_id = uid and counts_for_streak
    union
    select unnest(st.used_dates)
  ) s;

  -- Longest run.
  foreach d in array days loop
    if prev is not null and d = prev + 1 then run := run + 1; else run := 1; end if;
    longest := greatest(longest, run);
    prev := d;
  end loop;

  -- Current run ends today (or yesterday, if today isn't written yet).
  anchor := case when today = any (days) then today when (today - 1) = any (days) then today - 1 end;
  if anchor is not null then
    d := anchor;
    while d = any (days) loop
      cur := cur + 1;
      d := d - 1;
    end loop;
  end if;

  -- Earn a freeze every 7 streak days (max 2 banked).
  if cur > 0 and cur % 7 = 0 and anchor = today and st.last_award_date is distinct from today then
    update public.streak_state
       set freezes_available = least(2, freezes_available + 1),
           last_award_date = today
     where user_id = uid
    returning * into st;
  end if;

  return jsonb_build_object(
    'current', cur,
    'longest', longest,
    'freezes', st.freezes_available,
    'wrote_today', today = any (days) and not (today = any (st.used_dates)),
    'used_freeze', used_freeze,
    'today', today
  );
end $$;

-- ─────────────────────────────────────────────────────────────
-- RPC: activity summary (drives the mascot)
-- ─────────────────────────────────────────────────────────────
create function public.get_activity_summary() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  tz text;
  today date;
  result jsonb;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  select coalesce(timezone, 'UTC') into tz from public.profiles where id = uid;
  today := (now() at time zone tz)::date;

  with active_days as (
    select entry_date as d from public.journal_entries where user_id = uid
    union
    select (done_at at time zone tz)::date from public.note_items where user_id = uid and done_at is not null
    union
    select (started_at at time zone tz)::date from public.focus_sessions where user_id = uid and completed
  )
  select jsonb_build_object(
    'total_active_days', (select count(*) from active_days),
    'last_active_day', (select max(d) from active_days),
    'tasks_done_today', (select count(*) from public.note_items
                          where user_id = uid and done_at is not null
                            and (done_at at time zone tz)::date = today),
    'overdue', (select count(*) from public.note_items i join public.notes n on n.id = i.note_id
                 where i.user_id = uid and not i.is_done and i.due_at < now() and n.status <> 'archived'),
    'focus_today', (select coalesce(sum(duration_min), 0) from public.focus_sessions
                     where user_id = uid and completed and (started_at at time zone tz)::date = today),
    'wrote_today', exists (select 1 from public.journal_entries where user_id = uid and entry_date = today),
    'last_mood', (select mood from public.journal_entries
                   where user_id = uid and mood is not null order by entry_date desc limit 1),
    'today', today
  ) into result;

  return result;
end $$;

-- ─────────────────────────────────────────────────────────────
-- RPC: home buckets (overdue / today / upcoming 7 days)
-- ─────────────────────────────────────────────────────────────
create function public.home_items() returns table (
  id uuid, note_id uuid, note_title text, note_emoji text, text text,
  due_at timestamptz, is_done boolean, bucket text
)
language sql stable security invoker set search_path = '' as $$
  with me as (
    select (now() at time zone coalesce(p.timezone, 'UTC'))::date as today, coalesce(p.timezone, 'UTC') as tz
      from public.profiles p where p.id = auth.uid()
  )
  select i.id, n.id, n.title, n.emoji, i.text, i.due_at, i.is_done,
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
$$;

-- ─────────────────────────────────────────────────────────────
-- RPC: time capsules
-- ─────────────────────────────────────────────────────────────
create function public.open_capsule(p_id uuid) returns table (id uuid, content text, opened_at timestamptz)
language plpgsql security definer set search_path = '' as $$
begin
  return query
  update public.time_capsules c
     set opened_at = coalesce(c.opened_at, now())
   where c.id = p_id
     and c.user_id = auth.uid()
     and c.open_at <= now()
  returning c.id, c.content, c.opened_at;
end $$;

-- ─────────────────────────────────────────────────────────────
-- Due-notification processing
-- ─────────────────────────────────────────────────────────────
create function public.format_offset(p_min int) returns text
language sql immutable set search_path = '' as $$
  select case
    when p_min = 0 then 'Due now'
    when p_min < 60 then 'Due in ' || p_min || ' min'
    when p_min < 1440 then 'Due in ' || round(p_min / 60.0)::int || ' h'
    when p_min < 2880 then 'Due tomorrow'
    else 'Due in ' || round(p_min / 1440.0)::int || ' days'
  end
$$;

-- p_user = null processes everyone (cron); otherwise only that user (in-app polling).
create function public._process_due(p_user uuid) returns int
language plpgsql security definer set search_path = '' as $$
declare
  created int := 0;
  n int;
begin
  -- 1. Item reminders
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
         '⏰ ' || left(i.text, 80),
         public.format_offset(c.offset_min) || ' · ' || n2.emoji || ' ' || n2.title,
         '/notes/' || n2.id
    from claimed c
    join public.note_items i on i.id = c.item_id
    join public.notes n2 on n2.id = i.note_id
   where not i.is_done
     and n2.status <> 'archived'
     and c.fire_at > now() - interval '1 day';
  get diagnostics n = row_count;
  created := created + n;

  -- 2. Time capsules that just unlocked
  with unlocked as (
    update public.time_capsules
       set notified = true
     where not notified and open_at <= now()
       and (p_user is null or user_id = p_user)
    returning user_id, title
  )
  insert into public.notifications (user_id, kind, title, body, link)
  select user_id, 'capsule', '🔓 A time capsule is ready!',
         '"' || left(title, 60) || '" is waiting to be opened.', '/capsules'
    from unlocked;
  get diagnostics n = row_count;
  created := created + n;

  -- 3. Daily journal nudge (once per local day, after the chosen time, if nothing written yet)
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
  select id, 'nudge', '📔 ' || pet_name || ' is waiting for today''s story',
         'Take two minutes to jot down how your day went.', '/journal/today'
    from nudged;
  get diagnostics n = row_count;
  created := created + n;

  return created;
end $$;
revoke execute on function public._process_due(uuid) from public, anon, authenticated;

create function public.process_my_due() returns int
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  return public._process_due(auth.uid());
end $$;
revoke execute on function public.process_my_due() from public, anon;
grant execute on function public.process_my_due() to authenticated;

-- Cron entry point: process everyone and hand back what still needs a push.
create function public.process_all_due() returns table (
  id uuid, user_id uuid, title text, body text, link text
)
language plpgsql security definer set search_path = '' as $$
begin
  perform public._process_due(null);
  return query
  update public.notifications nt
     set pushed = true
   where nt.id in (
     select x.id from public.notifications x
      where not x.pushed and x.created_at > now() - interval '1 hour'
      for update skip locked)
  returning nt.id, nt.user_id, nt.title, nt.body, nt.link;
end $$;
revoke execute on function public.process_all_due() from public, anon, authenticated;
grant execute on function public.process_all_due() to service_role;

-- Lock down helpers that are only meant for triggers.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.sync_item_reminders() from public, anon, authenticated;
revoke execute on function public.note_items_after_write() from public, anon, authenticated;
revoke execute on function public.local_today(uuid) from public, anon;
revoke execute on function public.get_streak() from public, anon;
revoke execute on function public.get_activity_summary() from public, anon;
revoke execute on function public.open_capsule(uuid) from public, anon;
revoke execute on function public.home_items() from public, anon;
grant execute on function public.local_today(uuid), public.get_streak(), public.get_activity_summary(),
  public.open_capsule(uuid), public.home_items() to authenticated;
