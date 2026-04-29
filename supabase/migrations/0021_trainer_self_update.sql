-- Trainers can update their own row. Without this, every UPDATE through the
-- user-context Supabase client silently affects 0 rows (RLS rejects it but
-- returns error: null), and `updateCoachProfileAction` falsely shows "saved".
-- Public read policy already exists from 0001_init.sql.

do $$ begin
  if not exists (select 1 from pg_policies where tablename='trainers' and policyname='trainers_update_own') then
    create policy trainers_update_own on public.trainers for update
      using (auth_user_id = auth.uid())
      with check (auth_user_id = auth.uid());
  end if;
end $$;
