create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan text not null default 'platinum' check (plan in ('free','bronze','silver','gold','platinum')),
  subscription_status text not null default 'trial' check (subscription_status in ('trial','active','paused','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  starting_stack integer not null default 10000,
  total_entries integer not null default 30,
  entry_fee numeric(10,2) not null default 600,
  brand_name text,
  brand_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tournament_levels (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  position integer not null,
  kind text not null default 'level' check (kind in ('level','break')),
  minutes integer not null default 10,
  sb integer,
  bb integer,
  ante integer default 0,
  unique(tournament_id, position)
);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  place integer not null,
  prize text not null default '',
  visible boolean not null default true,
  unique(tournament_id, place)
);

create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  name text not null,
  image_url text,
  enabled boolean not null default true,
  display_order integer not null default 1,
  interval_seconds integer not null default 10,
  duration_seconds integer not null default 8
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  pairing_code text not null unique,
  status text not null default 'ready' check (status in ('ready','running','paused','finished')),
  current_index integer not null default 0,
  remaining_seconds integer not null default 600,
  server_started_at timestamptz,
  remaining_players integer not null default 30,
  total_entries integer not null default 30,
  active_sponsor_id uuid references public.sponsors(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists tournaments_owner_idx on public.tournaments(owner_id);
create index if not exists sessions_pairing_code_idx on public.sessions(pairing_code);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id,email,plan,subscription_status)
  values(new.id,new.email,'platinum','trial')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.tournaments enable row level security;
alter table public.tournament_levels enable row level security;
alter table public.payouts enable row level security;
alter table public.sponsors enable row level security;
alter table public.sessions enable row level security;

create policy profiles_self on public.profiles for select using (id = auth.uid());

create policy tournaments_owner on public.tournaments for all
using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy levels_owner on public.tournament_levels for all
using (exists(select 1 from public.tournaments t where t.id=tournament_id and t.owner_id=auth.uid()))
with check (exists(select 1 from public.tournaments t where t.id=tournament_id and t.owner_id=auth.uid()));

create policy payouts_owner on public.payouts for all
using (exists(select 1 from public.tournaments t where t.id=tournament_id and t.owner_id=auth.uid()))
with check (exists(select 1 from public.tournaments t where t.id=tournament_id and t.owner_id=auth.uid()));

create policy sponsors_owner on public.sponsors for all
using (exists(select 1 from public.tournaments t where t.id=tournament_id and t.owner_id=auth.uid()))
with check (exists(select 1 from public.tournaments t where t.id=tournament_id and t.owner_id=auth.uid()));

create policy sessions_owner on public.sessions for all
using (owner_id=auth.uid()) with check (owner_id=auth.uid());

-- Public read is limited to non-finished sessions. Pairing codes should be rotated for production.
create policy sessions_public_display on public.sessions for select using (status <> 'finished');

alter publication supabase_realtime add table public.sessions;

-- TV display access: only data belonging to a non-finished live session is readable without organizer auth.
create policy tournaments_display on public.tournaments for select
using (exists(select 1 from public.sessions s where s.tournament_id=id and s.status <> 'finished'));

create policy levels_display on public.tournament_levels for select
using (exists(select 1 from public.sessions s where s.tournament_id=tournament_id and s.status <> 'finished'));

create policy payouts_display on public.payouts for select
using (exists(select 1 from public.sessions s where s.tournament_id=tournament_id and s.status <> 'finished'));

create policy sponsors_display on public.sponsors for select
using (exists(select 1 from public.sessions s where s.tournament_id=tournament_id and s.status <> 'finished'));
