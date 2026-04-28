-- Element 78 seed data

-- LOCATIONS
insert into public.locations (slug, name, city, state, status, hero_image, lat, lng, sort_order) values
  ('compton-hq', 'Compton HQ', 'Compton', 'CA', 'active', '/assets/blue-hair-gym.jpg', 33.8958, -118.2201, 1),
  ('atl-west-end', 'ATL West End', 'Atlanta', 'GA', 'active', '/assets/dumbbell-street.jpg', 33.7490, -84.3880, 2),
  ('houston-third-ward', 'Houston · Third Ward', 'Houston', 'TX', 'waitlist', null, 29.7604, -95.3698, 3),
  ('nyc-bed-stuy', 'NYC · Bed-Stuy', 'Brooklyn', 'NY', 'waitlist', null, 40.6872, -73.9418, 4),
  ('oakland-fruitvale', 'Oakland · Fruitvale', 'Oakland', 'CA', 'waitlist', null, 37.7749, -122.2247, 5);

-- TRAINERS
insert into public.trainers (slug, name, headline, bio, specialties, avatar_url, hero_image, home_location_id, rating)
select 'kai-brooks', 'Kai Brooks',
  'Pilates + reformer. Certified BASI. 8 yrs.',
  'Compton-raised, LA-trained. Builds slow strength and long lines. Music loud, cues precise.',
  ARRAY['Reformer','Mat Pilates','Mobility'],
  '/assets/blue-hair-gym.jpg', '/assets/blue-hair-gym.jpg',
  l.id, 4.95
from public.locations l where l.slug='compton-hq';

insert into public.trainers (slug, name, headline, bio, specialties, avatar_url, hero_image, home_location_id, rating)
select 'amara-jones', 'Amara Jones',
  'HIIT + functional strength. NSCA-CPT.',
  'Heavy basics. Quick rounds. No filler. Builds the engine.',
  ARRAY['HIIT','Strength','Conditioning'],
  '/assets/dumbbell-street.jpg','/assets/dumbbell-street.jpg',
  l.id, 4.91
from public.locations l where l.slug='atl-west-end';

insert into public.trainers (slug, name, headline, bio, specialties, avatar_url, hero_image, home_location_id, rating)
select 'simone-okafor', 'Simone Okafor',
  'Mobility + recovery. Yoga + breathwork.',
  'Restoration as resistance. Slow flows that put the nervous system back on the rails.',
  ARRAY['Yoga','Breathwork','Mobility'],
  '/assets/pilates-pink.jpg','/assets/pilates-pink.jpg',
  l.id, 4.97
from public.locations l where l.slug='compton-hq';

-- CLASSES (next 7 days, two per day per active location)
do $$
declare
  loc record;
  trainer record;
  d int;
  base_time timestamptz := date_trunc('day', now() at time zone 'America/Los_Angeles');
begin
  for loc in select * from public.locations where status='active' loop
    for d in 0..6 loop
      select * into trainer from public.trainers where home_location_id = loc.id order by random() limit 1;
      if trainer.id is null then
        select * into trainer from public.trainers order by random() limit 1;
      end if;

      insert into public.classes(slug, location_id, trainer_id, name, kind, starts_at, duration_min, capacity, booked, intensity, room, hero_image)
      values
        ('west-coast-flow-' || loc.slug || '-' || d,
         loc.id, trainer.id, 'WEST COAST FLOW', 'reformer',
         base_time + (d || ' days')::interval + interval '6 hours 30 minutes',
         50, 14, 9, 'MD', 'STUDIO B', '/assets/blue-set-rooftop.jpg'),
        ('core-compton-' || loc.slug || '-' || d,
         loc.id, trainer.id, 'CORE COMPTON', 'pilates',
         base_time + (d || ' days')::interval + interval '18 hours',
         45, 12, 11, 'HI', 'STUDIO A', '/assets/pilates-pink.jpg');
    end loop;
  end loop;
end $$;

