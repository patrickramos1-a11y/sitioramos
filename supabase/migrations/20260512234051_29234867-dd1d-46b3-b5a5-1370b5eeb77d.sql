
-- 1. Add new columns
ALTER TABLE public.cash_transactions
  ADD COLUMN IF NOT EXISTS subcategoria text,
  ADD COLUMN IF NOT EXISTS categoria_legada text;

-- 2. Preserve legacy categoria
UPDATE public.cash_transactions SET categoria_legada = categoria WHERE categoria_legada IS NULL;

-- 3. Backfill subcategoria from linked costs/investments/revenues
UPDATE public.cash_transactions ct
SET subcategoria = c.tipo::text
FROM public.costs c
WHERE ct.cost_id = c.id AND ct.subcategoria IS NULL;

UPDATE public.cash_transactions ct
SET subcategoria = i.tipo::text
FROM public.investments i
WHERE ct.investment_id = i.id AND ct.subcategoria IS NULL;

UPDATE public.cash_transactions ct
SET subcategoria = r.tipo_receita
FROM public.revenues r
WHERE ct.revenue_id = r.id AND ct.subcategoria IS NULL;

-- 4. Backfill subcategoria for transactions without source linkage, based on old categoria
UPDATE public.cash_transactions SET subcategoria = CASE categoria
  WHEN 'receita_venda' THEN 'venda'
  WHEN 'receita_aporte_socio' THEN 'aporte_socio'
  WHEN 'aporte' THEN 'aporte_socio'
  WHEN 'receita_emprestimo_bancario' THEN 'emprestimo_bancario'
  WHEN 'receita_outra' THEN 'outra'
  WHEN 'emprestimo_entrada' THEN 'recebimento_emprestimo'
  WHEN 'parcela_emprestimo' THEN 'parcela_emprestimo'
  WHEN 'quitacao_emprestimo' THEN 'quitacao_emprestimo'
  WHEN 'despesa_financeira' THEN 'despesa_financeira'
  WHEN 'transferencia' THEN 'transferencia'
  WHEN 'custo_operacional' THEN 'outros'
  WHEN 'investimento' THEN 'outros'
  ELSE subcategoria
END
WHERE subcategoria IS NULL;

-- 5. Drop old CHECK constraint
ALTER TABLE public.cash_transactions DROP CONSTRAINT IF EXISTS cash_transactions_categoria_check;

-- 6. Remap categoria to new 4-value model
UPDATE public.cash_transactions SET categoria = CASE categoria
  WHEN 'custo_operacional' THEN 'custo'
  WHEN 'investimento' THEN 'investimento'
  WHEN 'receita_venda' THEN 'receita'
  WHEN 'receita_aporte_socio' THEN 'receita'
  WHEN 'receita_emprestimo_bancario' THEN 'receita'
  WHEN 'receita_outra' THEN 'receita'
  WHEN 'aporte' THEN 'receita'
  WHEN 'emprestimo_entrada' THEN 'financeiro'
  WHEN 'parcela_emprestimo' THEN 'financeiro'
  WHEN 'quitacao_emprestimo' THEN 'financeiro'
  WHEN 'despesa_financeira' THEN 'financeiro'
  WHEN 'transferencia' THEN 'financeiro'
  ELSE categoria
END;

-- 7. New CHECK constraint
ALTER TABLE public.cash_transactions
  ADD CONSTRAINT cash_transactions_categoria_check
  CHECK (categoria IN ('custo','investimento','receita','financeiro'));

-- 8. Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_cash_transactions_categoria ON public.cash_transactions(categoria);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_subcategoria ON public.cash_transactions(subcategoria);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_area ON public.cash_transactions(area_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_cycle ON public.cash_transactions(cycle_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_data ON public.cash_transactions(data);

-- 9. Sync triggers: keep subcategoria mirrored from source tables on UPDATE
CREATE OR REPLACE FUNCTION public.sync_cash_subcategoria_from_cost()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.cash_transactions SET subcategoria = NEW.tipo::text
  WHERE cost_id = NEW.id AND subcategoria IS DISTINCT FROM NEW.tipo::text;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.sync_cash_subcategoria_from_investment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.cash_transactions SET subcategoria = NEW.tipo::text
  WHERE investment_id = NEW.id AND subcategoria IS DISTINCT FROM NEW.tipo::text;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.sync_cash_subcategoria_from_revenue()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.cash_transactions SET subcategoria = NEW.tipo_receita
  WHERE revenue_id = NEW.id AND subcategoria IS DISTINCT FROM NEW.tipo_receita;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sync_cash_sub_cost ON public.costs;
CREATE TRIGGER trg_sync_cash_sub_cost AFTER UPDATE OF tipo ON public.costs
FOR EACH ROW EXECUTE FUNCTION public.sync_cash_subcategoria_from_cost();

DROP TRIGGER IF EXISTS trg_sync_cash_sub_investment ON public.investments;
CREATE TRIGGER trg_sync_cash_sub_investment AFTER UPDATE OF tipo ON public.investments
FOR EACH ROW EXECUTE FUNCTION public.sync_cash_subcategoria_from_investment();

DROP TRIGGER IF EXISTS trg_sync_cash_sub_revenue ON public.revenues;
CREATE TRIGGER trg_sync_cash_sub_revenue AFTER UPDATE OF tipo_receita ON public.revenues
FOR EACH ROW EXECUTE FUNCTION public.sync_cash_subcategoria_from_revenue();
