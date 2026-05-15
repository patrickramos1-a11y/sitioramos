-- Cycle stages table
CREATE TABLE public.cycle_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  inicio_relativo_dias INTEGER NOT NULL DEFAULT 0,
  duracao_dias INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'nao_iniciada',
  responsavel_id UUID,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cycle_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cycle_stages_select" ON public.cycle_stages FOR SELECT USING (true);
CREATE POLICY "cycle_stages_insert" ON public.cycle_stages FOR INSERT WITH CHECK (true);
CREATE POLICY "cycle_stages_update" ON public.cycle_stages FOR UPDATE USING (true);
CREATE POLICY "cycle_stages_delete" ON public.cycle_stages FOR DELETE USING (true);

CREATE INDEX idx_cycle_stages_cycle ON public.cycle_stages(cycle_id);

CREATE TRIGGER update_cycle_stages_updated_at
  BEFORE UPDATE ON public.cycle_stages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Cycle total duration
ALTER TABLE public.cycles ADD COLUMN IF NOT EXISTS duracao_total_dias INTEGER;

-- Linking tasks/transactions/journal entries to a cycle stage
ALTER TABLE public.operational_tasks ADD COLUMN IF NOT EXISTS cycle_stage_id UUID;
ALTER TABLE public.cash_transactions ADD COLUMN IF NOT EXISTS cycle_stage_id UUID;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS cycle_stage_id UUID;

CREATE INDEX IF NOT EXISTS idx_op_tasks_stage ON public.operational_tasks(cycle_stage_id);
CREATE INDEX IF NOT EXISTS idx_cash_tx_stage ON public.cash_transactions(cycle_stage_id);
CREATE INDEX IF NOT EXISTS idx_journal_stage ON public.journal_entries(cycle_stage_id);