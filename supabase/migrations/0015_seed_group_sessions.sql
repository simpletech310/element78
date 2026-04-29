-- Seed a handful of upcoming group video / in-person sessions so the
-- /trainers/<slug>/book "GROUP SESSIONS" rail and the trainer dashboard
-- aren't empty for testing. Idempotent — only seeds when a trainer has
-- zero open group sessions today.
--
-- All times are anchored to Eastern (Atlanta HQ). The pattern
--   ((base + interval 'N days H hours') at time zone 'America/New_York')
-- treats `base + offset` as a naive wall-clock and converts to UTC, so the
-- stored timestamptz reads as the intended local time regardless of the
-- server's UTC default.

do $$
declare
  amara uuid;
  jay   uuid;
  kai   uuid;
  tasha uuid;
  atl   uuid;
  /* Naive (no-tz) midnight on today's Eastern calendar date. */
  base  timestamp := date_trunc('day', now() at time zone 'America/New_York');
begin
  select id into amara from public.trainers  where slug = 'amara-jones'  limit 1;
  select id into jay   from public.trainers  where slug = 'jay-elias'    limit 1;
  select id into kai   from public.trainers  where slug = 'kai-brooks'   limit 1;
  select id into tasha from public.trainers  where slug = 'tasha-wright' limit 1;
  select id into atl   from public.locations where slug = 'atlanta-hq'   limit 1;

  /* AMARA · two upcoming groups */
  if amara is not null
     and not exists (select 1 from public.trainer_sessions where trainer_id = amara and is_group = true) then
    insert into public.trainer_sessions
      (trainer_id, starts_at, ends_at, mode, capacity, price_cents, status, is_group, title, description)
    values
      -- HIIT bootcamp · video · 6 attendees · $30/seat · 2 days out at 6:00 PM ET
      (amara,
        (base + interval '2 days 18 hours') at time zone 'America/New_York',
        (base + interval '2 days 18 hours 50 minutes') at time zone 'America/New_York',
        'video', 6, 3000, 'open', true,
        'GROUP HIIT BOOTCAMP',
        'Six rounds, six humans, one screen. Bring water and a mat — we hit the floor at minute one.'),
      -- Saturday conditioning · in-person · 5 · $30 · 5 days out at 7:00 AM ET
      (amara,
        (base + interval '5 days 7 hours') at time zone 'America/New_York',
        (base + interval '5 days 8 hours') at time zone 'America/New_York',
        'in_person', 5, 3000, 'open', true,
        'SATURDAY CONDITIONING',
        'Threshold intervals on the floor at HQ. Heart-rate driven, scaled to the room.');
  end if;

  /* JAY · in-person heavy lift group · 4 days out at 9:00 AM ET */
  if jay is not null
     and not exists (select 1 from public.trainer_sessions where trainer_id = jay and is_group = true) then
    insert into public.trainer_sessions
      (trainer_id, starts_at, ends_at, mode, capacity, price_cents, status, is_group, title, description, location_id)
    values
      (jay,
        (base + interval '4 days 9 hours') at time zone 'America/New_York',
        (base + interval '4 days 10 hours 15 minutes') at time zone 'America/New_York',
        'in_person', 4, 4000, 'open', true,
        'POWER LIFT GROUP',
        'Heavy basics, four lifters, one platform per pair. Squat or deadlift focus depending on the day.',
        atl);
  end if;

  /* KAI · reformer fundamentals on video · 3 days out at 11:00 AM ET */
  if kai is not null
     and not exists (select 1 from public.trainer_sessions where trainer_id = kai and is_group = true) then
    insert into public.trainer_sessions
      (trainer_id, starts_at, ends_at, mode, capacity, price_cents, status, is_group, title, description)
    values
      (kai,
        (base + interval '3 days 11 hours') at time zone 'America/New_York',
        (base + interval '3 days 11 hours 50 minutes') at time zone 'America/New_York',
        'video', 5, 3500, 'open', true,
        'REFORMER FUNDAMENTALS · GROUP',
        'Pilates fundamentals translated to the mat. Slow tempo, long lines, repeatable cues.');
  end if;

  /* TASHA · video Sunday + in-person Friday afternoon */
  if tasha is not null
     and not exists (select 1 from public.trainer_sessions where trainer_id = tasha and is_group = true) then
    insert into public.trainer_sessions
      (trainer_id, starts_at, ends_at, mode, capacity, price_cents, status, is_group, title, description, location_id)
    values
      -- Sunday reset · video · 8 · $20 · 6 days out at 8:00 AM ET (no location)
      (tasha,
        (base + interval '6 days 8 hours') at time zone 'America/New_York',
        (base + interval '6 days 8 hours 45 minutes') at time zone 'America/New_York',
        'video', 8, 2000, 'open', true,
        'SUNDAY MORNING RESET',
        'Restorative yoga + breathwork to start the week soft. Mat, blanket, optional bolster.',
        null),
      -- Afternoon flow · in-person · 6 · $25 · 5 days out at 4:00 PM ET
      (tasha,
        (base + interval '5 days 16 hours') at time zone 'America/New_York',
        (base + interval '5 days 17 hours') at time zone 'America/New_York',
        'in_person', 6, 2500, 'open', true,
        'AFTERNOON FLOW',
        'Slow-burn yoga + mobility on the studio floor. Mat provided.',
        atl);
  end if;
end $$;
