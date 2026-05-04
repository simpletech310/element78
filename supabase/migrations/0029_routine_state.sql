-- Coach-controlled routine playback. The parent trainer_sessions row owns
-- the live state (exercise index, set index, phase, when the phase started)
-- so 1-on-1 and group sessions share the same wire format. Members
-- subscribe to their session's row via Supabase realtime; the coach POSTs
-- updates through updateRoutineStateAction whenever they advance.
--
-- Shape stored in routine_state (jsonb):
--   {
--     "exerciseIdx": 0,
--     "setIdx": 0,
--     "phase": "ready" | "working" | "rest" | "done",
--     "phaseStartedAt": "<ISO timestamp>",
--     "updatedAt": "<ISO timestamp>"
--   }
-- Null = no live state (the routine is dormant or the session ended).

alter table public.trainer_sessions
  add column if not exists routine_state jsonb;

-- Add trainer_sessions to the realtime publication so member RoutinePlayer
-- instances can subscribe to row updates and mirror the coach's progress.
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'trainer_sessions'
  ) then
    alter publication supabase_realtime add table public.trainer_sessions;
  end if;
end $$;
