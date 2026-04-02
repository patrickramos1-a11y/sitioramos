
-- Add parent_id for hierarchy (Operation > Sub-operation)
ALTER TABLE public.operational_stages 
ADD COLUMN parent_id uuid REFERENCES public.operational_stages(id) ON DELETE CASCADE;

-- Add custo_total for cost consolidation
ALTER TABLE public.operational_stages 
ADD COLUMN custo_total numeric DEFAULT 0;

-- Add parent_task_id for sub-tasks
ALTER TABLE public.operational_tasks 
ADD COLUMN parent_task_id uuid REFERENCES public.operational_tasks(id) ON DELETE CASCADE;

-- Index for faster hierarchy queries
CREATE INDEX idx_stages_parent_id ON public.operational_stages(parent_id);
CREATE INDEX idx_tasks_parent_task_id ON public.operational_tasks(parent_task_id);
CREATE INDEX idx_stages_cycle_area ON public.operational_stages(cycle_id, area_id);
CREATE INDEX idx_tasks_stage_id ON public.operational_tasks(stage_id);
