
-- Add installment frequency and first payment date to loans
ALTER TABLE public.loans 
  ADD COLUMN IF NOT EXISTS frequencia_parcela text NOT NULL DEFAULT 'mensal',
  ADD COLUMN IF NOT EXISTS data_primeira_parcela date;

-- Add talhao_id to cash_transactions for talhão-level filtering
ALTER TABLE public.cash_transactions 
  ADD COLUMN IF NOT EXISTS talhao_id uuid REFERENCES public.talhoes(id) ON DELETE SET NULL;
