-- Prairie Life cloud saves
-- Run this in Supabase Dashboard -> SQL Editor -> New query.
create table if not exists public.player_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  character_name text not null default 'Character',
  save_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.player_saves enable row level security;

drop policy if exists "Players can read their own save" on public.player_saves;
create policy "Players can read their own save"
  on public.player_saves for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Players can create their own save" on public.player_saves;
create policy "Players can create their own save"
  on public.player_saves for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Players can update their own save" on public.player_saves;
create policy "Players can update their own save"
  on public.player_saves for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.player_saves to authenticated;
