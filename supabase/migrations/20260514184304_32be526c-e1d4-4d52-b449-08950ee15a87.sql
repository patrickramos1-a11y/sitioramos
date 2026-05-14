ALTER TABLE public.fin_classificacoes
  ADD COLUMN IF NOT EXISTS loan_id uuid,
  ADD COLUMN IF NOT EXISTS installment_id uuid,
  ADD COLUMN IF NOT EXISTS tipo_evento_emprestimo text;

CREATE UNIQUE INDEX IF NOT EXISTS fin_classificacoes_cash_tx_uniq
  ON public.fin_classificacoes(cash_transaction_id);

CREATE INDEX IF NOT EXISTS fin_classificacoes_loan_idx
  ON public.fin_classificacoes(loan_id);

CREATE INDEX IF NOT EXISTS fin_classificacoes_installment_idx
  ON public.fin_classificacoes(installment_id);

INSERT INTO public.fin_categorias (codigo, nome, natureza_id, centro_custo_id, ordem)
SELECT 'de_pagamento_emprestimo', 'Pagamento de Empréstimo',
  (SELECT id FROM public.fin_naturezas WHERE codigo = 'despesa_geral'),
  (SELECT id FROM public.fin_centros_custo WHERE codigo = 'administracao'),
  100
WHERE NOT EXISTS (SELECT 1 FROM public.fin_categorias WHERE codigo = 'de_pagamento_emprestimo');

INSERT INTO public.fin_categorias (codigo, nome, natureza_id, centro_custo_id, ordem)
SELECT 'de_amortizacao_emprestimo', 'Amortização de Empréstimo',
  (SELECT id FROM public.fin_naturezas WHERE codigo = 'despesa_geral'),
  (SELECT id FROM public.fin_centros_custo WHERE codigo = 'administracao'),
  101
WHERE NOT EXISTS (SELECT 1 FROM public.fin_categorias WHERE codigo = 'de_amortizacao_emprestimo');