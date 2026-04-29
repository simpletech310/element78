-- Seed weekly availability + in-person location for the four human trainers
-- so the 1-on-1 booking flow has slots to render. Idempotent — only seeds
-- a trainer who has zero rules today; re-running won't duplicate.

do $$
declare
  amara uuid;
  jay   uuid;
  kai   uuid;
  tasha uuid;
  atl   uuid;
begin
  select id into amara from public.trainers where slug = 'amara-jones'  limit 1;
  select id into jay   from public.trainers where slug = 'jay-elias'    limit 1;
  select id into kai   from public.trainers where slug = 'kai-brooks'   limit 1;
  select id into tasha from public.trainers where slug = 'tasha-wright' limit 1;
  select id into atl   from public.locations where slug = 'atlanta-hq'  limit 1;

  -- Point in-person sessions at Atlanta HQ for every trainer that hasn't set
  -- a location yet. Settings rows already exist (migration 0005).
  update public.trainer_session_settings
    set in_person_location_id = atl
    where in_person_location_id is null
      and trainer_id in (amara, jay, kai, tasha);

  /* AMARA · strength + HIIT
     Weekday mornings on the floor, evenings on video.
     weekday: 0=Sun … 6=Sat
     minute = mins-from-midnight (e.g. 6:00 AM = 360, 7:30 PM = 1170) */
  if amara is not null
     and not exists (select 1 from public.trainer_availability_rules where trainer_id = amara) then
    insert into public.trainer_availability_rules (trainer_id, weekday, start_minute, end_minute, mode, is_active) values
      (amara, 1,  360,  540, 'in_person', true),  -- Mon 06:00–09:00 AM
      (amara, 3,  360,  540, 'in_person', true),  -- Wed 06:00–09:00 AM
      (amara, 5,  360,  540, 'in_person', true),  -- Fri 06:00–09:00 AM
      (amara, 2, 1050, 1170, 'video',     true),  -- Tue 17:30–19:30
      (amara, 4, 1050, 1170, 'video',     true);  -- Thu 17:30–19:30
  end if;

  /* JAY · heavy basics
     Lunchtime in-person Mon/Tue/Thu, Saturday morning open to either mode. */
  if jay is not null
     and not exists (select 1 from public.trainer_availability_rules where trainer_id = jay) then
    insert into public.trainer_availability_rules (trainer_id, weekday, start_minute, end_minute, mode, is_active) values
      (jay, 1,  720,  840, 'in_person', true),    -- Mon 12:00–14:00
      (jay, 2,  720,  840, 'in_person', true),    -- Tue 12:00–14:00
      (jay, 4,  720,  840, 'in_person', true),    -- Thu 12:00–14:00
      (jay, 6,  540,  660, 'both',      true);    -- Sat 09:00–11:00 (video OR in-person)
  end if;

  /* KAI · reformer + pilates
     Mid-mornings in the studio, two evening video slots. */
  if kai is not null
     and not exists (select 1 from public.trainer_availability_rules where trainer_id = kai) then
    insert into public.trainer_availability_rules (trainer_id, weekday, start_minute, end_minute, mode, is_active) values
      (kai, 2,  600,  780, 'in_person', true),    -- Tue 10:00–13:00
      (kai, 3,  600,  780, 'in_person', true),    -- Wed 10:00–13:00
      (kai, 5,  600,  780, 'in_person', true),    -- Fri 10:00–13:00
      (kai, 1, 1140, 1230, 'video',     true),    -- Mon 19:00–20:30
      (kai, 4, 1140, 1230, 'video',     true);    -- Thu 19:00–20:30
  end if;

  /* TASHA · yoga + mobility
     Afternoons open to either mode, Sunday morning video. */
  if tasha is not null
     and not exists (select 1 from public.trainer_availability_rules where trainer_id = tasha) then
    insert into public.trainer_availability_rules (trainer_id, weekday, start_minute, end_minute, mode, is_active) values
      (tasha, 1,  900, 1080, 'both',  true),      -- Mon 15:00–18:00
      (tasha, 3,  900, 1080, 'both',  true),      -- Wed 15:00–18:00
      (tasha, 5,  900, 1080, 'both',  true),      -- Fri 15:00–18:00
      (tasha, 0,  480,  600, 'video', true);      -- Sun 08:00–10:00
  end if;
end $$;
