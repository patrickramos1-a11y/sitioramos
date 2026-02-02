-- Corrigir view para usar security_invoker
DROP VIEW IF EXISTS public.cash_balance;

CREATE VIEW public.cash_balance
WITH (security_invoker = on) AS
SELECT 
  COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END), 0) as total_entradas,
  COALESCE(SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END), 0) as total_saidas,
  COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END), 0) as saldo_atual
FROM public.cash_transactions;