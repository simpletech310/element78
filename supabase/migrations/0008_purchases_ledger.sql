-- Phase 3 — unified purchases ledger.
-- Every checkout (class, program, 1-on-1, shop) creates a row here, so the
-- per-client view is one query: select * from purchases where user_id = ?.
-- Webhook reads `metadata.purchase_id` and fulfills the linked entity.
-- Idempotent — safe to re-run.

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('class_booking','program_enrollment','trainer_booking','shop_order')),
  amount_cents int not null,
  currency text not null default 'usd',
  status text not null default 'pending'
    check (status in ('pending','paid','refunded','failed','cancelled')),
  -- Linked entity (exactly one populated based on kind):
  class_booking_id uuid references public.bookings(id) on delete set null,
  program_enrollment_id uuid references public.program_enrollments(id) on delete set null,
  trainer_booking_id uuid references public.trainer_bookings(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  -- Stripe linkage:
  stripe_session_id text,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  -- Display:
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_purchases_user on public.purchases(user_id, created_at desc);
create index if not exists idx_purchases_status on public.purchases(status);
create index if not exists idx_purchases_stripe_session on public.purchases(stripe_session_id) where stripe_session_id is not null;
create index if not exists idx_purchases_class_booking on public.purchases(class_booking_id) where class_booking_id is not null;
create index if not exists idx_purchases_program_enrollment on public.purchases(program_enrollment_id) where program_enrollment_id is not null;
create index if not exists idx_purchases_trainer_booking on public.purchases(trainer_booking_id) where trainer_booking_id is not null;
create index if not exists idx_purchases_order on public.purchases(order_id) where order_id is not null;

alter table public.purchases enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='purchases' and policyname='purchases_self_read') then
    create policy purchases_self_read on public.purchases for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='purchases' and policyname='purchases_self_insert') then
    create policy purchases_self_insert on public.purchases for insert with check (auth.uid() = user_id);
  end if;
  -- Updates only via service role (webhook). No user-side update policy.
end $$;

-- program_enrollments: allow `pending_payment` so paid programs can be created
-- but inactive until Stripe confirms. The check constraint may already exist,
-- so drop + recreate.
do $$
declare con_name text;
begin
  select conname into con_name
    from pg_constraint
    where conrelid = 'public.program_enrollments'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%';
  if con_name is not null then
    execute format('alter table public.program_enrollments drop constraint %I', con_name);
  end if;
end $$;

alter table public.program_enrollments
  add constraint program_enrollments_status_check
  check (status in ('pending_payment','active','completed','paused','left'));

-- bookings: stash stripe session id for class bookings (mirrors trainer_bookings).
alter table public.bookings
  add column if not exists stripe_session_id text;

create index if not exists idx_bookings_stripe_session on public.bookings(stripe_session_id) where stripe_session_id is not null;
