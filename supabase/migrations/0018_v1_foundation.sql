-- V1 foundation: Stripe Connect, subscriptions, waivers, GDPR, admin.
-- Lands all schema additions Wave 1 features depend on so individual feature
-- agents don't race each other inventing tables. Idempotent.

------------------------------------------------------------------------------
-- 1. Stripe Connect (coach payouts, 80/20 split)
------------------------------------------------------------------------------

alter table public.trainers
  add column if not exists stripe_account_id text,
  add column if not exists payout_status text not null default 'unverified'
    check (payout_status in ('unverified','pending','active','rejected','paused'));

create unique index if not exists idx_trainers_stripe_account_id
  on public.trainers(stripe_account_id) where stripe_account_id is not null;

-- Per-purchase split tracking. Generated when a purchase that funds a
-- coach is fulfilled (class booking, 1-on-1, etc.). NULL trainer_id means
-- platform-only revenue (subscriptions, shop, guest passes).
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  gross_cents int not null,
  platform_fee_cents int not null,
  trainer_cents int not null,
  stripe_transfer_id text,
  status text not null default 'pending'
    check (status in ('pending','sent','reversed','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_payouts_trainer on public.payouts(trainer_id, created_at desc);
create unique index if not exists idx_payouts_purchase on public.payouts(purchase_id);

-- Add fee tracking to purchases so /account/history can show "$50 → $40 to coach + $10 platform".
alter table public.purchases
  add column if not exists trainer_id uuid references public.trainers(id) on delete set null,
  add column if not exists platform_fee_cents int not null default 0;

------------------------------------------------------------------------------
-- 2. Subscriptions (3-tier: free/premium/elite — basic stays as a legacy alias)
------------------------------------------------------------------------------

create table if not exists public.subscription_plans (
  tier text primary key check (tier in ('free','basic','premium','elite')),
  stripe_product_id text,
  stripe_price_id text,
  price_cents int not null default 0,
  active boolean not null default true,
  display_name text not null,
  blurb text,
  features jsonb not null default '[]'::jsonb
);

-- Seed defaults — script-generated price IDs get patched in by
-- scripts/seed-stripe-products.mjs after Stripe products exist.
insert into public.subscription_plans (tier, price_cents, display_name, blurb, features)
values
  ('free',    0,     'Free',    'Browse coaches, Studio routines, the Wall.',
   '["Studio routines (limited)","Wall access","Browse classes & coaches"]'::jsonb),
  ('premium', 4900,  'Premium', 'Full Studio, classes, programs, 1 guest/month.',
   '["Full Studio access","Class booking","Programs","1 guest/month"]'::jsonb),
  ('elite',   12900, 'Elite',   '24-hour gym, unlimited guests, priority 1-on-1 booking.',
   '["Everything in Premium","24-hour gym access","Unlimited guests","Priority 1-on-1 booking"]'::jsonb)
on conflict (tier) do update set
  price_cents = excluded.price_cents,
  display_name = excluded.display_name,
  blurb = excluded.blurb,
  features = excluded.features;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tier text not null check (tier in ('free','basic','premium','elite')),
  stripe_subscription_id text unique,
  stripe_customer_id text,
  status text not null default 'incomplete'
    check (status in ('incomplete','trialing','active','past_due','canceled','paused')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_subscriptions_user on public.subscriptions(user_id);
create unique index if not exists idx_subscriptions_active_one_per_user
  on public.subscriptions(user_id) where status in ('active','trialing','past_due');

-- Open up `purchases.kind` so we can record subscription billing events too.
do $$ begin
  if exists (
    select 1 from pg_constraint where conname = 'purchases_kind_check'
  ) then
    alter table public.purchases drop constraint purchases_kind_check;
  end if;
end $$;
alter table public.purchases
  add constraint purchases_kind_check
    check (kind in ('class_booking','program_enrollment','trainer_booking','shop_order','guest_pass','subscription'));

------------------------------------------------------------------------------
-- 3. Waivers (PAR-Q + liability) + account deletion + GDPR
------------------------------------------------------------------------------

create table if not exists public.waivers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('parq','liability','minor')),
  signed_at timestamptz not null default now(),
  signature_text text not null,                 -- typed name acts as signature
  parq_answers jsonb,                           -- 7-question PAR-Q payload when kind='parq'
  ip_address text,
  user_agent text,
  expires_at timestamptz                         -- waivers can have a yearly refresh
);
-- One "live" waiver per (user, kind). Re-signing creates a new row and the
-- previous one is moved to expires_at = signed_at via the action layer.
create unique index if not exists idx_waivers_user_kind_active
  on public.waivers(user_id, kind)
  where expires_at is null;

alter table public.waivers enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='waivers' and policyname='waivers_owner_rw') then
    create policy waivers_owner_rw on public.waivers for all
      using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;

create table if not exists public.account_deletions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  requested_at timestamptz not null default now(),
  scheduled_for timestamptz not null,           -- 30-day grace window
  completed_at timestamptz,
  cancelled_at timestamptz,
  reason text
);
create unique index if not exists idx_account_deletions_active_one_per_user
  on public.account_deletions(user_id) where completed_at is null and cancelled_at is null;

------------------------------------------------------------------------------
-- 4. Admin role
------------------------------------------------------------------------------

alter table public.profiles
  add column if not exists is_admin boolean not null default false;
create index if not exists idx_profiles_is_admin
  on public.profiles(is_admin) where is_admin = true;

-- Audit log so we can see what an admin did and roll it back.
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id),
  action text not null,                          -- e.g. 'refund_purchase','ban_user','hide_post'
  target_type text,                              -- 'purchase'|'user'|'post'|'class' etc.
  target_id text,
  details jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_admin_audit_created on public.admin_audit_log(created_at desc);

-- Ban flag on profiles — admin sets this to lock a user out without deleting.
alter table public.profiles
  add column if not exists is_banned boolean not null default false,
  add column if not exists banned_reason text,
  add column if not exists banned_at timestamptz;
