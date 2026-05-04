-- Trainer timezone — required so the slot generator can anchor a coach's
-- wall-clock availability rules ("Mon 10:00–13:00") to the coach's actual
-- local time, not the server's UTC. Without this column a coach in LA who
-- sets "Mon 10am" would have their slots emitted at "Mon 10am UTC" — three
-- hours off for them and seven hours off for an ATL member.
--
-- Bookings continue to be stored as canonical UTC ISO strings; only the
-- expansion of recurring rules into concrete instants needs the coach's
-- timezone. Display always uses the viewer's local timezone via the
-- client-side <Time> component (src/components/site/Time.tsx).
--
-- Default: 'America/New_York' to match the existing Atlanta gym. Coaches
-- can edit via the trainer profile page.

alter table public.trainers
  add column if not exists timezone text not null default 'America/New_York';

-- Sanity-check known IANA tz names. Postgres can't validate IANA strings
-- directly without a function, but we can at least reject empty values.
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'trainers_timezone_nonempty'
  ) then
    alter table public.trainers
      add constraint trainers_timezone_nonempty
      check (length(trim(timezone)) > 0);
  end if;
end $$;
