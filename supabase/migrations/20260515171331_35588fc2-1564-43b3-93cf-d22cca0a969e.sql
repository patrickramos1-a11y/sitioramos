
-- Schema additions for cycle_stages
ALTER TABLE public.cycle_stages
  ADD COLUMN IF NOT EXISTS inicio_relativo_dias_min integer,
  ADD COLUMN IF NOT EXISTS data_inicio_real date,
  ADD COLUMN IF NOT EXISTS data_fim_real date,
  ADD COLUMN IF NOT EXISTS motivo_reprogramacao text,
  ADD COLUMN IF NOT EXISTS atividade text;

-- History table for stage actions
CREATE TABLE IF NOT EXISTS public.cycle_stage_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_id uuid,
  cycle_id uuid,
  acao text NOT NULL,
  dados jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cycle_stage_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "history_select" ON public.cycle_stage_history FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "history_insert" ON public.cycle_stage_history FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_cycle_stage_history_stage ON public.cycle_stage_history(stage_id);
CREATE INDEX IF NOT EXISTS idx_cycle_stage_history_cycle ON public.cycle_stage_history(cycle_id);
