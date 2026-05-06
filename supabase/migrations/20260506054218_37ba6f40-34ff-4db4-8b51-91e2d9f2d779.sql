
ALTER TABLE public.operational_stages
  ADD COLUMN IF NOT EXISTS nivel_tipo text NOT NULL DEFAULT 'projeto',
  ADD COLUMN IF NOT EXISTS linked_project_id uuid NULL;

CREATE TABLE IF NOT EXISTS public.task_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  texto text NOT NULL,
  concluido boolean NOT NULL DEFAULT false,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_checklist_items_task ON public.task_checklist_items(task_id);

ALTER TABLE public.task_checklist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checklist_select" ON public.task_checklist_items;
DROP POLICY IF EXISTS "checklist_insert" ON public.task_checklist_items;
DROP POLICY IF EXISTS "checklist_update" ON public.task_checklist_items;
DROP POLICY IF EXISTS "checklist_delete" ON public.task_checklist_items;

CREATE POLICY "checklist_select" ON public.task_checklist_items FOR SELECT USING (true);
CREATE POLICY "checklist_insert" ON public.task_checklist_items FOR INSERT WITH CHECK (true);
CREATE POLICY "checklist_update" ON public.task_checklist_items FOR UPDATE USING (true);
CREATE POLICY "checklist_delete" ON public.task_checklist_items FOR DELETE USING (true);

CREATE TRIGGER trg_checklist_updated_at
  BEFORE UPDATE ON public.task_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