-- PRODUCTS — paired with /Assets/Shop/IMG_*.jpg + design's curated set
insert into public.products (slug, name, subtitle, category, price_cents, compare_at_cents, description, hero_image, gallery, tag, in_stock, sort_order) values
  ('tripod-bottle',
   'TRIPOD BOTTLE', '32 OZ · DUSK BLUE', 'gear',
   5800, null,
   'Insulated 32oz with a built-in phone mount in the cap. Set it up on the mat. Get the angle right.',
   '/assets/bottle-tripod.jpg',
   ARRAY['/assets/bottle-tripod.jpg','/assets/bottle-gym.jpg','/assets/bottle-gym-2.jpg'],
   'SIGNATURE', true, 1),

  ('compton-hoodie',
   'COMPTON HOODIE', 'HEATHER · OS', 'wear',
   9200, null,
   'Heavyweight French terry, double-stitched. Fits oversized. Built to outlast the season.',
   '/products/IMG_3456.jpg',
   ARRAY['/products/IMG_3456.jpg','/assets/hoodie-grey-blonde.jpg','/assets/hoodie-grey-blonde-2.jpg'],
   null, true, 2),

  ('element-bra',
   'ELEMENT BRA', 'SKY · XS-XL', 'wear',
   4800, null,
   'Medium-impact compression, sweat-wicking. Sky blue, our signature.',
   '/products/IMG_3457.jpg',
   ARRAY['/products/IMG_3457.jpg','/assets/blue-hair-selfie.jpg'],
   'BACK', true, 3),

  ('heavy-flask',
   'HEAVY FLASK', '40 OZ · GYM', 'gear',
   4800, null,
   'Vacuum-sealed steel. 40 oz keeps you on the floor longer.',
   '/products/IMG_3460.jpg',
   ARRAY['/products/IMG_3460.jpg','/assets/bottle-gym-2.jpg'],
   null, true, 4),

  ('element-set',
   'THE ELEMENT SET', 'HOODIE + SHORTS BUNDLE', 'wear',
   14800, 18000,
   'Drop 04. The full kit — hoodie, shorts, and our signature in-my-element wash.',
   '/assets/hoodie-duo.jpg',
   ARRAY['/assets/hoodie-duo.jpg','/products/IMG_3464.jpg'],
   'BUNDLE', true, 5);

-- VARIANTS
insert into public.product_variants (product_id, color, size, sku, in_stock)
select p.id, 'Dusk Blue', 'OS', 'BOT-DUSK-OS', true from public.products p where p.slug='tripod-bottle'
union all
select p.id, 'Bone', 'OS', 'BOT-BONE-OS', true from public.products p where p.slug='tripod-bottle'
union all
select p.id, 'Heather', sz, 'HOOD-HTH-' || sz, true from public.products p, unnest(ARRAY['XS','S','M','L','XL']) sz where p.slug='compton-hoodie'
union all
select p.id, 'Sky', sz, 'BRA-SKY-' || sz, true from public.products p, unnest(ARRAY['XS','S','M','L','XL']) sz where p.slug='element-bra'
union all
select p.id, 'Gym Black', '40OZ', 'FLASK-BLK-40', true from public.products p where p.slug='heavy-flask'
union all
select p.id, 'Bone', sz, 'SET-BONE-' || sz, true from public.products p, unnest(ARRAY['XS','S','M','L','XL']) sz where p.slug='element-set';

-- POSTS (Crew timeline)
insert into public.posts (kind, body, media_url, meta) values
  ('trainer_drop', 'NEW · West Coast Flow Series 04 just dropped. Light reformer + breath. 7 sessions.', '/assets/blue-set-rooftop.jpg', '{"author":"KAI · TRAINER","tag":"STAFF"}'),
  ('progress', 'Hit 14 days straight. The streak is real. Pulled up at 5:45a.', '/assets/dumbbell-street.jpg', '{"author":"AALIYAH M.","streak":14}'),
  ('milestone', 'PR · Reformer footwork to plank. Held it.', '/assets/pilates-pink.jpg', '{"author":"NOVA T.","pr":"Plank · 2:30"}'),
  ('event', 'Sunset rooftop class · Sat 7p · Compton HQ. 12 spots.', '/assets/blue-set-rooftop.jpg', '{"date":"SAT 5/3 · 7:00P","spots":12}'),
  ('announcement', 'ATL West End is officially open. Come see us.', '/assets/element78-hero.jpg', '{"location":"ATL · WEST END"}');
