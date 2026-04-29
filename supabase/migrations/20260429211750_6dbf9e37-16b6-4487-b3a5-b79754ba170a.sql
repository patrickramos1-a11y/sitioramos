-- Ampliar enum stage_status com novos status
ALTER TYPE stage_status ADD VALUE IF NOT EXISTS 'planejada';
ALTER TYPE stage_status ADD VALUE IF NOT EXISTS 'travada';
ALTER TYPE stage_status ADD VALUE IF NOT EXISTS 'cancelada';
ALTER TYPE stage_status ADD VALUE IF NOT EXISTS 'reprogramada';

-- Tornar area_id e cycle_id opcionais
ALTER TABLE public.operational_stages ALTER COLUMN area_id DROP NOT NULL;
ALTER TABLE public.operational_stages ALTER COLUMN cycle_id DROP NOT NULL;

-- Novos campos
ALTER TABLE public.operational_stages
  ADD COLUMN IF NOT EXISTS categoria text,
  ADD COLUMN IF NOT EXISTS duracao_prevista_dias integer,
  ADD COLUMN IF NOT EXISTS depends_on_id uuid,
  ADD COLUMN IF NOT EXISTS cor_responsavel text;

-- Índice auxiliar para dependências
CREATE INDEX IF NOT EXISTS idx_operational_stages_depends_on ON public.operational_stages(depends_on_id);
CREATE INDEX IF NOT EXISTS idx_operational_stages_categoria ON public.operational_stages(categoria);