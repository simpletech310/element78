-- Wave 3: notification prefs, program journal, class waitlist columns, FTS.
-- Idempotent.

------------------------------------------------------------------------------
-- 1. Notification preferences (one row per user)
------------------------------------------------------------------------------

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_booking_confirmations boolean not null default true,
  email_class_reminders boolean not null default true,
  email_program_announcements boolean not null default true,
  email_messages boolean not null default true,
  email_marketing boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='notification_preferences' and policyname='np_owner_rw') then
    create policy np_owner_rw on public.notification_preferences for all
      using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;

------------------------------------------------------------------------------
-- 2. Per-day program journal entries
------------------------------------------------------------------------------

create table if not exists public.program_journal_entries (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.program_enrollments(id) on delete cascade,
  session_id uuid not null references public.program_sessions(id) on delete cascade,
  body text not null check (length(body) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists idx_program_journal_pair
  on public.program_journal_entries(enrollment_id, session_id);

alter table public.program_journal_entries enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='program_journal_entries' and policyname='pj_owner_rw') then
    create policy pj_owner_rw on public.program_journal_entries for all
      using (
        exists (
          select 1 from public.program_enrollments e
          where e.id = program_journal_entries.enrollment_id
            and e.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from public.program_enrollments e
          where e.id = program_journal_entries.enrollment_id
            and e.user_id = auth.uid()
        )
      );
  end if;
end $$;

------------------------------------------------------------------------------
-- 3. Class waitlist (uses bookings; add columns)
------------------------------------------------------------------------------

alter table public.bookings
  add column if not exists waitlist_position int,
  add column if not exists waitlisted_at timestamptz;
create index if not exists idx_bookings_waitlist
  on public.bookings(class_id, waitlist_position)
  where status = 'waitlist';

------------------------------------------------------------------------------
-- 4. Full-text search — generated tsvectors + GIN indexes
------------------------------------------------------------------------------

-- Trainers: array_to_string isn't IMMUTABLE so we skip the specialties array
-- in the generated tsvector. Name+headline+bio carries the search load.
alter table public.trainers
  add column if not exists search_doc tsvector
  generated always as (
    to_tsvector('english',
      coalesce(name,'') || ' ' ||
      coalesce(headline,'') || ' ' ||
      coalesce(bio,''))
  ) stored;
create index if not exists idx_trainers_search on public.trainers using gin(search_doc);

alter table public.programs
  add column if not exists search_doc tsvector
  generated always as (
    to_tsvector('english',
      coalesce(name,'') || ' ' ||
      coalesce(subtitle,'') || ' ' ||
      coalesce(description,''))
  ) stored;
create index if not exists idx_programs_search on public.programs using gin(search_doc);

alter table public.classes
  add column if not exists search_doc tsvector
  generated always as (
    to_tsvector('english',
      coalesce(name,'') || ' ' ||
      coalesce(kind,'') || ' ' ||
      coalesce(summary,''))
  ) stored;
create index if not exists idx_classes_search on public.classes using gin(search_doc);
