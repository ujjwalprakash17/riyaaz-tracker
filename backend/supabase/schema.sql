-- Riyaaz tracker: Supabase database setup
-- Supabase dashboard > SQL Editor > New query me ye poori file paste karo aur Run dabao.
-- Isse dobara chalana safe hai.

-- Har user ki har entry (problem, topic, contest, settings) ek row hai.
-- Entry ka poora data `data` (jsonb) me rehta hai, isliye app badalne pe schema nahi badalna padta.
create table if not exists public.docs (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  id         text        not null check (char_length(id) between 1 and 120),
  kind       text        not null check (kind in ('problem', 'topic', 'contest', 'settings')),
  data       jsonb       not null default '{}'::jsonb check (pg_column_size(data) <= 262144),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists docs_user_kind_idx on public.docs (user_id, kind);

-- Row Level Security: har user sirf apni rows padh aur badal sakta hai.
-- Isi wajah se publishable/anon key frontend me rakhna safe hai.
alter table public.docs enable row level security;

drop policy if exists "docs_select_own" on public.docs;
create policy "docs_select_own" on public.docs
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "docs_insert_own" on public.docs;
create policy "docs_insert_own" on public.docs
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "docs_update_own" on public.docs;
create policy "docs_update_own" on public.docs
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "docs_delete_own" on public.docs;
create policy "docs_delete_own" on public.docs
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.docs to authenticated;
revoke all on public.docs from anon;

-- Realtime: phone pe kuch save karo to laptop pe khula page bhi turant update ho.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'docs'
  ) then
    alter publication supabase_realtime add table public.docs;
  end if;
end $$;
