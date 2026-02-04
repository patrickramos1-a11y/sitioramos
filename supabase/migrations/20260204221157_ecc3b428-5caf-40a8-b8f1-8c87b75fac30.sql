-- Add new columns for loan transparency
ALTER TABLE public.loans 
ADD COLUMN IF NOT EXISTS valor_recebido numeric,
ADD COLUMN IF NOT EXISTS descontos_iniciais numeric DEFAULT 0;

-- Update existing loans to set valor_recebido = valor_total where creditado_caixa is true
UPDATE public.loans 
SET valor_recebido = valor_total 
WHERE creditado_caixa = true AND valor_recebido IS NULL;

-- Comment on columns
COMMENT ON COLUMN public.loans.valor_recebido IS 'Valor líquido efetivamente recebido no caixa';
COMMENT ON COLUMN public.loans.descontos_iniciais IS 'Juros/tarifas descontados no momento do recebimento';