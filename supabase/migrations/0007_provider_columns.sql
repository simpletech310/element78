-- Phase 2: real Stripe + 1-on-1 deep-link from program sessions.
-- Idempotent — safe to re-run.

alter table public.trainer_bookings
  add column if not exists stripe_session_id text,
  add column if not exists program_session_id uuid references public.program_sessions(id) on delete set null;

create index if not exists idx_tb_stripe_session_id
  on public.trainer_bookings(stripe_session_id) where stripe_session_id is not null;

create index if not exists idx_tb_program_session_id
  on public.trainer_bookings(program_session_id) where program_session_id is not null;

-- Store the trainer's slug so program detail pages can deep-link to /trainers/<slug>/book
-- without an extra round-trip to look it up.
alter table public.program_sessions
  add column if not exists trainer_slug_for_1on1 text;

-- Storage buckets: program-images (program/session heroes), trainer-uploads (avatars/etc).
insert into storage.buckets (id, name, public)
values ('program-images', 'program-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('trainer-uploads', 'trainer-uploads', true)
on conflict (id) do nothing;

-- Public read; authenticated users may write to a folder prefixed by their auth.uid().
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='public_read_program_images') then
    create policy public_read_program_images on storage.objects for select
      using (bucket_id in ('program-images','trainer-uploads'));
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='auth_write_own_uploads') then
    create policy auth_write_own_uploads on storage.objects for insert
      with check (
        bucket_id in ('program-images','trainer-uploads')
        and auth.uid() is not null
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='auth_update_own_uploads') then
    create policy auth_update_own_uploads on storage.objects for update
      using (
        bucket_id in ('program-images','trainer-uploads')
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end $$;
