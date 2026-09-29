-- Phase 1: server-authoritative session engine.
alter table public.sessions
  add column if not exists version bigint not null default 0;

create table if not exists public.session_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  command text not null,
  delta_seconds integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists session_events_session_idx
  on public.session_events(session_id, created_at desc);

alter table public.session_events enable row level security;

drop policy if exists session_events_owner on public.session_events;
create policy session_events_owner on public.session_events for select
using (owner_id = auth.uid());

create or replace function public.session_remaining_seconds(p_session public.sessions)
returns integer
language plpgsql
stable
set search_path = public
as $$
begin
  if p_session.status <> 'running' or p_session.server_started_at is null then
    return greatest(0, p_session.remaining_seconds);
  end if;

  return greatest(
    0,
    p_session.remaining_seconds
      - floor(extract(epoch from (clock_timestamp() - p_session.server_started_at)))::integer
  );
end;
$$;

create or replace function public.session_command(
  p_session_id uuid,
  p_command text,
  p_delta integer default 0
)
returns public.sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.sessions;
  next_index integer;
  current_remaining integer;
  duration_seconds integer;
begin
  select * into s
  from public.sessions
  where id = p_session_id
    and owner_id = auth.uid()
  for update;

  if not found then
    raise exception 'Session not found or not owned by current user';
  end if;

  current_remaining := public.session_remaining_seconds(s);

  if p_command = 'START' then
    if s.status = 'finished' then
      raise exception 'Finished session cannot be started';
    end if;
    s.status := 'running';
    s.remaining_seconds := current_remaining;
    s.server_started_at := clock_timestamp();

  elsif p_command = 'PAUSE' then
    s.status := 'paused';
    s.remaining_seconds := current_remaining;
    s.server_started_at := null;

  elsif p_command = 'TIME_ADJUST' then
    s.remaining_seconds := greatest(0, current_remaining + p_delta);
    if s.status = 'running' then
      s.server_started_at := clock_timestamp();
    end if;

  elsif p_command = 'PLAYER_INCREMENT' then
    s.remaining_players := least(s.total_entries, s.remaining_players + 1);

  elsif p_command = 'PLAYER_DECREMENT' then
    s.remaining_players := greatest(0, s.remaining_players - 1);

  elsif p_command = 'RESET' then
    select coalesce(tl.minutes, 10) * 60 into duration_seconds
    from public.tournament_levels tl
    where tl.tournament_id = s.tournament_id
      and tl.position = 0;

    s.status := 'ready';
    s.current_index := 0;
    s.remaining_seconds := coalesce(duration_seconds, 600);
    s.server_started_at := null;

  elsif p_command in ('NEXT', 'PREV') then
    if p_command = 'NEXT' then
      next_index := s.current_index + 1;
    else
      next_index := greatest(0, s.current_index - 1);
    end if;

    select coalesce(tl.minutes, 10) * 60 into duration_seconds
    from public.tournament_levels tl
    where tl.tournament_id = s.tournament_id
      and tl.position = next_index;

    if p_command = 'NEXT' and duration_seconds is null then
      s.status := 'finished';
      s.remaining_seconds := 0;
      s.server_started_at := null;
    else
      s.current_index := next_index;
      s.remaining_seconds := coalesce(duration_seconds, 600);
      if s.status = 'running' then
        s.server_started_at := clock_timestamp();
      else
        s.server_started_at := null;
      end if;
    end if;

  else
    raise exception 'Unsupported session command: %', p_command;
  end if;

  s.version := s.version + 1;
  s.updated_at := clock_timestamp();

  update public.sessions
  set status = s.status,
      current_index = s.current_index,
      remaining_seconds = s.remaining_seconds,
      server_started_at = s.server_started_at,
      remaining_players = s.remaining_players,
      version = s.version,
      updated_at = s.updated_at
  where id = s.id;

  insert into public.session_events(session_id, owner_id, command, delta_seconds)
  values(s.id, s.owner_id, p_command, p_delta);

  return s;
end;
$$;

create or replace function public.tick_session(p_session_id uuid)
returns public.sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.sessions;
  elapsed integer;
  next_index integer;
  next_duration integer;
  guard_count integer := 0;
begin
  select * into s
  from public.sessions
  where id = p_session_id
    and owner_id = auth.uid()
  for update;

  if not found then
    raise exception 'Session not found or not owned by current user';
  end if;

  if s.status <> 'running' or s.server_started_at is null then
    return s;
  end if;

  elapsed := greatest(
    0,
    floor(extract(epoch from (clock_timestamp() - s.server_started_at)))::integer
  );

  while elapsed >= s.remaining_seconds and s.status = 'running' loop
    elapsed := elapsed - s.remaining_seconds;
    next_index := s.current_index + 1;

    select (coalesce(tl.minutes, 10) * 60)
      into next_duration
    from public.tournament_levels tl
    where tl.tournament_id = s.tournament_id
      and tl.position = next_index;

    if next_duration is null then
      s.status := 'finished';
      s.remaining_seconds := 0;
      s.server_started_at := null;
      exit;
    end if;

    s.current_index := next_index;
    s.remaining_seconds := next_duration;
    s.server_started_at := clock_timestamp();
    guard_count := guard_count + 1;

    if guard_count > 100 then
      raise exception 'Session contains too many expired levels';
    end if;
  end loop;

  if s.status = 'running' then
    s.remaining_seconds := greatest(0, s.remaining_seconds - elapsed);
    s.server_started_at := clock_timestamp();
  end if;

  s.version := s.version + 1;
  s.updated_at := clock_timestamp();

  update public.sessions
  set status = s.status,
      current_index = s.current_index,
      remaining_seconds = s.remaining_seconds,
      server_started_at = s.server_started_at,
      version = s.version,
      updated_at = s.updated_at
  where id = s.id;

  return s;
end;
$$;

revoke all on function public.session_command(uuid, text, integer) from public;
revoke all on function public.tick_session(uuid) from public;
grant execute on function public.session_command(uuid, text, integer) to authenticated;
grant execute on function public.tick_session(uuid) to authenticated;
