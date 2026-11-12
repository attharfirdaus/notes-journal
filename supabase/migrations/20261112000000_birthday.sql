-- Optional birthday on the profile, used for the birthday greeting on Home.
--
-- Run this once in the Supabase SQL Editor. Running it twice is harmless.

alter table public.profiles add column if not exists birthday date;
grant update (birthday) on public.profiles to authenticated;
