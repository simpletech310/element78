-- 0034_security_definer_counters.sql
-- The counter triggers shipped in 0030 (wall) and 0031 (challenges/events)
-- run in the invoker's auth context, so RLS blocks the cross-row UPDATE
-- (e.g. a member liking a coach's post, or a member joining a challenge whose
-- author trainer is someone else). Marking the functions SECURITY DEFINER
-- makes the trigger run with the role that defined it, bypassing RLS for the
-- counter writes — the data integrity is still safe because the inputs come
-- from RLS-protected tables.

alter function public.bump_post_like_count() security definer;
alter function public.bump_post_comment_count() security definer;

alter function public.bump_challenge_enrollment_count() security definer;
alter function public.bump_challenge_completion_count() security definer;
alter function public.bump_event_rsvp_counts() security definer;
alter function public.maybe_complete_challenge_enrollment() security definer;
alter function public.maybe_uncomplete_challenge_enrollment() security definer;

-- Backfill counters that drifted while triggers were silently failing.

-- posts.like_count from post_reactions
update public.posts p
   set like_count = coalesce((
     select count(*) from public.post_reactions r where r.post_id = p.id
   ), 0);

-- posts.comment_count from post_comments
update public.posts p
   set comment_count = coalesce((
     select count(*) from public.post_comments c where c.post_id = p.id
   ), 0);

-- For challenges where every task has been ticked by a member but
-- completed_at was never set (because the trigger was blocked), set it now to
-- the timestamp of their final task completion.
update public.challenge_enrollments e
   set completed_at = sub.last_completed_at
  from (
    select tc.user_id, tc.challenge_id, max(tc.completed_at) as last_completed_at, count(*) as done
      from public.challenge_task_completions tc
     group by tc.user_id, tc.challenge_id
  ) sub,
       (
    select challenge_id, count(*) as total
      from public.challenge_tasks
     group by challenge_id
  ) totals
 where e.user_id = sub.user_id
   and e.challenge_id = sub.challenge_id
   and e.challenge_id = totals.challenge_id
   and totals.total > 0
   and sub.done >= totals.total
   and e.completed_at is null;

-- challenges.enrollment_count from challenge_enrollments
update public.challenges c
   set enrollment_count = coalesce((
     select count(*) from public.challenge_enrollments e where e.challenge_id = c.id
   ), 0);

-- challenges.completion_count from challenge_enrollments where completed_at is set
update public.challenges c
   set completion_count = coalesce((
     select count(*) from public.challenge_enrollments e
      where e.challenge_id = c.id and e.completed_at is not null
   ), 0);

-- events.rsvp_count + paid_count from event_rsvps
update public.events ev
   set rsvp_count = coalesce((
         select count(*) from public.event_rsvps r where r.event_id = ev.id
       ), 0),
       paid_count = coalesce((
         select count(*) from public.event_rsvps r where r.event_id = ev.id and r.status = 'paid'
       ), 0);
