-- Tuckbury — reminder scheduler (run AFTER the app is deployed to Vercel).
--
-- Every minute pg_cron calls /api/cron/reminders on your deployment, which turns
-- due reminders into in-app notifications and Web Push messages.
--
-- 1) Replace the two placeholder values below, then run this whole file once in
--    Supabase Dashboard → SQL Editor.
-- 2) To change them later, run the vault.update_secret(...) lines at the bottom.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Secrets live in Supabase Vault instead of the job definition.
select vault.create_secret('https://YOUR-APP.vercel.app', 'tuckbury_app_url');
select vault.create_secret('PASTE-THE-SAME-CRON_SECRET-AS-IN-VERCEL', 'tuckbury_cron_secret');

select cron.schedule(
  'tuckbury-reminders',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'tuckbury_app_url') || '/api/cron/reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'tuckbury_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  );
  $$
);

-- Useful afterwards:
--   select * from cron.job;                                   -- is it scheduled?
--   select * from cron.job_run_details order by start_time desc limit 10;
--   select * from net._http_response order by created desc limit 10;  -- HTTP results
--   select cron.unschedule('tuckbury-reminders');             -- stop it
--   select vault.update_secret(
--     (select id from vault.secrets where name = 'tuckbury_app_url'), 'https://new-url.vercel.app');
