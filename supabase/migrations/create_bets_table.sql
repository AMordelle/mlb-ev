-- Persist MLB bet records.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  date date NOT NULL,
  game_pk bigint NOT NULL,
  bet_type text NOT NULL,
  line numeric NOT NULL,
  odds integer NOT NULL,
  model_probability numeric NOT NULL,
  ev numeric NOT NULL,
  stake numeric NOT NULL,
  result text NOT NULL,
  closing_line numeric,
  closing_odds integer,
  bankroll_before numeric NOT NULL,
  bankroll_after numeric,
  CONSTRAINT bets_bet_type_check CHECK (bet_type IN ('OVER', 'UNDER')),
  CONSTRAINT bets_result_check CHECK (result IN ('PENDING', 'WIN', 'LOSS', 'PUSH'))
);

CREATE INDEX IF NOT EXISTS idx_bets_created_at ON public.bets (created_at);
CREATE INDEX IF NOT EXISTS idx_bets_date ON public.bets (date);
CREATE INDEX IF NOT EXISTS idx_bets_game_pk ON public.bets (game_pk);
CREATE INDEX IF NOT EXISTS idx_bets_result ON public.bets (result);
