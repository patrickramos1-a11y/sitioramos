-- Tabela de alocação ciclo↔área com fração em tarefas físicas
CREATE TABLE IF NOT EXISTS public.cycle_area_allocations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id uuid NOT NULL,
  area_id uuid NOT NULL,
  ocupa_area_inteira boolean NOT NULL DEFAULT false,
  tarefas_ocupadas numeric NOT NULL DEFAULT 0,
  percentual numeric,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cycle_area_alloc_cycle ON public.cycle_area_allocations(cycle_id);
CREATE INDEX IF NOT EXISTS idx_cycle_area_alloc_area ON public.cycle_area_allocations(area_id);

ALTER TABLE public.cycle_area_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alloc_select" ON public.cycle_area_allocations FOR SELECT USING (true);
CREATE POLICY "alloc_insert" ON public.cycle_area_allocations FOR INSERT WITH CHECK (true);
CREATE POLICY "alloc_update" ON public.cycle_area_allocations FOR UPDATE USING (true);
CREATE POLICY "alloc_delete" ON public.cycle_area_allocations FOR DELETE USING (true);

CREATE TRIGGER trg_cycle_area_alloc_updated_at
  BEFORE UPDATE ON public.cycle_area_allocations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill: para cada ciclo existente com area_id, criar uma alocação "área inteira"
INSERT INTO public.cycle_area_allocations (cycle_id, area_id, ocupa_area_inteira, tarefas_ocupadas)
SELECT c.id, c.area_id, true, COALESCE(a.tamanho_hectares, 0) * 4
FROM public.cycles c
JOIN public.areas a ON a.id = c.area_id
WHERE c.area_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.cycle_area_allocations x
    WHERE x.cycle_id = c.id AND x.area_id = c.area_id
  );