-- 0035_enrollment_last_opened.sql
-- Track when a member last visited a program detail page so the home hero
-- ("PICK UP WHERE YOU LEFT OFF") + the YOUR PROGRAMS rail can sort by recency
-- of attention rather than enrollment age. Bumped by the program page, not by
-- a trigger — we only want the timestamp updated for actual member visits.

alter table public.program_enrollments
  add column if not exists last_opened_at timestamptz;

create index if not exists idx_program_enrollments_user_last_opened
  on public.program_enrollments(user_id, last_opened_at desc nulls last);

-- Backfill: assume the most recent open was when they started, so existing
-- enrollments still rank reasonably until the next visit refreshes them.
update public.program_enrollments
   set last_opened_at = started_at
 where last_opened_at is null;
