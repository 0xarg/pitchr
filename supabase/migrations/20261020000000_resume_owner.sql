-- Tie each resume to the user who uploaded it, and only let users see their own.
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

alter table public.resume
  add column if not exists user_id uuid
    references auth.users (id) on delete cascade
    default auth.uid();

create index if not exists resume_user_id_idx on public.resume (user_id);

alter table public.resume enable row level security;

drop policy if exists "Users read own resumes" on public.resume;
create policy "Users read own resumes" on public.resume
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users insert own resumes" on public.resume;
create policy "Users insert own resumes" on public.resume
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Optional: after signing in with Google once, claim resumes uploaded before
-- auth existed. Replace the email with your Google account's email.
-- update public.resume
--   set user_id = (select id from auth.users where email = 'you@example.com')
--   where user_id is null;
