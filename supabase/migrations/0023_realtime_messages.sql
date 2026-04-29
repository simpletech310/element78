-- Realtime DMs. Adding messages to the supabase_realtime publication lets
-- client subscriptions receive INSERT events as soon as a row is committed.
-- Threads don't need realtime; the messages table fan-out is enough.

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
