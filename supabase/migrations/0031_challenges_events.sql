-- 0031_challenges_events.sql
-- Coach-driven Challenges (free-form checklists with leaderboards) and
-- Events (free RSVP or Stripe-ticketed gatherings tied to a gym).
-- Plugs into the existing `purchases` ledger so paid events flow through
-- the same checkout/refund pipeline as classes and programs.

-- =============================================================================
-- A1. challenges
-- =============================================================================
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  description text,
  hero_image text,
  author_trainer_id uuid references public.trainers(id) on delete set null,
  location_id uuid references public.locations(id) on delete set null,
  starts_at timestamptz not null,
  ends_at   timestamptz not null,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  enrollment_count int not null default 0,
  completion_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_challenges_status_starts on public.challenges(status, starts_at desc);
create index if not exists idx_challenges_ends on public.challenges(ends_at);

alter table public.challenges enable row level security;

drop policy if exists "public read published challenges" on public.challenges;
drop policy if exists "trainer insert own challenge"     on public.challenges;
drop policy if exists "trainer update own challenge"     on public.challenges;

create policy "public read published challenges" on public.challenges for select
  using (
    status = 'published'
    or exists (select 1 from public.trainers t where t.id = author_trainer_id and t.auth_user_id = auth.uid())
  );

create policy "trainer insert own challenge" on public.challenges for insert
  with check (
    exists (select 1 from public.trainers t where t.id = author_trainer_id and t.auth_user_id = auth.uid())
  );

create policy "trainer update own challenge" on public.challenges for update
  using (
    exists (select 1 from public.trainers t where t.id = author_trainer_id and t.auth_user_id = auth.uid())
  );

-- =============================================================================
-- A2. challenge_tasks (free-form checklist)
-- =============================================================================
create table if not exists public.challenge_tasks (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  sort_order int not null default 0,
  label text not null check (length(label) between 1 and 200),
  created_at timestamptz not null default now()
);
create index if not exists idx_challenge_tasks_chal on public.challenge_tasks(challenge_id, sort_order);

alter table public.challenge_tasks enable row level security;

drop policy if exists "public read tasks"      on public.challenge_tasks;
drop policy if exists "trainer write own tasks" on public.challenge_tasks;

create policy "public read tasks" on public.challenge_tasks for select using (true);

create policy "trainer write own tasks" on public.challenge_tasks for all using (
  exists (
    select 1 from public.challenges c
    join public.trainers t on t.id = c.author_trainer_id
    where c.id = challenge_id and t.auth_user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.challenges c
    join public.trainers t on t.id = c.author_trainer_id
    where c.id = challenge_id and t.auth_user_id = auth.uid()
  )
);

-- =============================================================================
-- A3. challenge_enrollments
-- =============================================================================
create table if not exists public.challenge_enrollments (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (challenge_id, user_id)
);
create index if not exists idx_chal_enroll_chal on public.challenge_enrollments(challenge_id, completed_at);
create index if not exists idx_chal_enroll_user on public.challenge_enrollments(user_id);

alter table public.challenge_enrollments enable row level security;

drop policy if exists "public read enrollments" on public.challenge_enrollments;
drop policy if exists "users join own"          on public.challenge_enrollments;
drop policy if exists "users leave own"         on public.challenge_enrollments;

create policy "public read enrollments" on public.challenge_enrollments for select using (true);
create policy "users join own"  on public.challenge_enrollments for insert with check (auth.uid() = user_id);
create policy "users leave own" on public.challenge_enrollments for delete using (auth.uid() = user_id);

-- =============================================================================
-- A4. challenge_task_completions
-- =============================================================================
create table if not exists public.challenge_task_completions (
  task_id uuid not null references public.challenge_tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (task_id, user_id)
);
create index if not exists idx_chal_taskcomp_user on public.challenge_task_completions(user_id, challenge_id);

alter table public.challenge_task_completions enable row level security;

drop policy if exists "public read completions" on public.challenge_task_completions;
drop policy if exists "users mark own"          on public.challenge_task_completions;
drop policy if exists "users unmark own"        on public.challenge_task_completions;

create policy "public read completions" on public.challenge_task_completions for select using (true);
create policy "users mark own"   on public.challenge_task_completions for insert with check (auth.uid() = user_id);
create policy "users unmark own" on public.challenge_task_completions for delete using (auth.uid() = user_id);

-- =============================================================================
-- A5. events
-- =============================================================================
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  description text,
  hero_image text,
  author_trainer_id uuid references public.trainers(id) on delete set null,
  location_id uuid not null references public.locations(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at   timestamptz,
  capacity int,
  price_cents int not null default 0,
  status text not null default 'draft'
    check (status in ('draft','published','cancelled','completed')),
  rsvp_count int not null default 0,
  paid_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_events_loc_starts    on public.events(location_id, starts_at);
create index if not exists idx_events_status_starts on public.events(status, starts_at);

alter table public.events enable row level security;

drop policy if exists "public read published events" on public.events;
drop policy if exists "trainer insert own event"     on public.events;
drop policy if exists "trainer update own event"     on public.events;

create policy "public read published events" on public.events for select
  using (
    status in ('published','completed')
    or exists (select 1 from public.trainers t where t.id = author_trainer_id and t.auth_user_id = auth.uid())
  );

create policy "trainer insert own event" on public.events for insert
  with check (
    exists (select 1 from public.trainers t where t.id = author_trainer_id and t.auth_user_id = auth.uid())
  );

create policy "trainer update own event" on public.events for update
  using (
    exists (select 1 from public.trainers t where t.id = author_trainer_id and t.auth_user_id = auth.uid())
  );

-- =============================================================================
-- A6. event_rsvps
-- =============================================================================
create table if not exists public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id  uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'rsvp'
    check (status in ('rsvp','pending_payment','paid','cancelled','attended','refunded')),
  purchase_id uuid references public.purchases(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);
create index if not exists idx_event_rsvps_event on public.event_rsvps(event_id, status);
create index if not exists idx_event_rsvps_user  on public.event_rsvps(user_id);

alter table public.event_rsvps enable row level security;

drop policy if exists "users read own rsvp"   on public.event_rsvps;
drop policy if exists "users insert own rsvp" on public.event_rsvps;
drop policy if exists "users update own rsvp" on public.event_rsvps;
drop policy if exists "users delete own rsvp" on public.event_rsvps;

create policy "users read own rsvp" on public.event_rsvps for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.events e
      join public.trainers t on t.id = e.author_trainer_id
      where e.id = event_id and t.auth_user_id = auth.uid()
    )
  );
