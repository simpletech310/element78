-- Web push subscriptions. One row per (user, browser/device) — when a user
-- enables push, the browser hands us a PushSubscription object; we persist
-- it here so the server can fan out notifications to every device they've
-- opted in on. RLS is owner-write (members manage their own) and
-- service-role read (the send-from-server path uses the admin client).
--
-- Key columns:
--   endpoint      — unique URL the browser exposes for receiving pushes
--   p256dh        — public key (base64) used to encrypt the payload
--   auth          — auth secret (base64) for the encryption envelope
--   user_agent    — diagnostic only, helps the user identify which device
--   role          — 'member' | 'coach' so we can target the right install
--                    when both PWAs are installed by the same auth user
-- Unique on endpoint so a re-subscribe replaces (vs duplicates) a row.

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  role        text not null default 'member' check (role in ('member','coach')),
  last_seen_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='push_subscriptions' and policyname='push_self_rw') then
    create policy push_self_rw on public.push_subscriptions
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- Notification preferences (kind → channel toggles) so members can opt in /
-- out per category without touching the underlying subscription. Defaults
-- favor opt-in for live calls (the experience that needs the alert most),
-- opt-out for marketing-flavored kinds.
create table if not exists public.notification_preferences (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  push_live_call boolean not null default true,
  push_booking   boolean not null default true,
  push_payment   boolean not null default true,
  push_reminder  boolean not null default true,
  push_marketing boolean not null default false,
  updated_at     timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='notification_preferences' and policyname='np_self_rw') then
    create policy np_self_rw on public.notification_preferences
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
