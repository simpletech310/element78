-- In-app notification persistence. Stand-in for a real push/email/SMS
-- provider — the codebase doesn't have one configured yet, so we store
-- notifications in Postgres and surface them via realtime + a bell UI.
-- When Resend/Twilio/APNS are wired up, swap the body of
-- `insertNotificationRow` (src/lib/notifications.ts) to also dispatch
-- through the provider; the call sites are stable and pass enough context.
--
-- Schema:
--   id          uuid pk
--   user_id     uuid fk -> auth.users (recipient)
--   kind        text — short tag e.g. 'live_call', 'booking_decision'
--   title       text — short headline (e.g. "Live now: Coach K")
--   body        text not null — supporting line
--   action_url  text null — relative path the bell deep-links to
--   seen_at     timestamptz null — set by the owner when they read it
--   created_at  timestamptz default now()
--
-- RLS: owner can read/update (so they can mark seen). Inserts are done by
-- server actions via the service-role admin client (bypasses RLS), so we
-- do not grant insert to authenticated. Realtime publication so the app
-- can subscribe and surface a toast / red dot the instant a row lands.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  action_url text,
  seen_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_unseen
  on public.notifications (user_id, created_at desc)
  where seen_at is null;

create index if not exists idx_notifications_user_created
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications_self_read" on public.notifications;
create policy "notifications_self_read" on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists "notifications_self_update" on public.notifications;
create policy "notifications_self_update" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Inserts intentionally omitted — only the service-role admin client
-- (server actions) creates rows. This keeps notification authoring
-- centralized in src/lib/notifications.ts.

-- Add to realtime publication so the app can listen for new rows.
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
