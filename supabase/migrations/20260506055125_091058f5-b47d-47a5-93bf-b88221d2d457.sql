
-- Create responsaveis table
CREATE TABLE public.responsaveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  apelido text,
  cor text NOT NULL DEFAULT '#22c55e',
  icone text,
  status text NOT NULL DEFAULT 'ativo',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "responsaveis_select" ON public.responsaveis FOR SELECT USING (true);
CREATE POLICY "responsaveis_insert" ON public.responsaveis FOR INSERT WITH CHECK (true);
CREATE POLICY "responsaveis_update" ON public.responsaveis FOR UPDATE USING (true);
CREATE POLICY "responsaveis_delete" ON public.responsaveis FOR DELETE USING (true);

CREATE TRIGGER trg_responsaveis_updated_at
  BEFORE UPDATE ON public.responsaveis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed Patrick & William
INSERT INTO public.responsaveis (nome, apelido, cor, icone) VALUES
  ('Patrick', 'Patrick', '#16a34a', 'User'),
  ('William', 'William', '#ea580c', 'User');

-- Add responsavel_id to relevant tables
ALTER TABLE public.operational_stages ADD COLUMN responsavel_id uuid;
ALTER TABLE public.operational_tasks ADD COLUMN responsavel_id uuid;
ALTER TABLE public.areas ADD COLUMN responsavel_id uuid;
ALTER TABLE public.talhoes ADD COLUMN responsavel_id uuid;
ALTER TABLE public.cycles ADD COLUMN responsavel_id uuid;
ALTER TABLE public.cash_transactions ADD COLUMN responsavel_id uuid;
ALTER TABLE public.costs ADD COLUMN responsavel_id uuid;
ALTER TABLE public.revenues ADD COLUMN responsavel_id uuid;
ALTER TABLE public.investments ADD COLUMN responsavel_id uuid;
ALTER TABLE public.loans ADD COLUMN responsavel_id uuid;
ALTER TABLE public.installments ADD COLUMN responsavel_id uuid;
