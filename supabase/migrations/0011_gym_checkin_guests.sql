-- Phase 4 — gym check-in + guest passes.
-- Idempotent.

-- 1. Membership tier on profiles. Drives whether the user can bring a guest
--    free or has to buy a guest pass. Tier-policy lives in src/lib/membership.ts.
alter table public.profiles
  add column if not exists membership_tier text not null default 'basic';

do $$
declare con_name text;
begin
  select conname into con_name
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%membership_tier%';
  if con_name is null then
    execute 'alter table public.profiles add constraint profiles_membership_tier_check check (membership_tier in (''free'',''basic'',''premium'',''elite''))';
  end if;
end $$;

-- 2. Gym check-in log. One row per visit. Source distinguishes self vs.
--    QR-scan-by-staff vs. staff-manual.
create table if not exists public.gym_check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  guest_id uuid,
  checked_in_at timestamptz not null default now(),
  checked_out_at timestamptz,
  source text not null default 'self' check (source in ('self','qr','staff','guest')),
  notes text
);

create index if not exists idx_gym_checkins_user
  on public.gym_check_ins(user_id, checked_in_at desc);

-- 3. Guests brought by a member. Waiver is signed in person at the gym desk;
--    we just collect contact info + visit date + (when needed) a paid pass.
create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  visit_date date,
  waiver_signed boolean not null default false,
  waiver_signed_at timestamptz,
  guest_pass_purchase_id uuid references public.purchases(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending','confirmed','checked_in','no_show','cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_guests_host
  on public.guests(host_user_id, created_at desc);

-- Now we can wire the gym_check_ins.guest_id FK once the table exists.
do $$ begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='gym_check_ins' and constraint_name='gym_check_ins_guest_id_fkey'
  ) then
    alter table public.gym_check_ins
      add constraint gym_check_ins_guest_id_fkey foreign key (guest_id)
      references public.guests(id) on delete set null;
  end if;
end $$;

-- 4. Extend purchases.kind to include 'guest_pass'.
do $$
declare con_name text;
begin
  select conname into con_name
    from pg_constraint
    where conrelid = 'public.purchases'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%kind%';
  if con_name is not null then
    execute format('alter table public.purchases drop constraint %I', con_name);
  end if;
end $$;

alter table public.purchases
  add constraint purchases_kind_check
  check (kind in ('class_booking','program_enrollment','trainer_booking','shop_order','guest_pass'));

alter table public.purchases
  add column if not exists guest_id uuid references public.guests(id) on delete set null;

create index if not exists idx_purchases_guest on public.purchases(guest_id) where guest_id is not null;

-- 5. RLS — every user sees only their own check-ins and guests.
alter table public.gym_check_ins enable row level security;
alter table public.guests enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='gym_check_ins' and policyname='gci_self_read') then
    create policy gci_self_read on public.gym_check_ins for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='gym_check_ins' and policyname='gci_self_insert') then
    create policy gci_self_insert on public.gym_check_ins for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='guests' and policyname='guests_self_read') then
    create policy guests_self_read on public.guests for select using (auth.uid() = host_user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='guests' and policyname='guests_self_insert') then
    create policy guests_self_insert on public.guests for insert with check (auth.uid() = host_user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='guests' and policyname='guests_self_update') then
    create policy guests_self_update on public.guests for update using (auth.uid() = host_user_id);
  end if;
end $$;
