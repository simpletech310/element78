-- Coach 1-on-1 default duration: bump from 45 → 60 minutes so the slot
-- generator emits hour-long blocks at half-hour increments (1:30 reserves
-- 1:30–2:30, next available start is 2:00 if free or 2:30 otherwise).
--
-- The slot generator (`src/lib/trainer-availability.ts`) keys off
-- `trainer_session_settings.duration_min` directly. Existing rows still on
-- the old default (45) are migrated up; coaches who explicitly customized
-- their duration are left alone.

alter table public.trainer_session_settings
  alter column duration_min set default 60;

update public.trainer_session_settings
  set duration_min = 60
  where duration_min = 45;
