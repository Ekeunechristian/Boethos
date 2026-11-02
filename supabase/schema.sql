-- Boēthos: cloud tables. Run once in your Supabase project (SQL editor → New query → Run).
-- Every table is owner-only: row-level security lets a signed-in user read and write their own rows and nothing else.
-- Additive and safe to re-run.

-- 1. Your whole app state, one private row, with a version for safe multi-device saving
create table if not exists public.app_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  doc        jsonb not null,
  version    integer not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.app_state enable row level security;
drop policy if exists "own state" on public.app_state;
create policy "own state" on public.app_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. The devices that may receive push reminders
create table if not exists public.push_subscriptions (
  endpoint   text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists "own subscriptions" on public.push_subscriptions;
create policy "own subscriptions" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3. Reminders worked out on your device: opaque keys, a category and a time. No names or notes.
create table if not exists public.reminder_queue (
  user_id  uuid not null references auth.users (id) on delete cascade,
  key      text not null,
  category text not null,
  send_at  timestamptz not null,
  sent_at  timestamptz,
  primary key (user_id, key)
);
create index if not exists reminder_queue_due on public.reminder_queue (send_at) where sent_at is null;
alter table public.reminder_queue enable row level security;
drop policy if exists "own reminders" on public.reminder_queue;
create policy "own reminders" on public.reminder_queue
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 4. Run the sender every 5 minutes (needs the pg_cron and pg_net extensions:
--    Database → Extensions → enable both). Replace the two placeholders first.
-- select cron.schedule('boethos-reminders', '*/5 * * * *', $$
--   select net.http_post(
--     url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/send-reminders',
--     headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer YOUR-CRON-SECRET'),
--     body := '{}'::jsonb);
-- $$);
