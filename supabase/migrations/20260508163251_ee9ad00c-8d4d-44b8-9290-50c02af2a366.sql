CREATE TABLE public.journal_points (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id uuid NOT NULL,
  nome text NOT NULL,
  observacao text,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  accuracy numeric,
  captured_at timestamptz NOT NULL DEFAULT now(),
  ordem integer NOT NULL DEFAULT 0,
  manual boolean NOT NULL DEFAULT false,
  geometry_type text NOT NULL DEFAULT 'point',
  coordinates jsonb,
  attachment_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_journal_points_entry ON public.journal_points(entry_id);

ALTER TABLE public.journal_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journal_points_select" ON public.journal_points FOR SELECT USING (true);
CREATE POLICY "journal_points_insert" ON public.journal_points FOR INSERT WITH CHECK (true);
CREATE POLICY "journal_points_update" ON public.journal_points FOR UPDATE USING (true);
CREATE POLICY "journal_points_delete" ON public.journal_points FOR DELETE USING (true);

CREATE TRIGGER update_journal_points_updated_at
BEFORE UPDATE ON public.journal_points
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();