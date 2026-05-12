ALTER TABLE public.revenues ADD COLUMN IF NOT EXISTS tipo_receita text NOT NULL DEFAULT 'venda';
ALTER TABLE public.revenues ALTER COLUMN area_id DROP NOT NULL;
ALTER TABLE public.revenues ALTER COLUMN produto DROP NOT NULL;
ALTER TABLE public.revenues ALTER COLUMN quantidade DROP NOT NULL;
ALTER TABLE public.revenues ALTER COLUMN preco_unitario DROP NOT NULL;
ALTER TABLE public.revenues ALTER COLUMN unidade DROP NOT NULL;