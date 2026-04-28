-- Generates a varied 14-day class schedule. Idempotent — safe to re-run, the
-- (slug, starts_at) pair is unique per generated class. Existing future
-- classes are not deleted; this migration only adds rows.

do $$
declare
  loc uuid;
  kai uuid;
  amara uuid;
  jay uuid;
  tasha uuid;
begin
  select id into loc   from public.locations where slug = 'atlanta-hq'   limit 1;
  select id into kai   from public.trainers  where slug = 'kai-brooks'   limit 1;
  select id into amara from public.trainers  where slug = 'amara-jones'  limit 1;
  select id into jay   from public.trainers  where slug = 'jay-elias'    limit 1;
  select id into tasha from public.trainers  where slug = 'tasha-wright' limit 1;

  -- Slot template: name, kind, trainer, hour, minute, duration, capacity,
  -- intensity, room, hero, price, summary, what_to_bring, weekday/weekend filter
  with slots(slug, name, kind, trainer_id, hh, mm, dur, cap, intensity, room, hero, price, summary, bring, weekday_only, weekend_only) as (values
    ('sunrise-pilates', 'SUNRISE PILATES',  'pilates',     tasha, 6,  25, 35, 14, 'LO', 'STUDIO A',     '/assets/IMG_3467.jpg',         0,    'The 6:25A wave. Slow openings, breath cues, no equipment.',                'Mat provided · loose layers',  true,  false),
    ('morning-mobility','MORNING MOBILITY', 'mobility',    tasha, 7,  0,  30, 16, 'LO', 'STUDIO C',     '/assets/IMG_3467.jpg',         0,    'Pre-coffee mobility flow. Soft openings, slow breath.',                    'Mat provided · loose layers',  false, false),
    ('core-78',         'CORE 78',          'pilates',     tasha, 8,  30, 45, 12, 'HI', 'STUDIO A',     '/assets/floor-mockup.png',     1500, 'High-intensity core block on the mat. Short bursts, longer holds.',        'Mat provided · grip socks',    false, false),
    ('power-pilates',   'POWER PILATES',    'reformer',    kai,   10, 0,  50, 12, 'MD', 'STUDIO B',     '/assets/blue-set-rooftop.jpg', 2500, 'Reformer-based Pilates that builds long lines and core control.',          'Grip socks · water',           false, false),
    ('street-hiit',     'STREET HIIT',      'hiit',        amara, 12, 0,  30, 20, 'HI', 'FLOOR',        '/assets/dumbbell-street.jpg',  0,    'Outdoor-style HIIT on the floor. Bodyweight + dumbbells.',                 'Athletic shoes · sweat towel', false, false),
    ('lunch-strength',  'LUNCH STRENGTH',   'strength',    jay,   12, 30, 45, 10, 'MD', 'WEIGHT FLOOR', '/assets/IMG_3469.jpg',         1500, 'Heavy basics in 45. Squat, hinge, push, pull, carry — pick three.',        'Lifters · chalk allowed',      false, false),
    ('engine-builder',  'ENGINE BUILDER',   'conditioning',amara, 16, 0,  28, 16, 'HI', 'FLOOR',        '/assets/IMG_3465.jpg',         1500, 'Threshold intervals scaled to your HRV. Eight rounds, three minutes each.','Heart-rate monitor optional',  false, false),
    ('deadlift-lab',    'DEADLIFT LAB',     'strength',    jay,   17, 0,  60, 8,  'HI', 'WEIGHT FLOOR', '/assets/IMG_3461.jpg',         2500, 'Pull setup → top set → backoffs. Conventional or trap bar.',               'Lifters · belt if you want',   true,  false),
    ('west-coast-flow', 'WEST COAST FLOW',  'reformer',    kai,   18, 30, 50, 14, 'MD', 'STUDIO B',     '/assets/blue-set-rooftop.jpg', 2500, 'Slow tempo, hard work. Reformer flow that builds long lines.',             'Grip socks · water',           false, false),
    ('rooftop-sunset',  'ROOFTOP SUNSET',   'reformer',    kai,   19, 30, 50, 12, 'MD', 'ROOF',         '/assets/editorial-2.png',      2500, 'Reformer flow on the open-air rooftop deck. Sunset cues, heavier music.',  'Grip socks · water · open mind', false, false),
    ('evening-yoga',    'EVENING YOGA',     'yoga',        tasha, 20, 0,  45, 16, 'LO', 'STUDIO C',     '/assets/pilates-pink.jpg',     0,    'Restorative wind-down. Long holds, soft music, breath-led.',               'Mat provided · blanket if you have one', false, false),
    ('saturday-strong', 'SATURDAY STRONG',  'strength',    jay,   9,  0,  60, 12, 'HI', 'WEIGHT FLOOR', '/assets/IMG_3469.jpg',         2500, 'Heavy basics, full hour. Squat or deadlift focus, alternating weeks.',     'Lifters · chalk allowed',      false, true),
    ('sunday-reset',    'SUNDAY RESET',     'yoga',        tasha, 10, 0,  60, 18, 'LO', 'STUDIO C',     '/assets/editorial-1.jpg',      0,    'Restorative yoga + breathwork. The week''s slowest hour.',                  'Mat provided · blanket',       false, true)
  )
  insert into public.classes (
    slug, location_id, trainer_id, name, kind, starts_at, duration_min,
    capacity, booked, intensity, room, hero_image,
    price_cents, requires_payment, summary, what_to_bring
  )
  select
    s.slug || '-' || to_char(d.day, 'YYYYMMDD'),
    loc, s.trainer_id, s.name, s.kind,
    (d.day::date + (s.hh || ' hours')::interval + (s.mm || ' minutes')::interval),
    s.dur, s.cap,
    -- Light occupancy variation by day so the schedule doesn't look static.
    least(s.cap, ceil(s.cap * (0.35 + ((extract(doy from d.day)::int * 13) % 50) / 100.0))::int),
    s.intensity, s.room, s.hero,
    s.price, s.price > 0, s.summary, s.bring
  from slots s
  cross join generate_series(current_date, current_date + interval '13 days', interval '1 day') d(day)
  where (
    (s.weekday_only and extract(dow from d.day) between 1 and 5)
    or (s.weekend_only and extract(dow from d.day) in (0, 6))
    or (not s.weekday_only and not s.weekend_only)
  )
  on conflict (slug) do nothing;
end$$;
