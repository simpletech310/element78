-- 0032_admin_super.sql
-- Per-coach payout split override + helper indices for admin reports.

-- =============================================================================
-- A1. Per-trainer payout split override (basis points; null = global default)
-- =============================================================================
alter table public.trainers
  add column if not exists payout_split_bps int
    check (payout_split_bps is null or (payout_split_bps between 0 and 10000));

comment on column public.trainers.payout_split_bps is
  'Platform fee for this coach in basis points (0–10000). NULL = use global PLATFORM_FEE_BPS. Set by superadmins to give specific coaches a better cut.';

-- =============================================================================
-- A2. Reporting helpers (lightweight indices)
-- =============================================================================
create index if not exists idx_purchases_created on public.purchases(created_at desc);
create index if not exists idx_purchases_status_created on public.purchases(status, created_at desc);
create index if not exists idx_purchases_kind_created on public.purchases(kind, created_at desc);
