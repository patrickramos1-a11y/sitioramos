
-- ============================================================
-- FINANCEIRO: estrutura complementar, sem tocar dados existentes
-- ============================================================

-- 1) NATUREZAS FINANCEIRAS
CREATE TABLE public.fin_naturezas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('entrada','saida','ajuste')),
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fin_naturezas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fin_naturezas_select" ON public.fin_naturezas FOR SELECT USING (true);
CREATE POLICY "fin_naturezas_insert" ON public.fin_naturezas FOR INSERT WITH CHECK (true);
CREATE POLICY "fin_naturezas_update" ON public.fin_naturezas FOR UPDATE USING (true);
CREATE POLICY "fin_naturezas_delete" ON public.fin_naturezas FOR DELETE USING (true);
CREATE TRIGGER trg_fin_naturezas_updated BEFORE UPDATE ON public.fin_naturezas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) CENTROS DE CUSTO
CREATE TABLE public.fin_centros_custo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nome text NOT NULL,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fin_centros_custo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fin_centros_custo_select" ON public.fin_centros_custo FOR SELECT USING (true);
CREATE POLICY "fin_centros_custo_insert" ON public.fin_centros_custo FOR INSERT WITH CHECK (true);
CREATE POLICY "fin_centros_custo_update" ON public.fin_centros_custo FOR UPDATE USING (true);
CREATE POLICY "fin_centros_custo_delete" ON public.fin_centros_custo FOR DELETE USING (true);
CREATE TRIGGER trg_fin_centros_custo_updated BEFORE UPDATE ON public.fin_centros_custo
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) CATEGORIAS
CREATE TABLE public.fin_categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nome text NOT NULL,
  natureza_id uuid REFERENCES public.fin_naturezas(id) ON DELETE SET NULL,
  centro_custo_id uuid REFERENCES public.fin_centros_custo(id) ON DELETE SET NULL,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fin_categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fin_categorias_select" ON public.fin_categorias FOR SELECT USING (true);
CREATE POLICY "fin_categorias_insert" ON public.fin_categorias FOR INSERT WITH CHECK (true);
CREATE POLICY "fin_categorias_update" ON public.fin_categorias FOR UPDATE USING (true);
CREATE POLICY "fin_categorias_delete" ON public.fin_categorias FOR DELETE USING (true);
CREATE TRIGGER trg_fin_categorias_updated BEFORE UPDATE ON public.fin_categorias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) PROJETOS DE INVESTIMENTO
CREATE TABLE public.fin_projetos_investimento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL DEFAULT 'outros',
  descricao text,
  status text NOT NULL DEFAULT 'planejado' CHECK (status IN ('planejado','em_andamento','concluido','pausado','cancelado')),
  data_inicio date,
  data_conclusao date,
  valor_previsto numeric DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fin_projetos_investimento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fin_projetos_select" ON public.fin_projetos_investimento FOR SELECT USING (true);
CREATE POLICY "fin_projetos_insert" ON public.fin_projetos_investimento FOR INSERT WITH CHECK (true);
CREATE POLICY "fin_projetos_update" ON public.fin_projetos_investimento FOR UPDATE USING (true);
CREATE POLICY "fin_projetos_delete" ON public.fin_projetos_investimento FOR DELETE USING (true);
CREATE TRIGGER trg_fin_projetos_updated BEFORE UPDATE ON public.fin_projetos_investimento
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) CAMADA COMPLEMENTAR DE CLASSIFICAÇÃO (1:1 opcional com cash_transactions)
CREATE TABLE public.fin_classificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_transaction_id uuid NOT NULL UNIQUE,
  natureza_id uuid REFERENCES public.fin_naturezas(id) ON DELETE SET NULL,
  categoria_id uuid REFERENCES public.fin_categorias(id) ON DELETE SET NULL,
  centro_custo_id uuid REFERENCES public.fin_centros_custo(id) ON DELETE SET NULL,
  propriedade_id uuid,
  area_id uuid,
  talhao_id uuid,
  cycle_id uuid,
  projeto_investimento_id uuid REFERENCES public.fin_projetos_investimento(id) ON DELETE SET NULL,
  origem text NOT NULL DEFAULT 'manual' CHECK (origem IN ('manual','automatica','sugerida')),
  confianca text DEFAULT 'media' CHECK (confianca IN ('alta','media','baixa')),
  revisado boolean NOT NULL DEFAULT false,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fin_classificacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fin_classificacoes_select" ON public.fin_classificacoes FOR SELECT USING (true);
CREATE POLICY "fin_classificacoes_insert" ON public.fin_classificacoes FOR INSERT WITH CHECK (true);
CREATE POLICY "fin_classificacoes_update" ON public.fin_classificacoes FOR UPDATE USING (true);
CREATE POLICY "fin_classificacoes_delete" ON public.fin_classificacoes FOR DELETE USING (true);
CREATE TRIGGER trg_fin_classificacoes_updated BEFORE UPDATE ON public.fin_classificacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_fin_classificacoes_cash_tx ON public.fin_classificacoes(cash_transaction_id);
CREATE INDEX idx_fin_classificacoes_natureza ON public.fin_classificacoes(natureza_id);
CREATE INDEX idx_fin_classificacoes_categoria ON public.fin_classificacoes(categoria_id);

-- ============================================================
-- SEEDS (apenas dados de configuração — não afetam lançamentos)
-- ============================================================

