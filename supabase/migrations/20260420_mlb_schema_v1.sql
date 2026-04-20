-- MLB EV+ schema foundation v1

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'analysis_confidence'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.analysis_confidence AS ENUM ('HIGH', 'MEDIUM', 'LOW');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'pick_recommendation'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.pick_recommendation AS ENUM ('OVER', 'UNDER', 'NO_BET');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'pick_result_status'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.pick_result_status AS ENUM ('PENDING', 'WIN', 'LOSS', 'VOID');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bankroll numeric(12,2) NOT NULL DEFAULT 0,
  stake_base_pct numeric(5,2) NOT NULL DEFAULT 1.00,
  ev_threshold numeric(6,4) NOT NULL DEFAULT 0.0400,
  max_daily_picks integer NOT NULL DEFAULT 1,
  market text NOT NULL DEFAULT 'TOTALS',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_pk bigint NOT NULL UNIQUE,
  game_date date NOT NULL,
  official_datetime timestamptz,
  home_team text NOT NULL,
  away_team text NOT NULL,
  venue text,
  status text NOT NULL,
  season integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_games_game_date ON public.games (game_date);
CREATE INDEX IF NOT EXISTS idx_games_status ON public.games (status);

CREATE TABLE IF NOT EXISTS public.game_inputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  home_rg numeric(6,3) NOT NULL,
  away_rg numeric(6,3) NOT NULL,
  home_pitcher text NOT NULL,
  away_pitcher text NOT NULL,
  home_era numeric(6,3) NOT NULL,
  away_era numeric(6,3) NOT NULL,
  line_total numeric(6,2) NOT NULL,
  over_odds numeric(6,3) NOT NULL,
  under_odds numeric(6,3) NOT NULL,
  data_confidence public.analysis_confidence NOT NULL DEFAULT 'MEDIUM',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id)
);

CREATE INDEX IF NOT EXISTS idx_game_inputs_game_id ON public.game_inputs (game_id);

CREATE TABLE IF NOT EXISTS public.analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  expected_runs_home numeric(6,3) NOT NULL,
  expected_runs_away numeric(6,3) NOT NULL,
  expected_total numeric(6,3) NOT NULL,
  prob_over numeric(6,4) NOT NULL,
  prob_under numeric(6,4) NOT NULL,
  implied_prob_over numeric(6,4) NOT NULL,
  implied_prob_under numeric(6,4) NOT NULL,
  ev_over numeric(7,4) NOT NULL,
  ev_under numeric(7,4) NOT NULL,
  confidence public.analysis_confidence NOT NULL DEFAULT 'MEDIUM',
  recommendation public.pick_recommendation NOT NULL DEFAULT 'NO_BET',
  recommended_line numeric(6,2),
  recommended_odds numeric(6,3),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id)
);

CREATE INDEX IF NOT EXISTS idx_analyses_game_id ON public.analyses (game_id);
CREATE INDEX IF NOT EXISTS idx_analyses_recommendation ON public.analyses (recommendation);

CREATE TABLE IF NOT EXISTS public.picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  pick_date date NOT NULL,
  market text NOT NULL DEFAULT 'TOTALS',
  recommendation public.pick_recommendation NOT NULL,
  line numeric(6,2) NOT NULL,
  odds numeric(6,3) NOT NULL,
  ev numeric(7,4) NOT NULL,
  stake_pct numeric(5,2) NOT NULL,
  stake_amount numeric(12,2),
  confidence public.analysis_confidence NOT NULL DEFAULT 'MEDIUM',
  reason text,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_picks_pick_date ON public.picks (pick_date);
CREATE INDEX IF NOT EXISTS idx_picks_game_id ON public.picks (game_id);

CREATE TABLE IF NOT EXISTS public.results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  pick_id uuid REFERENCES public.picks(id) ON DELETE SET NULL,
  final_home_runs integer NOT NULL,
  final_away_runs integer NOT NULL,
  final_total integer GENERATED ALWAYS AS (final_home_runs + final_away_runs) STORED,
  result_status public.pick_result_status NOT NULL DEFAULT 'PENDING',
  pnl numeric(12,2),
  settled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id)
);

CREATE INDEX IF NOT EXISTS idx_results_game_id ON public.results (game_id);
CREATE INDEX IF NOT EXISTS idx_results_pick_id ON public.results (pick_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_settings_updated_at ON public.settings;
CREATE TRIGGER set_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_games_updated_at ON public.games;
CREATE TRIGGER set_games_updated_at
BEFORE UPDATE ON public.games
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_game_inputs_updated_at ON public.game_inputs;
CREATE TRIGGER set_game_inputs_updated_at
BEFORE UPDATE ON public.game_inputs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_analyses_updated_at ON public.analyses;
CREATE TRIGGER set_analyses_updated_at
BEFORE UPDATE ON public.analyses
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_picks_updated_at ON public.picks;
CREATE TRIGGER set_picks_updated_at
BEFORE UPDATE ON public.picks
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_results_updated_at ON public.results;
CREATE TRIGGER set_results_updated_at
BEFORE UPDATE ON public.results
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
