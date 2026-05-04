-- 0033_shop_inventory.sql
-- Inventory tracking for the shop. NULL stock_qty means "untracked / unlimited"
-- (matches today's behavior); a non-null integer is the real on-hand count and
-- gets decremented on every fulfilled order via the purchases pipeline.

alter table public.products
  add column if not exists stock_qty int
    check (stock_qty is null or stock_qty >= 0);

comment on column public.products.stock_qty is
  'Inventory level. NULL = untracked / unlimited. 0 = sold out (overrides in_stock=true). Decremented by fulfillPurchase on shop_order completion.';

create index if not exists idx_products_in_stock on public.products(in_stock) where in_stock = true;
