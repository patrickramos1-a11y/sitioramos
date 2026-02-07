
-- =============================================
-- MISSÃO 1: MODELO TERRITORIAL COMPLETO
-- Propriedade → Áreas → Talhões + Ambiental
-- =============================================

-- 1. Tabela PROPRIEDADE (nível máximo)
CREATE TABLE public.propriedade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  area_total_hectares NUMERIC NOT NULL,
  area_app_hectares NUMERIC NOT NULL DEFAULT 0,
  metros_rio_total NUMERIC NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.propriedade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propriedade readable" ON public.propriedade FOR SELECT USING (true);
CREATE POLICY "Propriedade insertable" ON public.propriedade FOR INSERT WITH CHECK (true);
CREATE POLICY "Propriedade updatable" ON public.propriedade FOR UPDATE USING (true);
CREATE POLICY "Propriedade deletable" ON public.propriedade FOR DELETE USING (true);

-- 2. Alterar tabela AREAS com campos ambientais e vínculo à propriedade
ALTER TABLE public.areas
  ADD COLUMN propriedade_id UUID REFERENCES public.propriedade(id) ON DELETE SET NULL,
  ADD COLUMN area_app_hectares NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN metros_rio NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN tipo TEXT NOT NULL DEFAULT 'produtiva';

-- 3. Tabela TALHÕES (unidade operacional dentro de áreas)
CREATE TABLE public.talhoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  area_total_hectares NUMERIC NOT NULL,
  area_produtiva_hectares NUMERIC NOT NULL DEFAULT 0,
  area_app_hectares NUMERIC NOT NULL DEFAULT 0,
  metros_rio NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativo',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.talhoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Talhoes readable" ON public.talhoes FOR SELECT USING (true);
CREATE POLICY "Talhoes insertable" ON public.talhoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Talhoes updatable" ON public.talhoes FOR UPDATE USING (true);
CREATE POLICY "Talhoes deletable" ON public.talhoes FOR DELETE USING (true);

-- 4. Tabela de EVENTOS TERRITORIAIS (histórico de fusões, divisões, expansões)
CREATE TABLE public.territorial_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  entidades_envolvidas JSONB,
  dados_antes JSONB,
  dados_depois JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.territorial_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "TerritorialEvents readable" ON public.territorial_events FOR SELECT USING (true);
CREATE POLICY "TerritorialEvents insertable" ON public.territorial_events FOR INSERT WITH CHECK (true);
CREATE POLICY "TerritorialEvents deletable" ON public.territorial_events FOR DELETE USING (true);

-- 5. Adicionar talhao_id nas tabelas financeiras
ALTER TABLE public.costs ADD COLUMN talhao_id UUID REFERENCES public.talhoes(id) ON DELETE SET NULL;
ALTER TABLE public.revenues ADD COLUMN talhao_id UUID REFERENCES public.talhoes(id) ON DELETE SET NULL;
ALTER TABLE public.investments ADD COLUMN talhao_id UUID REFERENCES public.talhoes(id) ON DELETE SET NULL;
ALTER TABLE public.cycles ADD COLUMN talhao_id UUID REFERENCES public.talhoes(id) ON DELETE SET NULL;
ALTER TABLE public.cash_transactions ADD COLUMN talhao_id UUID REFERENCES public.talhoes(id) ON DELETE SET NULL;

-- 6. Trigger para updated_at nas novas tabelas
CREATE TRIGGER update_propriedade_updated_at
  BEFORE UPDATE ON public.propriedade
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_talhoes_updated_at
  BEFORE UPDATE ON public.talhoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Índices para performance
CREATE INDEX idx_areas_propriedade_id ON public.areas(propriedade_id);
CREATE INDEX idx_talhoes_area_id ON public.talhoes(area_id);
CREATE INDEX idx_costs_talhao_id ON public.costs(talhao_id);
CREATE INDEX idx_revenues_talhao_id ON public.revenues(talhao_id);
CREATE INDEX idx_investments_talhao_id ON public.investments(talhao_id);
CREATE INDEX idx_cycles_talhao_id ON public.cycles(talhao_id);
CREATE INDEX idx_cash_transactions_talhao_id ON public.cash_transactions(talhao_id);
CREATE INDEX idx_territorial_events_tipo ON public.territorial_events(tipo);
