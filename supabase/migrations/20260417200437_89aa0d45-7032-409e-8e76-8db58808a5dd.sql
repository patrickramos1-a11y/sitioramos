-- Enum para categoria de contato
CREATE TYPE public.contato_categoria AS ENUM ('fornecedor', 'cliente', 'prestador', 'funcionario', 'outro');

-- Tabela de contatos
CREATE TABLE public.contatos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  documento TEXT,
  categoria contato_categoria NOT NULL DEFAULT 'outro',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contatos are publicly readable" ON public.contatos FOR SELECT USING (true);
CREATE POLICY "Contatos can be inserted" ON public.contatos FOR INSERT WITH CHECK (true);
CREATE POLICY "Contatos can be updated" ON public.contatos FOR UPDATE USING (true);
CREATE POLICY "Contatos can be deleted" ON public.contatos FOR DELETE USING (true);

CREATE TRIGGER update_contatos_updated_at
BEFORE UPDATE ON public.contatos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_contatos_nome ON public.contatos(nome);
CREATE INDEX idx_contatos_categoria ON public.contatos(categoria);

-- Vincular contato às movimentações
ALTER TABLE public.cash_transactions ADD COLUMN contato_id UUID REFERENCES public.contatos(id) ON DELETE SET NULL;
ALTER TABLE public.costs ADD COLUMN contato_id UUID REFERENCES public.contatos(id) ON DELETE SET NULL;
ALTER TABLE public.investments ADD COLUMN contato_id UUID REFERENCES public.contatos(id) ON DELETE SET NULL;
ALTER TABLE public.revenues ADD COLUMN contato_id UUID REFERENCES public.contatos(id) ON DELETE SET NULL;

CREATE INDEX idx_cash_transactions_contato ON public.cash_transactions(contato_id);
CREATE INDEX idx_costs_contato ON public.costs(contato_id);
CREATE INDEX idx_investments_contato ON public.investments(contato_id);
CREATE INDEX idx_revenues_contato ON public.revenues(contato_id);