INSERT INTO public.fin_naturezas (codigo, nome, tipo, descricao, ordem) VALUES
('receita','Receita','entrada','Entradas operacionais e não operacionais',1),
('custo_plantacao','Custo de Plantação','saida','Custos diretos de produção agrícola',2),
('investimento','Investimento / Benfeitoria','saida','Aquisições e benfeitorias de longo prazo',3),
('despesa_geral','Despesa Geral','saida','Despesas administrativas e operacionais gerais',4),
('ajuste','Transferência / Ajuste','ajuste','Movimentações internas e ajustes contábeis',5);

INSERT INTO public.fin_centros_custo (codigo, nome, descricao, ordem) VALUES
('producao_agricola','Produção Agrícola','Atividades diretas de plantio, manejo e colheita',1),
('beneficiamento','Beneficiamento','Pós-colheita, processamento e embalagem',2),
('infraestrutura','Infraestrutura','Construções, galpões, cercas',3),
('equipamentos','Equipamentos','Maquinário, implementos e ferramentas',4),
('regularizacao_ambiental','Regularização / Ambiental','Documentação fundiária e licenciamento ambiental',5),
('administracao','Administração','Gestão, contabilidade, sistemas',6),
('comercializacao','Comercialização','Vendas, frete, logística comercial',7),
('propriedade_geral','Propriedade Geral','Custos não alocáveis a centro específico',8);

-- Categorias: Custo de Plantação
INSERT INTO public.fin_categorias (codigo, nome, natureza_id, centro_custo_id, ordem)
SELECT codigo, nome,
  (SELECT id FROM public.fin_naturezas WHERE codigo='custo_plantacao'),
  (SELECT id FROM public.fin_centros_custo WHERE codigo='producao_agricola'),
  ordem
FROM (VALUES
  ('cp_preparo_solo','Preparo de Solo',1),
  ('cp_mudas_sementes','Mudas / Sementes',2),
  ('cp_adubacao','Adubação',3),
  ('cp_herbicida','Herbicida',4),
  ('cp_mao_obra','Mão de Obra',5),
  ('cp_combustivel','Combustível',6),
  ('cp_trator','Trator',7),
  ('cp_consultoria','Consultoria',8),
  ('cp_frete','Frete / Logística',9),
  ('cp_manutencao','Manutenção / Infraestrutura',10),
  ('cp_insumos','Insumos / Compras Gerais',11),
  ('cp_outros','Outros',12)
) AS t(codigo,nome,ordem);

-- Categorias: Entrada / Receita
INSERT INTO public.fin_categorias (codigo, nome, natureza_id, centro_custo_id, ordem)
SELECT codigo, nome,
  (SELECT id FROM public.fin_naturezas WHERE codigo='receita'),
  (SELECT id FROM public.fin_centros_custo WHERE codigo='comercializacao'),
  ordem
FROM (VALUES
  ('rc_venda_produto','Venda de Produto',1),
  ('rc_aluguel_equip','Aluguel de Equipamento',2),
  ('rc_aporte_socios','Aporte dos Sócios',3),
  ('rc_emprestimo','Empréstimo Bancário',4),
  ('rc_reembolso','Reembolso',5),
  ('rc_venda_ativo','Venda de Ativo',6),
  ('rc_outras','Outras Entradas',7)
) AS t(codigo,nome,ordem);

-- Categorias: Investimento
INSERT INTO public.fin_categorias (codigo, nome, natureza_id, centro_custo_id, ordem)
SELECT codigo, nome,
  (SELECT id FROM public.fin_naturezas WHERE codigo='investimento'),
  (SELECT id FROM public.fin_centros_custo WHERE codigo='infraestrutura'),
  ordem
FROM (VALUES
  ('inv_galpao','Construção / Galpão',1),
  ('inv_equipamentos','Equipamentos',2),
  ('inv_ferramentas','Ferramentas',3),
  ('inv_caixa_agua','Caixa d''água',4),
  ('inv_bomba','Bomba',5),
  ('inv_energia','Energia',6),
  ('inv_regularizacao','Regularização da Terra',7),
  ('inv_documentacao','Documentação',8),
  ('inv_benfeitorias','Benfeitorias',9),
  ('inv_outros','Outros Investimentos',10)
) AS t(codigo,nome,ordem);

-- Categorias: Despesa Geral / Administrativa
INSERT INTO public.fin_categorias (codigo, nome, natureza_id, centro_custo_id, ordem)
SELECT codigo, nome,
  (SELECT id FROM public.fin_naturezas WHERE codigo='despesa_geral'),
  (SELECT id FROM public.fin_centros_custo WHERE codigo='administracao'),
  ordem
FROM (VALUES
  ('adm_juros','Juros Bancários',1),
  ('adm_tarifas','Tarifas Bancárias',2),
  ('adm_contabilidade','Contabilidade',3),
  ('adm_sistema','Sistema / Software',4),
  ('adm_taxas','Taxas',5),
  ('adm_documentos','Documentos',6),
  ('adm_outros','Outros',7)
) AS t(codigo,nome,ordem);

-- Projetos de Investimento sugeridos
INSERT INTO public.fin_projetos_investimento (nome, tipo, status) VALUES
('Legalização da Terra','regularizacao','planejado'),
('Galpão','infraestrutura','planejado'),
('Carretinha','transporte','planejado'),
('Energia','energia','planejado'),
('Caixa d''água e Bomba','agua','planejado'),
('Ferramentas e Equipamentos Manuais','ferramentas','planejado');
