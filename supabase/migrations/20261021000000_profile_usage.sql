-- Profile (links, default model, active resume) and per-generation usage/cost.
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

-- Resume metadata + let users delete their own resumes.
alter table public.resume add column if not exists file_name text;
alter table public.resume add column if not exists created_at timestamptz not null default now();

drop policy if exists "Users delete own resumes" on public.resume;
create policy "Users delete own resumes" on public.resume
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- One profile row per user.
create table if not exists public.profiles (
  user_id uuid primary key default auth.uid()
    references auth.users (id) on delete cascade,
  portfolio_url text,
  github_url text,
  links jsonb not null default '[]'::jsonb,
  default_model text,
  active_resume_id bigint references public.resume (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Metadata for each generation (never the generated text).
create table if not exists public.generations (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  type text not null check (type in ('proposal', 'loom')),
  model text not null,
  prompt_tokens integer,
  completion_tokens integer,
  cost_usd numeric(12, 6) not null default 0,
  duration_ms integer,
  created_at timestamptz not null default now()
);

create index if not exists generations_user_created_idx
  on public.generations (user_id, created_at desc);

alter table public.generations enable row level security;

drop policy if exists "Users read own generations" on public.generations;
create policy "Users read own generations" on public.generations
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users insert own generations" on public.generations;
create policy "Users insert own generations" on public.generations
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
