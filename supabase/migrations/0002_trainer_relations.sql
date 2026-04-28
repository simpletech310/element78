-- Trainer relations: programs.trainer_id, trainers.is_ai/years/cert,
-- and a flows table so each trainer can have signature short-form sessions.
-- Idempotent — safe to run multiple times.

-- 1. programs.trainer_id (nullable; one trainer leads a program at a time)
alter table public.programs
  add column if not exists trainer_id uuid references public.trainers(id) on delete set null;

create index if not exists idx_programs_trainer_id on public.programs(trainer_id);

-- 2. trainers — AI marker + bio detail fields
alter table public.trainers
  add column if not exists is_ai boolean not null default false,
  add column if not exists years_experience int,
  add column if not exists cert text;

-- 3. flows table — short solo videos created by a trainer (or AI avatar)
create table if not exists public.flows (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  trainer_id uuid references public.trainers(id) on delete set null,
  duration_min int not null,
  intensity text,
  kind text,
  hero_image text,
  summary text,
  video_url text,
  sort_order int default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_flows_trainer_id on public.flows(trainer_id);

-- RLS: public read on flows (same as products/classes/trainers).
alter table public.flows enable row level security;

drop policy if exists "public read flows" on public.flows;
create policy "public read flows" on public.flows for select using (true);

-- Backfill recommendation (run separately, project-specific):
--   update public.programs set trainer_id = (select id from public.trainers where slug = 'kai-brooks') where slug = 'in-my-element';
--   update public.programs set trainer_id = (select id from public.trainers where slug = 'amara-jones') where slug = 'city-of-angels';
--   update public.programs set trainer_id = (select id from public.trainers where slug = 'tasha-wright') where slug = 'living-room-luxury';
