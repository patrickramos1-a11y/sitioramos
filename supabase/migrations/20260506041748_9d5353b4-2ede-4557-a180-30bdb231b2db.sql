
CREATE TABLE IF NOT EXISTS public.culture_cost_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cultura text NOT NULL UNIQUE,
  custo_estimado_por_ha numeric NOT NULL DEFAULT 0,
  etapas jsonb NOT NULL DEFAULT '[]'::jsonb,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.culture_cost_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "culture_templates_select" ON public.culture_cost_templates FOR SELECT USING (true);
CREATE POLICY "culture_templates_insert" ON public.culture_cost_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "culture_templates_update" ON public.culture_cost_templates FOR UPDATE USING (true);
CREATE POLICY "culture_templates_delete" ON public.culture_cost_templates FOR DELETE USING (true);

CREATE TRIGGER update_culture_cost_templates_updated_at
BEFORE UPDATE ON public.culture_cost_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.culture_cost_templates (cultura, custo_estimado_por_ha, etapas) VALUES
('Mandioca', 4500, '[
  {"nome":"Preparo do solo","tipo":"preparo_solo","duracao_dias":15,"custo_medio":800,"ordem":1},
  {"nome":"Plantio","tipo":"plantio","duracao_dias":10,"custo_medio":1200,"ordem":2},
  {"nome":"Capina/Manejo","tipo":"manejo","duracao_dias":60,"custo_medio":900,"ordem":3},
  {"nome":"Adubação","tipo":"adubacao","duracao_dias":5,"custo_medio":700,"ordem":4},
  {"nome":"Colheita","tipo":"colheita","duracao_dias":20,"custo_medio":900,"ordem":5}
]'::jsonb),
('Macaxeira', 4500, '[
  {"nome":"Preparo do solo","tipo":"preparo_solo","duracao_dias":15,"custo_medio":800,"ordem":1},
  {"nome":"Plantio","tipo":"plantio","duracao_dias":10,"custo_medio":1200,"ordem":2},
  {"nome":"Capina/Manejo","tipo":"manejo","duracao_dias":60,"custo_medio":900,"ordem":3},
  {"nome":"Adubação","tipo":"adubacao","duracao_dias":5,"custo_medio":700,"ordem":4},
  {"nome":"Colheita","tipo":"colheita","duracao_dias":20,"custo_medio":900,"ordem":5}
]'::jsonb),
('Café', 12000, '[
  {"nome":"Preparo do solo","tipo":"preparo_solo","duracao_dias":30,"custo_medio":2000,"ordem":1},
  {"nome":"Plantio","tipo":"plantio","duracao_dias":15,"custo_medio":3500,"ordem":2},
  {"nome":"Adubação","tipo":"adubacao","duracao_dias":7,"custo_medio":1500,"ordem":3},
  {"nome":"Manejo fitossanitário","tipo":"manejo","duracao_dias":120,"custo_medio":2000,"ordem":4},
  {"nome":"Colheita","tipo":"colheita","duracao_dias":45,"custo_medio":3000,"ordem":5}
]'::jsonb),
('Eucalipto', 8000, '[
  {"nome":"Preparo do solo","tipo":"preparo_solo","duracao_dias":20,"custo_medio":1500,"ordem":1},
  {"nome":"Plantio","tipo":"plantio","duracao_dias":15,"custo_medio":2500,"ordem":2},
  {"nome":"Adubação","tipo":"adubacao","duracao_dias":7,"custo_medio":1200,"ordem":3},
  {"nome":"Manejo","tipo":"manejo","duracao_dias":180,"custo_medio":1500,"ordem":4},
  {"nome":"Colheita","tipo":"colheita","duracao_dias":30,"custo_medio":1300,"ordem":5}
]'::jsonb)
ON CONFLICT (cultura) DO NOTHING;
