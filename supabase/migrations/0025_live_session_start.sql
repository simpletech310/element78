-- Live session "start" timestamp — when the coach hits START SESSION,
-- attendees with this booking row see an incoming-call alert in real time
-- and tap to join the Daily room. Once set, the value is immutable for the
-- life of the session (cleared on completion).
--
-- Lives on `trainer_bookings` so the per-attendee realtime subscription is a
-- single-table filter (user_id=eq.{me}). For groups, the coach's start
-- action fans out the same timestamp to every attendee's row.

alter table public.trainer_bookings
  add column if not exists live_started_at timestamptz;

alter table public.trainer_sessions
  add column if not exists live_started_at timestamptz;

create index if not exists idx_trainer_bookings_live_started
  on public.trainer_bookings (user_id, live_started_at)
  where live_started_at is not null;

-- Add trainer_bookings to realtime publication so members can subscribe to
-- their own row and react when the coach starts the call.
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'trainer_bookings'
  ) then
    alter publication supabase_realtime add table public.trainer_bookings;
  end if;
end $$;
