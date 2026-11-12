-- Monthly repeat for items, and category names unique regardless of case.
--
-- Run this once in the Supabase SQL Editor. Running it twice is harmless.

-- 1. Allow 'monthly' next to 'daily' and 'weekly'.
alter table public.note_items drop constraint if exists note_items_recurrence_check;
alter table public.note_items add constraint note_items_recurrence_check
  check (recurrence in ('daily', 'weekly', 'monthly'));

-- 2. Completing a repeating item rolls it forward by its own step.
--    Monthly steps from the previous due date, so an item due on the 31st settles
--    on the 28th after its first February.
create or replace function public.note_items_before_write() returns trigger
language plpgsql set search_path = '' as $note_items_before_write$
declare
  step interval;
begin
  new.updated_at := now();

  if new.is_done and (tg_op = 'INSERT' or not old.is_done) then
    new.done_at := now();
    if new.recurrence is not null and new.due_at is not null then
      step := case new.recurrence
        when 'daily' then interval '1 day'
        when 'weekly' then interval '7 days'
        else interval '1 month' end;
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
end
$note_items_before_write$;

-- 3. "Pets" and "pets" are the same category. Skipped (with a notice) if an
--    account already holds such a pair: rename one of them, then run this again.
do $unique_category_names$
begin
  if exists (select 1 from public.categories group by user_id, lower(name) having count(*) > 1) then
    raise notice 'Skipped categories_user_lower_name_key: some names differ only by case.';
  else
    create unique index if not exists categories_user_lower_name_key
      on public.categories (user_id, lower(name));
  end if;
end
$unique_category_names$;
