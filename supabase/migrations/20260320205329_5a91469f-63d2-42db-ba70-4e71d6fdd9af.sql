-- 1. Add new cost type enum values
ALTER TYPE public.cost_type ADD VALUE IF NOT EXISTS 'consultoria';
ALTER TYPE public.cost_type ADD VALUE IF NOT EXISTS 'frete_logistica';
ALTER TYPE public.cost_type ADD VALUE IF NOT EXISTS 'manutencao_infraestrutura';
ALTER TYPE public.cost_type ADD VALUE IF NOT EXISTS 'insumos_compras';

-- 2. Invert hierarchy: Talhão → Áreas
-- Add propriedade_id to talhoes (talhões now belong directly to propriedade)
ALTER TABLE public.talhoes ADD COLUMN IF NOT EXISTS propriedade_id uuid REFERENCES public.propriedade(id) ON DELETE SET NULL;

-- Add talhao_id to areas (áreas now belong to talhões)
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS talhao_id uuid REFERENCES public.talhoes(id) ON DELETE SET NULL;

-- Make area_id on talhoes nullable (deprecated column)
ALTER TABLE public.talhoes ALTER COLUMN area_id DROP NOT NULL;

-- Create indexes for new foreign keys
CREATE INDEX IF NOT EXISTS idx_talhoes_propriedade_id ON public.talhoes(propriedade_id);
CREATE INDEX IF NOT EXISTS idx_areas_talhao_id ON public.areas(talhao_id);