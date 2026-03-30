
-- Enums for stages and tasks
CREATE TYPE public.stage_status AS ENUM ('nao_iniciada', 'em_andamento', 'concluida', 'atrasada', 'pausada');
CREATE TYPE public.task_status AS ENUM ('pendente', 'em_andamento', 'concluida', 'atrasada', 'cancelada', 'pausada');
CREATE TYPE public.priority_level AS ENUM ('baixa', 'media', 'alta', 'critica');
CREATE TYPE public.stage_type AS ENUM ('preparo', 'plantio', 'leiras', 'herbicida', 'capina', 'adubacao', 'colheita', 'beneficiamento', 'documentacao', 'manutencao', 'outro');
CREATE TYPE public.task_type AS ENUM ('operacional', 'compra', 'contratacao', 'documentacao', 'financeiro', 'manutencao', 'logistica', 'outro');

-- Operational Stages table
CREATE TABLE public.operational_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  propriedade_id UUID REFERENCES public.propriedade(id) ON DELETE SET NULL,
  talhao_id UUID REFERENCES public.talhoes(id) ON DELETE SET NULL,
  area_id UUID NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo public.stage_type NOT NULL DEFAULT 'outro',
  descricao TEXT,
  status public.stage_status NOT NULL DEFAULT 'nao_iniciada',
  prioridade public.priority_level DEFAULT 'media',
  data_inicio_prevista DATE,
  data_inicio_real DATE,
  data_fim_prevista DATE,
  data_fim_real DATE,
  responsavel TEXT,
  progresso_percentual NUMERIC DEFAULT 0,
  ordem INTEGER NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Operational Tasks table
CREATE TABLE public.operational_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  propriedade_id UUID REFERENCES public.propriedade(id) ON DELETE SET NULL,
  talhao_id UUID REFERENCES public.talhoes(id) ON DELETE SET NULL,
  area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  cycle_id UUID REFERENCES public.cycles(id) ON DELETE SET NULL,
  stage_id UUID REFERENCES public.operational_stages(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo public.task_type NOT NULL DEFAULT 'operacional',
  status public.task_status NOT NULL DEFAULT 'pendente',
  prioridade public.priority_level DEFAULT 'media',
  data_inicio_prevista DATE,
  data_inicio_real DATE,
  data_prazo DATE,
  data_conclusao DATE,
  responsavel TEXT,
  custo_estimado NUMERIC,
  custo_real NUMERIC,
  cash_transaction_id UUID,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stage Templates table
CREATE TABLE public.stage_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cultura TEXT NOT NULL,
  nome TEXT NOT NULL,
  tipo public.stage_type NOT NULL DEFAULT 'outro',
  ordem INTEGER NOT NULL DEFAULT 0,
  duracao_padrao_dias INTEGER,
  obrigatoria BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Task Logs table
CREATE TABLE public.task_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.operational_tasks(id) ON DELETE CASCADE,
  acao TEXT NOT NULL,
  valor_anterior JSONB,
  valor_novo JSONB,
  registrado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  registrado_por TEXT
);

-- Enable RLS
ALTER TABLE public.operational_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for operational_stages
CREATE POLICY "stages_select" ON public.operational_stages FOR SELECT TO public USING (true);
CREATE POLICY "stages_insert" ON public.operational_stages FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "stages_update" ON public.operational_stages FOR UPDATE TO public USING (true);
CREATE POLICY "stages_delete" ON public.operational_stages FOR DELETE TO public USING (true);

-- RLS Policies for operational_tasks
CREATE POLICY "tasks_select" ON public.operational_tasks FOR SELECT TO public USING (true);
CREATE POLICY "tasks_insert" ON public.operational_tasks FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "tasks_update" ON public.operational_tasks FOR UPDATE TO public USING (true);
CREATE POLICY "tasks_delete" ON public.operational_tasks FOR DELETE TO public USING (true);

-- RLS Policies for stage_templates
CREATE POLICY "templates_select" ON public.stage_templates FOR SELECT TO public USING (true);
CREATE POLICY "templates_insert" ON public.stage_templates FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "templates_update" ON public.stage_templates FOR UPDATE TO public USING (true);
CREATE POLICY "templates_delete" ON public.stage_templates FOR DELETE TO public USING (true);

-- RLS Policies for task_logs
CREATE POLICY "logs_select" ON public.task_logs FOR SELECT TO public USING (true);
CREATE POLICY "logs_insert" ON public.task_logs FOR INSERT TO public WITH CHECK (true);

-- Updated at triggers
CREATE TRIGGER update_operational_stages_updated_at BEFORE UPDATE ON public.operational_stages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_operational_tasks_updated_at BEFORE UPDATE ON public.operational_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates for mandioca
INSERT INTO public.stage_templates (cultura, nome, tipo, ordem, duracao_padrao_dias, obrigatoria) VALUES
  ('mandioca', 'Preparo da Área', 'preparo', 1, 15, true),
  ('mandioca', 'Leiras', 'leiras', 2, 5, false),
  ('mandioca', 'Plantio', 'plantio', 3, 7, true),
  ('mandioca', 'Aplicação de Herbicida', 'herbicida', 4, 3, false),
  ('mandioca', 'Capina', 'capina', 5, 7, false),
  ('mandioca', 'Adubação', 'adubacao', 6, 3, false),
  ('mandioca', 'Colheita', 'colheita', 7, 20, true),
  ('mandioca', 'Beneficiamento', 'beneficiamento', 8, 15, false);