create policy "users insert own rsvp" on public.event_rsvps for insert with check (auth.uid() = user_id);
create policy "users update own rsvp" on public.event_rsvps for update using (auth.uid() = user_id);
create policy "users delete own rsvp" on public.event_rsvps for delete using (auth.uid() = user_id);

-- =============================================================================
-- A7. purchases extension (event_ticket kind + event_id link)
-- =============================================================================
alter table public.purchases
  add column if not exists event_id uuid references public.events(id) on delete set null,
  add column if not exists event_rsvp_id uuid references public.event_rsvps(id) on delete set null;

do $$ begin
  if exists (select 1 from pg_constraint where conname = 'purchases_kind_check') then
    alter table public.purchases drop constraint purchases_kind_check;
  end if;
end $$;
alter table public.purchases
  add constraint purchases_kind_check
    check (kind in ('class_booking','program_enrollment','trainer_booking','shop_order','guest_pass','subscription','event_ticket'));

-- =============================================================================
-- A8. Counter triggers + auto-complete
-- =============================================================================

-- challenge_enrollments → challenges.enrollment_count
create or replace function public.bump_challenge_enrollment_count() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.challenges set enrollment_count = enrollment_count + 1 where id = new.challenge_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.challenges set enrollment_count = greatest(0, enrollment_count - 1) where id = old.challenge_id;
    return old;
  end if;
  return null;
end $$;
drop trigger if exists trg_chal_enroll_count on public.challenge_enrollments;
create trigger trg_chal_enroll_count
  after insert or delete on public.challenge_enrollments
  for each row execute function public.bump_challenge_enrollment_count();

-- challenge_enrollments.completed_at transitions → challenges.completion_count
create or replace function public.bump_challenge_completion_count() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    if old.completed_at is null and new.completed_at is not null then
      update public.challenges set completion_count = completion_count + 1 where id = new.challenge_id;
    elsif old.completed_at is not null and new.completed_at is null then
      update public.challenges set completion_count = greatest(0, completion_count - 1) where id = new.challenge_id;
    end if;
  end if;
  return null;
end $$;
drop trigger if exists trg_chal_completion_count on public.challenge_enrollments;
create trigger trg_chal_completion_count
  after update on public.challenge_enrollments
  for each row execute function public.bump_challenge_completion_count();

-- event_rsvps → events.rsvp_count + paid_count
create or replace function public.bump_event_rsvp_counts() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.events set rsvp_count = rsvp_count + 1 where id = new.event_id;
    if new.status = 'paid' then
      update public.events set paid_count = paid_count + 1 where id = new.event_id;
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    update public.events set rsvp_count = greatest(0, rsvp_count - 1) where id = old.event_id;
    if old.status = 'paid' then
      update public.events set paid_count = greatest(0, paid_count - 1) where id = old.event_id;
    end if;
    return old;
  elsif tg_op = 'UPDATE' then
    if old.status <> 'paid' and new.status = 'paid' then
      update public.events set paid_count = paid_count + 1 where id = new.event_id;
    elsif old.status = 'paid' and new.status <> 'paid' then
      update public.events set paid_count = greatest(0, paid_count - 1) where id = new.event_id;
    end if;
  end if;
  return null;
end $$;
drop trigger if exists trg_event_rsvp_counts on public.event_rsvps;
create trigger trg_event_rsvp_counts
  after insert or update or delete on public.event_rsvps
  for each row execute function public.bump_event_rsvp_counts();

-- challenge_task_completions → maybe set/unset enrollment.completed_at
create or replace function public.maybe_complete_challenge_enrollment() returns trigger
language plpgsql as $$
declare
  total_tasks int;
  done_tasks int;
begin
  select count(*) into total_tasks from public.challenge_tasks where challenge_id = new.challenge_id;
  select count(*) into done_tasks  from public.challenge_task_completions
    where challenge_id = new.challenge_id and user_id = new.user_id;
  if total_tasks > 0 and done_tasks >= total_tasks then
    update public.challenge_enrollments
       set completed_at = coalesce(completed_at, now())
     where challenge_id = new.challenge_id and user_id = new.user_id;
  end if;
  return new;
end $$;
drop trigger if exists trg_chal_taskcomp_finish on public.challenge_task_completions;
create trigger trg_chal_taskcomp_finish
  after insert on public.challenge_task_completions
  for each row execute function public.maybe_complete_challenge_enrollment();

create or replace function public.maybe_uncomplete_challenge_enrollment() returns trigger
language plpgsql as $$
begin
  update public.challenge_enrollments
     set completed_at = null
   where challenge_id = old.challenge_id and user_id = old.user_id and completed_at is not null;
  return old;
end $$;
drop trigger if exists trg_chal_taskcomp_unfinish on public.challenge_task_completions;
create trigger trg_chal_taskcomp_unfinish
  after delete on public.challenge_task_completions
  for each row execute function public.maybe_uncomplete_challenge_enrollment();
