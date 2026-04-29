-- 1-on-1 trainer booking: availability rules, blocks, settings, bookings.
-- Idempotent — safe to run multiple times.

-- 1. Link a trainer row to an auth user so the trainer can sign in and see
--    their own dashboard. Nullable: most trainer rows won't have a login yet.
alter table public.trainers
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_trainers_auth_user_id on public.trainers(auth_user_id);

-- 2. Per-trainer 1-on-1 settings (fee, default slot length, modes accepted).
create table if not exists public.trainer_session_settings (
  trainer_id uuid primary key references public.trainers(id) on delete cascade,
  price_cents int not null default 7500,
  duration_min int not null default 45,
  modes text[] not null default '{video,in_person}',
  buffer_min int not null default 15,
  booking_window_days int not null default 14,
  in_person_location_id uuid references public.locations(id) on delete set null,
  bio_for_1on1 text,
  updated_at timestamptz not null default now()
);

-- 3. Recurring weekly availability rules (Monday 6pm-8pm video, etc.).
--    weekday: 0=Sunday … 6=Saturday. start/end in minutes from midnight (local
--    to the trainer's home location, but stored as wall-clock minutes — we'll
--    UTC-anchor when generating slots).
create table if not exists public.trainer_availability_rules (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_minute int not null check (start_minute between 0 and 1439),
  end_minute int not null check (end_minute between 1 and 1440),
  mode text not null check (mode in ('video','in_person','both')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (end_minute > start_minute)
);

create index if not exists idx_avail_rules_trainer on public.trainer_availability_rules(trainer_id, is_active);

-- 4. Manual time-off windows that override the recurring rules.
create table if not exists public.trainer_availability_blocks (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  check (ends_at > starts_at)
);

create index if not exists idx_avail_blocks_trainer on public.trainer_availability_blocks(trainer_id, starts_at);

-- 5. The booking row.
create table if not exists public.trainer_bookings (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  mode text not null check (mode in ('video','in_person')),
  location_id uuid references public.locations(id) on delete set null,
  status text not null default 'pending_trainer'
    check (status in ('pending_trainer','confirmed','rejected','cancelled','completed','no_show')),
  paid_status text not null default 'pending'
    check (paid_status in ('free','pending','paid','refunded')),
  price_cents int not null default 0,
  client_goals text,
  trainer_notes text,
  routine_slug text,
  video_provider text,
  video_room_url text,
  video_room_name text,
  duration_actual_min int,
  rejected_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists idx_tb_trainer_status on public.trainer_bookings(trainer_id, status, starts_at);
create index if not exists idx_tb_user on public.trainer_bookings(user_id, starts_at desc);

-- Prevent the same trainer from being double-booked at the same start time
-- while a booking is still active (pending or confirmed). Cancelled / rejected
-- / completed rows don't block the slot.
create unique index if not exists idx_tb_no_overlap
  on public.trainer_bookings(trainer_id, starts_at)
  where status in ('pending_trainer','confirmed');

-- 6. RLS
alter table public.trainer_session_settings enable row level security;
alter table public.trainer_availability_rules enable row level security;
alter table public.trainer_availability_blocks enable row level security;
alter table public.trainer_bookings enable row level security;

-- Settings + rules + blocks: public read so the booking UI can show
-- availability without auth. Writes restricted to the trainer.
drop policy if exists "tss_public_read" on public.trainer_session_settings;
create policy "tss_public_read" on public.trainer_session_settings for select using (true);
drop policy if exists "tss_trainer_write" on public.trainer_session_settings;
create policy "tss_trainer_write" on public.trainer_session_settings for all
  using (exists (select 1 from public.trainers t where t.id = trainer_id and t.auth_user_id = auth.uid()))
  with check (exists (select 1 from public.trainers t where t.id = trainer_id and t.auth_user_id = auth.uid()));

drop policy if exists "tar_public_read" on public.trainer_availability_rules;
create policy "tar_public_read" on public.trainer_availability_rules for select using (true);
drop policy if exists "tar_trainer_write" on public.trainer_availability_rules;
create policy "tar_trainer_write" on public.trainer_availability_rules for all
  using (exists (select 1 from public.trainers t where t.id = trainer_id and t.auth_user_id = auth.uid()))
  with check (exists (select 1 from public.trainers t where t.id = trainer_id and t.auth_user_id = auth.uid()));

drop policy if exists "tab_public_read" on public.trainer_availability_blocks;
create policy "tab_public_read" on public.trainer_availability_blocks for select using (true);
drop policy if exists "tab_trainer_write" on public.trainer_availability_blocks;
create policy "tab_trainer_write" on public.trainer_availability_blocks for all
  using (exists (select 1 from public.trainers t where t.id = trainer_id and t.auth_user_id = auth.uid()))
  with check (exists (select 1 from public.trainers t where t.id = trainer_id and t.auth_user_id = auth.uid()));

-- Bookings: client reads/writes own; trainer reads/updates their own.
drop policy if exists "tb_self_read" on public.trainer_bookings;
create policy "tb_self_read" on public.trainer_bookings for select using (auth.uid() = user_id);
drop policy if exists "tb_self_insert" on public.trainer_bookings;
create policy "tb_self_insert" on public.trainer_bookings for insert with check (auth.uid() = user_id);
drop policy if exists "tb_self_update" on public.trainer_bookings;
create policy "tb_self_update" on public.trainer_bookings for update using (auth.uid() = user_id);

drop policy if exists "tb_trainer_read" on public.trainer_bookings;
create policy "tb_trainer_read" on public.trainer_bookings for select using (
  exists (select 1 from public.trainers t where t.id = trainer_id and t.auth_user_id = auth.uid())
);
drop policy if exists "tb_trainer_update" on public.trainer_bookings;
create policy "tb_trainer_update" on public.trainer_bookings for update using (
  exists (select 1 from public.trainers t where t.id = trainer_id and t.auth_user_id = auth.uid())
);

-- 7. Seed default 1-on-1 settings for every existing human trainer so the
--    "BOOK 1-ON-1" button on their profile works the moment they create a
--    login + add availability rules.
insert into public.trainer_session_settings (trainer_id, price_cents, duration_min, modes)
select id, 7500, 45, '{video,in_person}'
from public.trainers
where coalesce(is_ai, false) = false
on conflict (trainer_id) do nothing;
