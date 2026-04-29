-- Coach-side check-in: let trainers (a) check anyone into a gym visit and
-- (b) flip a class booking to attended with attribution.

------------------------------------------------------------------------------
-- 1. Allow any trainer to insert into gym_check_ins on behalf of any user.
--    The user-row RLS policy from 0011 still restricts members to their own
--    inserts; this is an additional permissive policy for trainers only.
------------------------------------------------------------------------------

do $$ begin
  if not exists (select 1 from pg_policies where tablename='gym_check_ins' and policyname='gym_check_ins_coach_insert') then
    create policy gym_check_ins_coach_insert on public.gym_check_ins for insert
      with check (
        exists (select 1 from public.trainers t where t.auth_user_id = auth.uid())
      );
  end if;
end $$;

-- Coaches should also be able to read all check-ins (so the client detail
-- page can show check-in history regardless of who recorded it).
do $$ begin
  if not exists (select 1 from pg_policies where tablename='gym_check_ins' and policyname='gym_check_ins_coach_read') then
    create policy gym_check_ins_coach_read on public.gym_check_ins for select
      using (
        exists (select 1 from public.trainers t where t.auth_user_id = auth.uid())
      );
  end if;
end $$;

------------------------------------------------------------------------------
-- 2. Class-booking attendance attribution.
------------------------------------------------------------------------------

alter table public.bookings
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_in_by uuid references public.trainers(id) on delete set null;

create index if not exists idx_bookings_checked_in_class
  on public.bookings(class_id, checked_in_at)
  where checked_in_at is not null;
