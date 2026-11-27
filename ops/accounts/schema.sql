-- Lift Log accounts: one private backup row per user.
-- Run once: Supabase dashboard -> SQL Editor -> New query -> paste all of this -> Run.

create table if not exists public.liftlog_data (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row-level security: each signed-in user can only see and change their own row.
alter table public.liftlog_data enable row level security;

drop policy if exists "own row: read"   on public.liftlog_data;
drop policy if exists "own row: insert" on public.liftlog_data;
drop policy if exists "own row: update" on public.liftlog_data;
drop policy if exists "own row: delete" on public.liftlog_data;
create policy "own row: read"   on public.liftlog_data for select to authenticated using ((select auth.uid()) = user_id);
create policy "own row: insert" on public.liftlog_data for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own row: update" on public.liftlog_data for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own row: delete" on public.liftlog_data for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.liftlog_data to authenticated;
revoke all on public.liftlog_data from anon;

-- "Delete my account" button: removes the user's login, and their backup with it (cascade).
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from auth.users where id = auth.uid();
end; $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
