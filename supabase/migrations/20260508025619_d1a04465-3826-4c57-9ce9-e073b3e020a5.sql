
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  area_id UUID NULL REFERENCES public.areas(id) ON DELETE SET NULL,
  cycle_id UUID NULL REFERENCES public.cycles(id) ON DELETE SET NULL,
  entry_type TEXT NOT NULL DEFAULT 'observacao',
  title TEXT NOT NULL,
  description TEXT NULL,
  responsavel_id UUID NULL REFERENCES public.responsaveis(id) ON DELETE SET NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view journal entries" ON public.journal_entries FOR SELECT USING (true);
CREATE POLICY "Anyone can insert journal entries" ON public.journal_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update journal entries" ON public.journal_entries FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete journal entries" ON public.journal_entries FOR DELETE USING (true);

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_journal_entries_date ON public.journal_entries(entry_date DESC);
CREATE INDEX idx_journal_entries_area ON public.journal_entries(area_id);
CREATE INDEX idx_journal_entries_cycle ON public.journal_entries(cycle_id);
