-- Adds the seven new programs (Heavy Basics, Sunrise 30, Engine Builder,
-- Reformer Ladder, Return to Run, Breath Reset, Post-Natal Foundation) plus
-- their session rows. Idempotent — safe to run multiple times. Trainer IDs
-- are looked up by slug so the script doesn't depend on a fixed UUID.

-- Helper trainer lookups.
do $$
declare kai uuid; amara uuid; jay uuid; tasha uuid; leila uuid;
begin
  select id into kai   from public.trainers where slug = 'kai-brooks'   limit 1;
  select id into amara from public.trainers where slug = 'amara-jones'  limit 1;
  select id into jay   from public.trainers where slug = 'jay-elias'    limit 1;
  select id into tasha from public.trainers where slug = 'tasha-wright' limit 1;
  select id into leila from public.trainers where slug = 'leila'        limit 1;

  -- Programs
  insert into public.programs (slug, name, subtitle, description, hero_image, duration_label, total_sessions, intensity, kind, surfaces, sort_order, price_cents, requires_payment, trainer_id) values
    ('heavy-basics',          'HEAVY BASICS',           'Squat · hinge · push · pull · carry',  'Five movements, three sessions a week. Learn the lifts, build the engine, walk out stronger every Monday.', '/assets/IMG_3469.jpg',         '4 WEEKS · 12 SESSIONS', 12, 'Beginner → Intermediate', 'in_person', array['gym','class'],         4,  7900,  true,  amara),
    ('sunrise-30',            'SUNRISE 30',             '30 days of morning mobility',          '12-minute pre-coffee mobility flow. Same time every day. Builds a sustainable practice you actually keep.', '/assets/IMG_3467.jpg',         '30 DAYS · 12 MIN',       30, 'All levels',              'in_app',    array['app'],                  5,  0,     false, tasha),
    ('engine-builder',        'ENGINE BUILDER',         'Conditioning · 6 weeks',               'Lactate-threshold work for runners and lifters. Three engine sessions a week — short, brutal, scaled by HRV.', '/assets/IMG_3465.jpg',         '6 WEEKS · 18 SESSIONS', 18, 'Intermediate → Advanced', 'both',      array['app','gym'],            6,  9900,  true,  amara),
    ('reformer-ladder',       'REFORMER LADDER',        'Power Pilates · 6 weeks',              'Kai''s reformer protocol — three blocks, ascending intensity. Built from the 12-week study with her clients.', '/assets/blue-set-rooftop.jpg', '6 WEEKS · 24 SESSIONS', 24, 'Intermediate',            'in_person', array['gym','class'],         7,  14900, true,  kai),
    ('return-to-run',         'RETURN TO RUN',          'Rebuild your run · 8 weeks',           'From comeback after a break (or a baby) to a confident 5K. Strength, mobility, and progressive run intervals.', '/assets/dumbbell-street.jpg', '8 WEEKS · 24 SESSIONS', 24, 'All levels',              'both',      array['app','gym'],            8,  11900, true,  jay),
    ('breath-reset',          'BREATH RESET',           'AI-led · 14 days',                     'Box breathing, physiological sigh, 4-7-8. Ten-minute resets you can run before bed or between meetings.', '/assets/pilates-pink.jpg',     '14 DAYS · 10 MIN',       14, 'All levels',              'in_app',    array['app'],                  9,  0,     false, leila),
    ('post-natal-foundation', 'POST-NATAL FOUNDATION',  'Reconnect · 8 weeks',                  'Patient core reconnection + pelvic floor work. Modular blocks with three regression options every day.', '/assets/editorial-1.jpg',     '8 WEEKS · 24 SESSIONS', 24, 'Beginner',                'both',      array['app','gym','class'],   10, 12900, true,  tasha)
  on conflict (slug) do update set
    name             = excluded.name,
    subtitle         = excluded.subtitle,
    description      = excluded.description,
    hero_image       = excluded.hero_image,
    duration_label   = excluded.duration_label,
    total_sessions   = excluded.total_sessions,
    intensity        = excluded.intensity,
    kind             = excluded.kind,
    surfaces         = excluded.surfaces,
    sort_order       = excluded.sort_order,
    price_cents      = excluded.price_cents,
    requires_payment = excluded.requires_payment,
    trainer_id       = excluded.trainer_id;

  -- Backfill program_sessions for each new program so progress tracking works.
  -- Each program gets total_sessions rows generated from a generate_series.
  perform 1; -- no-op so the do-block has a body
end$$;

-- Sessions: insert for each new program if not already present.
insert into public.program_sessions (program_id, day_index, name, duration_min, description, kind, hero_image)
select p.id, gs.i, upper(p.name) || ' · Session ' || gs.i, 50, 'Squat / hinge / push / pull / carry.', 'strength', '/assets/IMG_3469.jpg'
from public.programs p, generate_series(1,12) gs(i)
where p.slug = 'heavy-basics'
on conflict do nothing;

insert into public.program_sessions (program_id, day_index, name, duration_min, description, kind, hero_image)
select p.id, gs.i, upper(p.name) || ' · Day ' || gs.i, 12, 'Pre-coffee mobility flow.', 'mobility', '/assets/IMG_3467.jpg'
from public.programs p, generate_series(1,30) gs(i)
where p.slug = 'sunrise-30'
on conflict do nothing;

insert into public.program_sessions (program_id, day_index, name, duration_min, description, kind, hero_image)
select p.id, gs.i, upper(p.name) || ' · Session ' || gs.i, 28, 'Threshold intervals, scaled by HRV.', 'conditioning', '/assets/IMG_3465.jpg'
from public.programs p, generate_series(1,18) gs(i)
where p.slug = 'engine-builder'
on conflict do nothing;

insert into public.program_sessions (program_id, day_index, name, duration_min, description, kind, hero_image)
select p.id, gs.i, upper(p.name) || ' · Session ' || gs.i, 50, 'Power Pilates ladder protocol.', 'reformer', '/assets/blue-set-rooftop.jpg'
from public.programs p, generate_series(1,24) gs(i)
where p.slug = 'reformer-ladder'
on conflict do nothing;

insert into public.program_sessions (program_id, day_index, name, duration_min, description, kind, hero_image)
select p.id, gs.i, upper(p.name) || ' · Session ' || gs.i, 35, 'Run intervals + strength + mobility.', 'run', '/assets/dumbbell-street.jpg'
from public.programs p, generate_series(1,24) gs(i)
where p.slug = 'return-to-run'
on conflict do nothing;

insert into public.program_sessions (program_id, day_index, name, duration_min, description, kind, hero_image)
select p.id, gs.i, upper(p.name) || ' · Day ' || gs.i, 10, 'Breathwork reset session.', 'breath', '/assets/pilates-pink.jpg'
from public.programs p, generate_series(1,14) gs(i)
where p.slug = 'breath-reset'
on conflict do nothing;

insert into public.program_sessions (program_id, day_index, name, duration_min, description, kind, hero_image)
select p.id, gs.i, upper(p.name) || ' · Session ' || gs.i, 35, 'Core reconnection + pelvic floor.', 'pilates', '/assets/editorial-1.jpg'
from public.programs p, generate_series(1,24) gs(i)
where p.slug = 'post-natal-foundation'
on conflict do nothing;
