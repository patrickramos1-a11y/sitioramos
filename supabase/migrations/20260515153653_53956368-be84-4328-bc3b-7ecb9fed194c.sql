
ALTER TABLE public.cycle_area_allocations
  ADD COLUMN IF NOT EXISTS allocation_type text NOT NULL DEFAULT 'full_area',
  ADD COLUMN IF NOT EXISTS hectares_ocupados numeric NOT NULL DEFAULT 0;

-- Backfill allocation_type based on existing fields
UPDATE public.cycle_area_allocations
SET allocation_type = CASE
  WHEN ocupa_area_inteira = true THEN 'full_area'
  WHEN percentual IS NOT NULL AND percentual > 0 THEN 'percentage'
  WHEN tarefas_ocupadas > 0 THEN 'tasks'
  ELSE 'full_area'
END
WHERE allocation_type = 'full_area' AND (
  ocupa_area_inteira = false OR percentual IS NOT NULL OR tarefas_ocupadas > 0
);

-- Backfill hectares_ocupados: derive from tarefas (1 tarefa = 0.25 ha) for non-full and non-manual rows
UPDATE public.cycle_area_allocations
SET hectares_ocupados = COALESCE(tarefas_ocupadas, 0) * 0.25
WHERE hectares_ocupados = 0 AND allocation_type IN ('tasks','percentage','manual_area');
