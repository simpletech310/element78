-- Phase 3 — server-side shopping cart + Stripe linkage on orders.
-- The cart becomes a draft `orders` row (status='cart'); checkout flips it to
-- 'pending', webhook flips it to 'paid'.
-- Idempotent.

-- 1. Allow new statuses on orders. The original column has no check
--    constraint; we add one (idempotent), then ensure the supported set
--    covers the cart workflow.
do $$
declare con_name text;
begin
  select conname into con_name
    from pg_constraint
    where conrelid = 'public.orders'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%';
  if con_name is not null then
    execute format('alter table public.orders drop constraint %I', con_name);
  end if;
end $$;

alter table public.orders
  add constraint orders_status_check
  check (status in ('cart','pending','paid','fulfilled','cancelled','refunded'));

-- 2. Stripe linkage + fulfillment timestamps on orders.
alter table public.orders
  add column if not exists stripe_session_id text,
  add column if not exists fulfilled_at timestamptz,
  add column if not exists checkout_at timestamptz;

create index if not exists idx_orders_user_status
  on public.orders(user_id, status, created_at desc);

create index if not exists idx_orders_stripe_session
  on public.orders(stripe_session_id) where stripe_session_id is not null;

-- One active cart per user — keeps the "current cart" lookup trivial.
create unique index if not exists idx_orders_one_cart_per_user
  on public.orders(user_id)
  where status = 'cart';

-- 3. order_items: ensure RLS coverage matches orders.
alter table public.order_items enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='order_items' and policyname='oi_self_write') then
    create policy oi_self_write on public.order_items for all
      using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()))
      with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
  end if;
end $$;
