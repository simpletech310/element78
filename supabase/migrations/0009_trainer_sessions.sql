-- Phase 3 — trainer_sessions parent table for group video sessions.
-- A session is the "slot" (when, where, capacity, room URL); a trainer_booking
-- is one attendee's seat in that session. capacity=1 means private 1-on-1.
-- Idempotent.

create table if not exists public.trainer_sessions (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  mode text not null check (mode in ('video','in_person')),
  location_id uuid references public.locations(id) on delete set null,
  capacity int not null default 1 check (capacity >= 1),
  price_cents int not null default 0,
  status text not null default 'open'
    check (status in ('open','full','confirmed','cancelled','completed','no_show')),
  is_group boolean not null default false,
  title text,
  description text,
  routine_slug text,
  video_provider text,
  video_room_url text,
  video_room_name text,
  trainer_notes text,
  duration_actual_min int,
  rejected_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists idx_trainer_sessions_trainer
  on public.trainer_sessions(trainer_id, starts_at);
create index if not exists idx_trainer_sessions_status
  on public.trainer_sessions(status, starts_at);

-- Active session uniqueness: a trainer can't have two non-cancelled sessions
-- starting at the same instant.
create unique index if not exists idx_trainer_sessions_no_overlap
  on public.trainer_sessions(trainer_id, starts_at)
  where status in ('open','full','confirmed');

-- 2. Add session_id to trainer_bookings + an attendee uniqueness constraint.
alter table public.trainer_bookings
  add column if not exists session_id uuid references public.trainer_sessions(id) on delete cascade;

create index if not exists idx_trainer_bookings_session
  on public.trainer_bookings(session_id);

-- 3. Backfill: every existing trainer_booking gets its own private trainer_sessions row.
do $$
declare row record;
declare new_session_id uuid;
declare mapped_status text;
begin
  for row in
    select * from public.trainer_bookings where session_id is null
  loop
    mapped_status := case row.status
      when 'pending_trainer' then 'open'
      when 'confirmed' then 'confirmed'
      when 'completed' then 'completed'
      when 'cancelled' then 'cancelled'
      when 'rejected' then 'cancelled'
      when 'no_show' then 'no_show'
      else 'open'
    end;

    insert into public.trainer_sessions (
      trainer_id, starts_at, ends_at, mode, location_id,
      capacity, price_cents, status, is_group,
      routine_slug, video_provider, video_room_url, video_room_name,
      trainer_notes, duration_actual_min, rejected_reason,
      created_at, updated_at
    ) values (
      row.trainer_id, row.starts_at, row.ends_at, row.mode, row.location_id,
      1, row.price_cents, mapped_status, false,
      row.routine_slug, row.video_provider, row.video_room_url, row.video_room_name,
      row.trainer_notes, row.duration_actual_min, row.rejected_reason,
      coalesce(row.created_at, now()), coalesce(row.updated_at, now())
    )
    returning id into new_session_id;

    update public.trainer_bookings set session_id = new_session_id where id = row.id;
  end loop;
end $$;

-- 4. Drop the old "no two pending/confirmed bookings at the same start time"
--    index — the constraint now lives on trainer_sessions. Group sessions
--    legitimately have multiple bookings at the same start time.
drop index if exists public.idx_tb_no_overlap;

-- 5. Prevent the same user from double-booking a single session.
create unique index if not exists idx_trainer_bookings_one_per_user_per_session
  on public.trainer_bookings(session_id, user_id)
  where status in ('pending_trainer','confirmed');

-- 6. RLS for trainer_sessions: public read (so the booking page can show
--    available group sessions), trainer-only write.
alter table public.trainer_sessions enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='trainer_sessions' and policyname='ts_public_read') then
    create policy ts_public_read on public.trainer_sessions for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='trainer_sessions' and policyname='ts_trainer_write') then
    create policy ts_trainer_write on public.trainer_sessions for all
      using (exists (select 1 from public.trainers t where t.id = trainer_id and t.auth_user_id = auth.uid()))
      with check (exists (select 1 from public.trainers t where t.id = trainer_id and t.auth_user_id = auth.uid()));
  end if;
end $$;
