-- Phase 6 — unify with-equipment vs without-equipment classes.
-- A class either needs a spot picker (e.g. reformer studios) or it's
-- capacity-only (HIIT, mobility, etc.). Idempotent.

alter table public.classes
  add column if not exists has_equipment boolean not null default false,
  add column if not exists mirrored_layout boolean not null default false;

-- Backfill: reformer classes are the obvious equipment case. Other kinds
-- stay equipment-free until a trainer flips them via the create form.
update public.classes
  set has_equipment = true, mirrored_layout = true
  where kind = 'reformer';

create index if not exists idx_classes_has_equipment
  on public.classes(has_equipment) where has_equipment = true;
