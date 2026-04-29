-- Add a real street address to locations and seed Atlanta HQ with the
-- flagship's actual coordinates so the locations page stops showing a
-- generic Atlanta-wide pin. Idempotent.

alter table public.locations
  add column if not exists address text;

-- West Midtown · Westside Provisions District. Real, mappable.
update public.locations
  set
    address = '1198 Howell Mill Rd NW, Atlanta, GA 30318',
    lat = 33.7935,
    lng = -84.4150
  where slug = 'atlanta-hq';
