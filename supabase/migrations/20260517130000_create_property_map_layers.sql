CREATE TABLE IF NOT EXISTS public.property_map_layers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  layer_type text NOT NULL,
  category text NOT NULL DEFAULT 'Camada da Propriedade',
  description text,
  geojson jsonb NOT NULL,
  source_format text NOT NULL,
  source_origin text NOT NULL DEFAULT 'imported',
  source_file_name text NOT NULL,
  source_path text,
  visible boolean NOT NULL DEFAULT true,
  style jsonb NOT NULL DEFAULT '{}'::jsonb,
  bounds jsonb,
  imported_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_map_layers_type
  ON public.property_map_layers(layer_type);

ALTER TABLE public.property_map_layers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "property_map_layers_select"
  ON public.property_map_layers FOR SELECT USING (true);

CREATE POLICY "property_map_layers_insert"
  ON public.property_map_layers FOR INSERT WITH CHECK (true);

CREATE POLICY "property_map_layers_update"
  ON public.property_map_layers FOR UPDATE USING (true);

CREATE POLICY "property_map_layers_delete"
  ON public.property_map_layers FOR DELETE USING (true);

CREATE TRIGGER trg_property_map_layers_updated_at
  BEFORE UPDATE ON public.property_map_layers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
