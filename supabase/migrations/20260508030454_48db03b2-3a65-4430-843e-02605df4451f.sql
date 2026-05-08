
ALTER TABLE public.journal_entries ALTER COLUMN title DROP NOT NULL;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'informativo';
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS reviewed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS weather TEXT NULL;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS is_important BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE public.journal_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('audio','photo','video')),
  storage_path TEXT NOT NULL,
  mime_type TEXT NULL,
  duration_seconds NUMERIC NULL,
  size_bytes BIGINT NULL,
  width INT NULL,
  height INT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_journal_attachments_entry ON public.journal_attachments(entry_id);

ALTER TABLE public.journal_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view journal attachments" ON public.journal_attachments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert journal attachments" ON public.journal_attachments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update journal attachments" ON public.journal_attachments FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete journal attachments" ON public.journal_attachments FOR DELETE USING (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('journal-media', 'journal-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read journal media" ON storage.objects FOR SELECT USING (bucket_id = 'journal-media');
CREATE POLICY "Public upload journal media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'journal-media');
CREATE POLICY "Public update journal media" ON storage.objects FOR UPDATE USING (bucket_id = 'journal-media');
CREATE POLICY "Public delete journal media" ON storage.objects FOR DELETE USING (bucket_id = 'journal-media');
