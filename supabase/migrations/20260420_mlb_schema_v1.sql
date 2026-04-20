create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'analysis_confidence'
  ) then
    create type analysis_confidence as enum ('HIGH', 'MEDIUM', 'LOW');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'pick_recommendation'
  ) then
    create type pick_recommendation as enum ('OVER', 'UNDER', 'NO_BET');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'pick_result_status'
  ) then
    create type pick_result_status as enum ('PENDING', 'WIN', 'LOSS', 'VOID');
  end if;
end
$$;

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  bankroll numeric(12,2) not null default 0,
  stake_base_pct numeric(5,2) not null default 1.00,
  ev_threshold numeric(6,4) not null default 0.0400,
  max_daily_picks integer not null default 1,
  market text not null default 'TOTALS',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  game_pk bigint not null unique,
  game_date date not null,
  official_datetime timestamptz,
  home_team text not null,
  away_team text not null,
  venue text,
  status text not null,
  season integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_games_game_date on public.games (game_date);
create index if not exists idx_games_status on public.games (status);

create table if not exists public.game_inputs (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  home_rg numeric(6,3) not null,
  away_rg numeric(6,3) not null,
  home_pitcher text not null,
  away_pitcher text not null,
  home_era numeric(6,3) not null,
  away_era numeric(6,3) not null,
  line_total numeric(6,2) not null,
  over_odds numeric(6,3) not null,
  under_odds numeric(6,3) not null,
  data_confidence analysis_confidence not null default 'MEDIUM',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id)
);

create index if not exists idx_game_inputs_game_id on public.game_inputs (game_id);

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  expected_runs_home numeric(6,3) not null,
  expected_runs_away numeric(6,3) not null,
  expected_total numeric(6,3) not null,
  prob_over numeric(6,4) not null,
  prob_under numeric(6,4) not null,
  implied_prob_over numeric(6,4) not null,
  implied_prob_under numeric(6,4) not null,
  ev_over numeric(7,4) not null,
  ev_under numeric(7,4) not null,
  confidence analysis_confidence not null default 'MEDIUM',
  recommendation pick_recommendation not null default 'NO_BET',
  recommended_line numeric(6,2),
  recommended_odds numeric(6,3),
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id)
);

create index if not exists idx_analyses_game_id on public.analyses (game_id);
create index if not exists idx_analyses_recommendation on public.analyses (recommendation);

create table if not exists public.picks (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  pick_date date not null,
  market text not null default 'TOTALS',
  recommendation pick_recommendation not null,
  line numeric(6,2) not null,
  odds numeric(6,3) not null,
  ev numeric(7,4) not null,
  stake_pct numeric(5,2) not null,
  stake_amount numeric(12,2),
  confidence analysis_confidence not null default 'MEDIUM',
  reason text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_picks_pick_date on public.picks (pick_date);
create index if not exists idx_picks_game_id on public.picks (game_id);

create table if not exists public.results (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  pick_id uuid references public.picks(id) on delete set null,
  final_home_runs integer not null,
  final_away_runs integer not null,
  final_total integer generated always as (final_home_runs + final_away_runs) stored,
  result_status pick_result_status not null default 'PENDING',
  pnl numeric(12,2),
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id)
);

create index if not exists idx_results_game_id on public.results (game_id);
create index if not exists idx_results_pick_id on public.results (pick_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_settings_updated_at on public.settings;
create trigger set_settings_updated_at
before update on public.settings
for each row
execute function public.set_updated_at();

drop trigger if exists set_games_updated_at on public.games;
create trigger set_games_updated_at
before update on public.games
for each row
execute function public.set_updated_at();

drop trigger if exists set_game_inputs_updated_at on public.game_inputs;
create trigger set_game_inputs_updated_at
before update on public.game_inputs
for each row
execute function public.set_updated_at();

drop trigger if exists set_analyses_updated_at on public.analyses;
create trigger set_analyses_updated_at
before update on public.analyses
for each row
execute function public.set_updated_at();

drop trigger if exists set_picks_updated_at on public.picks;
create trigger set_picks_updated_at
before update on public.picks
for each row
execute function public.set_updated_at();

drop trigger if exists set_results_updated_at on public.results;
create trigger set_results_updated_at
before update on public.results
for each row
execute function public.set_updated_at();
