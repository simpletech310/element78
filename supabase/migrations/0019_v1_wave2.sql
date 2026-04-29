-- Wave 2: messaging, per-client notes, program announcements, coach applications,
-- editable class metadata. Idempotent.

------------------------------------------------------------------------------
-- 1. Threads + messages (DMs between any two users — gating to coach<->client
--    pairs is enforced at the action layer, not in schema)
------------------------------------------------------------------------------

create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  -- canonical participants are stored sorted so we can dedupe a thread
  -- between A and B regardless of who started it.
  participant_a uuid not null references auth.users(id) on delete cascade,
  participant_b uuid not null references auth.users(id) on delete cascade,
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz not null default now(),
  check (participant_a < participant_b)
);
create unique index if not exists idx_threads_pair on public.threads(participant_a, participant_b);
create index if not exists idx_threads_a_last on public.threads(participant_a, last_message_at desc nulls last);
create index if not exists idx_threads_b_last on public.threads(participant_b, last_message_at desc nulls last);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(body) > 0 and length(body) <= 8000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists idx_messages_thread_created on public.messages(thread_id, created_at desc);
create index if not exists idx_messages_unread on public.messages(thread_id, sender_id) where read_at is null;

alter table public.threads enable row level security;
alter table public.messages enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='threads' and policyname='threads_participants_rw') then
    create policy threads_participants_rw on public.threads for all
      using (auth.uid() = participant_a or auth.uid() = participant_b)
      with check (auth.uid() = participant_a or auth.uid() = participant_b);
  end if;
  if not exists (select 1 from pg_policies where tablename='messages' and policyname='messages_participants_rw') then
    create policy messages_participants_rw on public.messages for all
      using (
        exists (
          select 1 from public.threads t
          where t.id = messages.thread_id
            and (t.participant_a = auth.uid() or t.participant_b = auth.uid())
        )
      )
      with check (
        sender_id = auth.uid() and exists (
          select 1 from public.threads t
          where t.id = messages.thread_id
            and (t.participant_a = auth.uid() or t.participant_b = auth.uid())
        )
      );
  end if;
end $$;

------------------------------------------------------------------------------
-- 2. Coach-only persistent notes about a client (CRM-style sticky notes,
--    invisible to the client)
------------------------------------------------------------------------------

create table if not exists public.coach_client_notes (
  id uuid primary key default gen_random_uuid(),
  coach_trainer_id uuid not null references public.trainers(id) on delete cascade,
  client_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(body) <= 8000),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create unique index if not exists idx_coach_client_notes_pair
  on public.coach_client_notes(coach_trainer_id, client_user_id);

alter table public.coach_client_notes enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='coach_client_notes' and policyname='ccn_coach_only_rw') then
    create policy ccn_coach_only_rw on public.coach_client_notes for all
      using (exists (
        select 1 from public.trainers t
        where t.id = coach_client_notes.coach_trainer_id
          and t.auth_user_id = auth.uid()
      ))
      with check (exists (
        select 1 from public.trainers t
        where t.id = coach_client_notes.coach_trainer_id
          and t.auth_user_id = auth.uid()
      ));
  end if;
end $$;

------------------------------------------------------------------------------
-- 3. Program announcements (coach broadcasts to enrolled members)
------------------------------------------------------------------------------

create table if not exists public.program_announcements (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  author_trainer_id uuid not null references public.trainers(id) on delete cascade,
  title text not null check (length(title) <= 200),
  body text not null check (length(body) <= 4000),
  created_at timestamptz not null default now()
);
create index if not exists idx_program_announcements_program
  on public.program_announcements(program_id, created_at desc);

alter table public.program_announcements enable row level security;

do $$ begin
  -- Anyone enrolled in the program (or the program author) can read.
  if not exists (select 1 from pg_policies where tablename='program_announcements' and policyname='pa_read_enrolled') then
    create policy pa_read_enrolled on public.program_announcements for select
      using (
        exists (
          select 1 from public.program_enrollments e
          where e.program_id = program_announcements.program_id
            and e.user_id = auth.uid()
        )
        or exists (
          select 1 from public.trainers t
          where t.id = program_announcements.author_trainer_id
            and t.auth_user_id = auth.uid()
        )
      );
  end if;
  -- Only the program's author trainer can write.
  if not exists (select 1 from pg_policies where tablename='program_announcements' and policyname='pa_author_write') then
    create policy pa_author_write on public.program_announcements for all
      using (exists (
        select 1 from public.trainers t
        where t.id = program_announcements.author_trainer_id
          and t.auth_user_id = auth.uid()
      ))
      with check (exists (
        select 1 from public.trainers t
        where t.id = program_announcements.author_trainer_id
          and t.auth_user_id = auth.uid()
      ));
  end if;
end $$;

------------------------------------------------------------------------------
-- 4. Coach applications (self-serve signup → admin review)
------------------------------------------------------------------------------

create table if not exists public.coach_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  headline text,
  bio text,
  specialties jsonb not null default '[]'::jsonb,
  certifications text,
  years_experience int,
  sample_video_url text,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','withdrawn')),
  reviewer_id uuid references auth.users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  trainer_id uuid references public.trainers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_coach_applications_user on public.coach_applications(user_id);
create index if not exists idx_coach_applications_status on public.coach_applications(status, created_at desc);
-- One pending app per user at a time.
create unique index if not exists idx_coach_applications_one_pending
  on public.coach_applications(user_id) where status = 'pending';

alter table public.coach_applications enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='coach_applications' and policyname='ca_owner_rw') then
    create policy ca_owner_rw on public.coach_applications for all
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
  -- Admins read/write all (handled via service-role calls in admin-actions).
end $$;
