-- Class lifecycle status. Today bookings carry status but the class itself
-- doesn't, so trainers can't mark a class cancelled/completed in a way that
-- reflects everywhere. Idempotent.

alter table public.classes
  add column if not exists status text not null default 'scheduled'
    check (status in ('scheduled','cancelled','completed')),
  add column if not exists cancelled_at timestamptz,
  add column if not exists completed_at timestamptz;

create index if not exists idx_classes_status on public.classes(status);
