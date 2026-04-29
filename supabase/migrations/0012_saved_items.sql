-- Phase 5 — Saved items. Polymorphic favorites: a member can save a program,
-- a class, a product, a trainer, or an AI-Studio routine.
-- Idempotent.

create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('program','class','product','trainer','routine')),
  -- Generic id field — points at the right table based on `kind`. We don't
  -- enforce FKs here (different target tables) but app-level queries join.
  ref_id text not null,
  -- Cached display fields so the saved page renders fast without a fan-out
  -- of joins. Refreshed on save; staleness is tolerable for this surface.
  ref_slug text,
  ref_name text,
  ref_image text,
  created_at timestamptz not null default now(),
  unique (user_id, kind, ref_id)
);

create index if not exists idx_saved_items_user
  on public.saved_items(user_id, created_at desc);

alter table public.saved_items enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='saved_items' and policyname='saved_items_self_read') then
    create policy saved_items_self_read on public.saved_items for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='saved_items' and policyname='saved_items_self_write') then
    create policy saved_items_self_write on public.saved_items for all
      using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
