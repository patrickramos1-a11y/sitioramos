-- ===========================================
-- PAINEL SÍTIO RAMOS - DATABASE SCHEMA
-- Sistema de Gestão Agrícola Completo
-- ===========================================

-- ENUMS para padronização
CREATE TYPE area_status AS ENUM ('planejamento', 'preparo', 'plantada', 'producao', 'colhida');
CREATE TYPE cycle_status AS ENUM ('planejamento', 'ativo', 'finalizado');
CREATE TYPE cost_type AS ENUM ('preparo_solo', 'mudas', 'adubacao', 'herbicida', 'mao_obra', 'combustivel', 'trator', 'outros');
CREATE TYPE payment_method AS ENUM ('dinheiro', 'emprestimo');
CREATE TYPE investment_type AS ENUM ('legalizacao', 'escritura', 'contratos', 'projetos', 'infraestrutura', 'outros');
CREATE TYPE loan_status AS ENUM ('ativo', 'quitado');
CREATE TYPE installment_status AS ENUM ('pendente', 'paga', 'atrasada');
CREATE TYPE unit_type AS ENUM ('kg', 'saca', 'unidade', 'tonelada');

-- ===========================================
-- 1. TABELA DE ÁREAS
-- ===========================================
CREATE TABLE public.areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tamanho_hectares DECIMAL(10, 2) NOT NULL,
  status area_status NOT NULL DEFAULT 'planejamento',
  cultura_principal TEXT,
  data_inicio DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Areas are publicly readable" ON public.areas
  FOR SELECT USING (true);

CREATE POLICY "Areas can be inserted" ON public.areas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Areas can be updated" ON public.areas
  FOR UPDATE USING (true);

CREATE POLICY "Areas can be deleted" ON public.areas
  FOR DELETE USING (true);

-- ===========================================
-- 2. TABELA DE CICLOS PRODUTIVOS
-- ===========================================
CREATE TABLE public.cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  area_id UUID NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  cultura TEXT NOT NULL,
  data_inicio_plantio DATE NOT NULL,
  data_prevista_colheita DATE,
  data_real_colheita DATE,
  status cycle_status NOT NULL DEFAULT 'planejamento',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cycles are publicly readable" ON public.cycles
  FOR SELECT USING (true);

CREATE POLICY "Cycles can be inserted" ON public.cycles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Cycles can be updated" ON public.cycles
  FOR UPDATE USING (true);

CREATE POLICY "Cycles can be deleted" ON public.cycles
  FOR DELETE USING (true);

-- ===========================================
-- 3. TABELA DE CUSTOS
-- ===========================================
CREATE TABLE public.costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  area_id UUID NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES public.cycles(id) ON DELETE SET NULL,
  data DATE NOT NULL,
  tipo cost_type NOT NULL,
  valor DECIMAL(12, 2) NOT NULL,
  forma_pagamento payment_method NOT NULL DEFAULT 'dinheiro',
  descricao TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Costs are publicly readable" ON public.costs
  FOR SELECT USING (true);

CREATE POLICY "Costs can be inserted" ON public.costs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Costs can be updated" ON public.costs
  FOR UPDATE USING (true);

CREATE POLICY "Costs can be deleted" ON public.costs
  FOR DELETE USING (true);

-- ===========================================
-- 4. TABELA DE INVESTIMENTOS
-- ===========================================
CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  data DATE NOT NULL,
  tipo investment_type NOT NULL,
  valor DECIMAL(12, 2) NOT NULL,
  descricao TEXT NOT NULL,
  rateado BOOLEAN NOT NULL DEFAULT false,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Investments are publicly readable" ON public.investments
  FOR SELECT USING (true);

CREATE POLICY "Investments can be inserted" ON public.investments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Investments can be updated" ON public.investments
  FOR UPDATE USING (true);

CREATE POLICY "Investments can be deleted" ON public.investments
  FOR DELETE USING (true);

-- ===========================================
-- 5. TABELA DE RECEITAS
-- ===========================================
CREATE TABLE public.revenues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  area_id UUID NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES public.cycles(id) ON DELETE SET NULL,
  data DATE NOT NULL,
  produto TEXT NOT NULL,
  quantidade DECIMAL(12, 3) NOT NULL,
  unidade unit_type NOT NULL DEFAULT 'kg',
  preco_unitario DECIMAL(12, 2) NOT NULL,
  valor_total DECIMAL(12, 2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
  cliente TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.revenues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Revenues are publicly readable" ON public.revenues
  FOR SELECT USING (true);

CREATE POLICY "Revenues can be inserted" ON public.revenues
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Revenues can be updated" ON public.revenues
  FOR UPDATE USING (true);

CREATE POLICY "Revenues can be deleted" ON public.revenues
  FOR DELETE USING (true);

-- ===========================================
-- 6. TABELA DE EMPRÉSTIMOS
-- ===========================================
CREATE TABLE public.loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  cycle_id UUID REFERENCES public.cycles(id) ON DELETE SET NULL,
  origem_credor TEXT NOT NULL,
  valor_total DECIMAL(12, 2) NOT NULL,
  data DATE NOT NULL,
  juros_percentual DECIMAL(5, 2) DEFAULT 0,
  numero_parcelas INTEGER NOT NULL DEFAULT 1,
  valor_parcela DECIMAL(12, 2) NOT NULL,
  status loan_status NOT NULL DEFAULT 'ativo',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Loans are publicly readable" ON public.loans
  FOR SELECT USING (true);

CREATE POLICY "Loans can be inserted" ON public.loans
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Loans can be updated" ON public.loans
  FOR UPDATE USING (true);

CREATE POLICY "Loans can be deleted" ON public.loans
  FOR DELETE USING (true);

-- ===========================================
-- 7. TABELA DE PARCELAS
-- ===========================================
CREATE TABLE public.installments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  numero_parcela INTEGER NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  valor DECIMAL(12, 2) NOT NULL,
  status installment_status NOT NULL DEFAULT 'pendente',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Installments are publicly readable" ON public.installments
  FOR SELECT USING (true);

CREATE POLICY "Installments can be inserted" ON public.installments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Installments can be updated" ON public.installments
  FOR UPDATE USING (true);

CREATE POLICY "Installments can be deleted" ON public.installments
  FOR DELETE USING (true);

-- ===========================================
-- FUNÇÃO PARA ATUALIZAR updated_at
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS PARA updated_at
CREATE TRIGGER update_areas_updated_at
  BEFORE UPDATE ON public.areas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cycles_updated_at
  BEFORE UPDATE ON public.cycles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_costs_updated_at
  BEFORE UPDATE ON public.costs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_investments_updated_at
  BEFORE UPDATE ON public.investments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_revenues_updated_at
  BEFORE UPDATE ON public.revenues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_installments_updated_at
  BEFORE UPDATE ON public.installments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- ÍNDICES PARA PERFORMANCE
-- ===========================================
CREATE INDEX idx_cycles_area ON public.cycles(area_id);
CREATE INDEX idx_costs_area ON public.costs(area_id);
CREATE INDEX idx_costs_cycle ON public.costs(cycle_id);
CREATE INDEX idx_costs_data ON public.costs(data);
CREATE INDEX idx_investments_area ON public.investments(area_id);
CREATE INDEX idx_revenues_area ON public.revenues(area_id);
CREATE INDEX idx_revenues_cycle ON public.revenues(cycle_id);
CREATE INDEX idx_loans_area ON public.loans(area_id);
CREATE INDEX idx_installments_loan ON public.installments(loan_id);
CREATE INDEX idx_installments_status ON public.installments(status);