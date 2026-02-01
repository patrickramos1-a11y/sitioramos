-- =============================================
-- MIGRAÇÃO: Sistema Financeiro Completo
-- =============================================

-- 1. CRIAR TABELA DE MOVIMENTAÇÕES DE CAIXA
CREATE TABLE public.cash_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  categoria TEXT NOT NULL CHECK (categoria IN (
    'emprestimo_entrada',      -- Recebimento de empréstimo
    'receita_venda',           -- Venda de produtos
    'aporte',                  -- Aporte de capital
    'custo_operacional',       -- Custos de produção
    'investimento',            -- Investimentos (infraestrutura, legalização)
    'parcela_emprestimo',      -- Pagamento de parcela
    'quitacao_emprestimo',     -- Quitação antecipada
    'despesa_financeira',      -- Juros e tarifas bancárias
    'transferencia'            -- Transferência entre empréstimos
  )),
  valor NUMERIC NOT NULL,
  descricao TEXT,
  
  -- Vínculos opcionais
  loan_id UUID REFERENCES public.loans(id) ON DELETE SET NULL,
  installment_id UUID REFERENCES public.installments(id) ON DELETE SET NULL,
  cost_id UUID REFERENCES public.costs(id) ON DELETE SET NULL,
  revenue_id UUID REFERENCES public.revenues(id) ON DELETE SET NULL,
  investment_id UUID REFERENCES public.investments(id) ON DELETE SET NULL,
  area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  cycle_id UUID REFERENCES public.cycles(id) ON DELETE SET NULL,
  
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. ADICIONAR NOVAS CATEGORIAS DE DESPESAS FINANCEIRAS
ALTER TYPE public.cost_type ADD VALUE IF NOT EXISTS 'juros_bancarios';
ALTER TYPE public.cost_type ADD VALUE IF NOT EXISTS 'tarifas_bancarias';

-- 3. ADICIONAR CAMPOS AO EMPRÉSTIMO PARA CONTROLE DE JUROS
ALTER TABLE public.loans 
ADD COLUMN IF NOT EXISTS valor_principal NUMERIC,
ADD COLUMN IF NOT EXISTS valor_juros_total NUMERIC,
ADD COLUMN IF NOT EXISTS creditado_caixa BOOLEAN DEFAULT false;

-- 4. ADICIONAR CAMPOS ÀS PARCELAS PARA SEPARAR JUROS
ALTER TABLE public.installments
ADD COLUMN IF NOT EXISTS valor_principal NUMERIC,
ADD COLUMN IF NOT EXISTS valor_juros NUMERIC;

-- 5. HABILITAR RLS NA TABELA DE MOVIMENTAÇÕES
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cash transactions are publicly readable"
  ON public.cash_transactions FOR SELECT
  USING (true);

CREATE POLICY "Cash transactions can be inserted"
  ON public.cash_transactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Cash transactions can be updated"
  ON public.cash_transactions FOR UPDATE
  USING (true);

CREATE POLICY "Cash transactions can be deleted"
  ON public.cash_transactions FOR DELETE
  USING (true);

-- 6. TRIGGER PARA ATUALIZAR updated_at
CREATE TRIGGER update_cash_transactions_updated_at
  BEFORE UPDATE ON public.cash_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_cash_transactions_data ON public.cash_transactions(data);
CREATE INDEX idx_cash_transactions_tipo ON public.cash_transactions(tipo);
CREATE INDEX idx_cash_transactions_categoria ON public.cash_transactions(categoria);
CREATE INDEX idx_cash_transactions_loan_id ON public.cash_transactions(loan_id);

-- 8. VIEW PARA SALDO DO CAIXA
CREATE OR REPLACE VIEW public.cash_balance AS
SELECT 
  COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END), 0) as total_entradas,
  COALESCE(SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END), 0) as total_saidas,
  COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END), 0) as saldo_atual
FROM public.cash_transactions;