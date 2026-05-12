-- Diary geometries: pontos soltos, linhas e polígonos do Diário de Campo
CREATE TABLE IF NOT EXISTS public.diary_geometries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL,
  geometry_type text NOT NULL CHECK (geometry_type IN ('point','line','polygon')),
  name text,
  description text,
  geojson jsonb NOT NULL,
  area_m2 numeric,
  length_m numeric,
  responsavel_id uuid,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diary_geometries_entry ON public.diary_geometries(entry_id);

ALTER TABLE public.diary_geometries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diary_geometries_select" ON public.diary_geometries FOR SELECT USING (true);
CREATE POLICY "diary_geometries_insert" ON public.diary_geometries FOR INSERT WITH CHECK (true);
CREATE POLICY "diary_geometries_update" ON public.diary_geometries FOR UPDATE USING (true);
CREATE POLICY "diary_geometries_delete" ON public.diary_geometries FOR DELETE USING (true);

CREATE TRIGGER trg_diary_geometries_updated_at
  BEFORE UPDATE ON public.diary_geometries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Estender journal_points para vincular vértices a uma geometria
ALTER TABLE public.journal_points
  ADD COLUMN IF NOT EXISTS geometry_id uuid,
  ADD COLUMN IF NOT EXISTS point_number integer,
  ADD COLUMN IF NOT EXISTS point_label text,
  ADD COLUMN IF NOT EXISTS order_index integer;

CREATE INDEX IF NOT EXISTS idx_journal_points_geometry ON public.journal_points(geometry_id);
