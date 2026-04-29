-- Program builder: trainers compose programs from AI routines, class types,
-- and 1-on-1 bookings. A "day" can now hold multiple sessions (session_index).
-- Idempotent — safe to re-run.

-- 1. program_sessions: typed refs + within-day ordering
alter table public.program_sessions
  add column if not exists session_index int not null default 0,
  add column if not exists ref_kind text check (ref_kind in ('routine','class_kind','trainer_1on1','custom')),
  add column if not exists routine_slug text,
  add column if not exists class_slug text,
  add column if not exists trainer_id_for_1on1 uuid references public.trainers(id) on delete set null;

-- Backfill: every existing row is a free-form "custom" session (no typed ref)
update public.program_sessions set ref_kind = 'custom' where ref_kind is null;

-- One row per (program, day, session-within-day)
create unique index if not exists uq_program_session_dayslot
  on public.program_sessions(program_id, day_index, session_index);

-- 2. program_completions: track HOW it was completed + back-links
alter table public.program_completions
  add column if not exists source text not null default 'manual'
    check (source in ('routine','class','trainer_1on1','manual')),
  add column if not exists class_booking_id uuid references public.bookings(id) on delete set null,
  add column if not exists trainer_booking_id uuid references public.trainer_bookings(id) on delete set null;

-- 3. programs: status (so trainers can archive), author_trainer_id
alter table public.programs
  add column if not exists status text not null default 'published'
    check (status in ('draft','published','archived')),
  add column if not exists author_trainer_id uuid references public.trainers(id) on delete set null;

-- 4. RLS: trainers can write their own programs and program_sessions.
--    (public read policies already exist from earlier migrations.)
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'programs' and policyname = 'programs_trainer_write') then
    create policy programs_trainer_write on public.programs for all
      using (exists (
        select 1 from public.trainers t
        where t.auth_user_id = auth.uid()
          and (t.id = trainer_id or t.id = author_trainer_id)
      ))
      with check (exists (
        select 1 from public.trainers t
        where t.auth_user_id = auth.uid()
          and (t.id = trainer_id or t.id = author_trainer_id)
      ));
  end if;

  if not exists (select 1 from pg_policies where tablename = 'program_sessions' and policyname = 'ps_trainer_write') then
    create policy ps_trainer_write on public.program_sessions for all
      using (exists (
        select 1 from public.programs p
        join public.trainers t on (t.id = p.trainer_id or t.id = p.author_trainer_id)
        where p.id = program_id and t.auth_user_id = auth.uid()
      ))
      with check (exists (
        select 1 from public.programs p
        join public.trainers t on (t.id = p.trainer_id or t.id = p.author_trainer_id)
        where p.id = program_id and t.auth_user_id = auth.uid()
      ));
  end if;
end $$;
