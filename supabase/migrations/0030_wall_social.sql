-- 0030_wall_social.sql
-- Real, working Wall: extends posts, adds reactions/comments/highlights,
-- counter triggers, and a public storage bucket for image+video uploads.

-- =============================================================================
-- A1. Extend posts
-- =============================================================================
alter table public.posts
  add column if not exists media_type text check (media_type in ('image','video')),
  add column if not exists like_count int not null default 0,
  add column if not exists comment_count int not null default 0,
  add column if not exists location text;

create index if not exists idx_posts_kind_created_at on public.posts (kind, created_at desc);
create index if not exists idx_posts_created_at on public.posts (created_at desc);

-- =============================================================================
-- A2. post_reactions (heart-only)
-- =============================================================================
create table if not exists public.post_reactions (
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index if not exists idx_post_reactions_user on public.post_reactions(user_id);

alter table public.post_reactions enable row level security;

drop policy if exists "public read reactions"  on public.post_reactions;
drop policy if exists "users insert own react" on public.post_reactions;
drop policy if exists "users delete own react" on public.post_reactions;

create policy "public read reactions"  on public.post_reactions for select using (true);
create policy "users insert own react" on public.post_reactions for insert with check (auth.uid() = user_id);
create policy "users delete own react" on public.post_reactions for delete using (auth.uid() = user_id);

-- =============================================================================
-- A3. post_comments
-- =============================================================================
create table if not exists public.post_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  body       text not null check (length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists idx_post_comments_post_created on public.post_comments(post_id, created_at);

alter table public.post_comments enable row level security;

drop policy if exists "public read comments"      on public.post_comments;
drop policy if exists "users insert own comments" on public.post_comments;
drop policy if exists "users update own comments" on public.post_comments;
drop policy if exists "users delete own or admin" on public.post_comments;

create policy "public read comments" on public.post_comments for select using (true);

create policy "users insert own comments" on public.post_comments for insert
  with check (
    auth.uid() = author_id
    and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_banned)
  );

create policy "users update own comments" on public.post_comments for update
  using (auth.uid() = author_id);

create policy "users delete own or admin" on public.post_comments for delete
  using (
    auth.uid() = author_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- =============================================================================
-- A4. highlights (24h ephemeral video)
-- =============================================================================
create table if not exists public.highlights (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles(id) on delete cascade,
  media_url  text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);
create index if not exists idx_highlights_active on public.highlights(expires_at desc) where expires_at > now();

alter table public.highlights enable row level security;

drop policy if exists "public read active highlights" on public.highlights;
drop policy if exists "users insert own highlight"    on public.highlights;
drop policy if exists "users delete own highlight"    on public.highlights;

create policy "public read active highlights" on public.highlights for select using (expires_at > now());
create policy "users insert own highlight"    on public.highlights for insert with check (auth.uid() = author_id);
create policy "users delete own highlight"    on public.highlights for delete using (auth.uid() = author_id);

-- =============================================================================
-- A5. Counter triggers (keep posts.like_count / comment_count in sync)
-- =============================================================================
create or replace function public.bump_post_like_count() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.posts set like_count = greatest(0, like_count - 1) where id = old.post_id;
    return old;
  end if;
  return null;
end $$;

drop trigger if exists trg_post_reactions_count on public.post_reactions;
create trigger trg_post_reactions_count
  after insert or delete on public.post_reactions
  for each row execute function public.bump_post_like_count();

create or replace function public.bump_post_comment_count() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.posts set comment_count = greatest(0, comment_count - 1) where id = old.post_id;
    return old;
  end if;
  return null;
end $$;

drop trigger if exists trg_post_comments_count on public.post_comments;
create trigger trg_post_comments_count
  after insert or delete on public.post_comments
  for each row execute function public.bump_post_comment_count();

-- =============================================================================
-- A6. Storage bucket (public) for wall image+video uploads
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('wall-media', 'wall-media', true)
on conflict (id) do nothing;
