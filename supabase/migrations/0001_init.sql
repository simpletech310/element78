-- Element 78 schema
-- Run with: supabase db reset (local) or paste into Supabase SQL editor.

create extension if not exists "pgcrypto";

-- LOCATIONS
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  city text not null,
  state text not null,
  status text not null check (status in ('active','waitlist')),
  hero_image text,
  lat double precision,
  lng double precision,
  sort_order int default 0
);

-- TRAINERS
create table if not exists public.trainers (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  headline text,
  bio text,
  specialties text[] default '{}',
  avatar_url text,
  hero_image text,
  home_location_id uuid references public.locations(id) on delete set null,
  rating numeric(3,2) default 4.9
);

-- CLASSES
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  location_id uuid references public.locations(id) on delete cascade,
  trainer_id uuid references public.trainers(id) on delete set null,
  name text not null,
  kind text,
  starts_at timestamptz not null,
  duration_min int default 45,
  capacity int default 14,
  booked int default 0,
  intensity text,
  room text,
  hero_image text
);

-- PROFILES (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique,
  display_name text,
  avatar_url text,
  home_location_id uuid references public.locations(id),
  streak_days int default 0,
  created_at timestamptz default now()
);

-- BOOKINGS
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  status text default 'reserved',
  created_at timestamptz default now(),
  unique(user_id, class_id)
);

-- PRODUCTS
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  subtitle text,
  category text,
  price_cents int not null,
  compare_at_cents int,
  description text,
  hero_image text,
  gallery text[] default '{}',
  tag text,
  in_stock bool default true,
  sort_order int default 0
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  color text,
  size text,
  sku text unique,
  in_stock bool default true
);

-- ORDERS (cart eventually persists here; v1 uses localStorage)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  status text default 'pending',
  subtotal_cents int default 0,
  created_at timestamptz default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  qty int default 1,
  price_cents int default 0
);

-- POSTS (Crew timeline)
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null,
  kind text default 'progress',
  body text,
  media_url text,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- SESSIONS_LOG (Activity)
create table if not exists public.sessions_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  completed_at timestamptz default now(),
  duration_min int,
  kind text
);

-- TRIGGER: auto-create profile when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, handle)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
          lower(split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ROW LEVEL SECURITY
alter table public.locations enable row level security;
alter table public.trainers enable row level security;
alter table public.classes enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.posts enable row level security;
alter table public.profiles enable row level security;
alter table public.bookings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.sessions_log enable row level security;

-- Public read for catalog/content
create policy "public read locations" on public.locations for select using (true);
create policy "public read trainers" on public.trainers for select using (true);
create policy "public read classes" on public.classes for select using (true);
create policy "public read products" on public.products for select using (true);
create policy "public read variants" on public.product_variants for select using (true);
create policy "public read posts" on public.posts for select using (true);

-- Profiles: read public, write own
create policy "public read profiles" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "users insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Bookings: own only
create policy "users read own bookings" on public.bookings for select using (auth.uid() = user_id);
create policy "users write own bookings" on public.bookings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Orders: own only
create policy "users read own orders" on public.orders for select using (auth.uid() = user_id);
create policy "users write own orders" on public.orders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users read own order items" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

-- Posts: read public, write own
create policy "users write own posts" on public.posts for insert with check (auth.uid() = author_id);
create policy "users update own posts" on public.posts for update using (auth.uid() = author_id);

-- Sessions log: own only
create policy "users read own sessions" on public.sessions_log for select using (auth.uid() = user_id);
create policy "users write own sessions" on public.sessions_log for insert with check (auth.uid() = user_id);
