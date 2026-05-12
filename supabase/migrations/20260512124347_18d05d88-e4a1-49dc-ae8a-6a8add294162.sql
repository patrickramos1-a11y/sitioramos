ALTER TABLE public.journal_points
  ADD COLUMN IF NOT EXISTS altitude numeric,
  ADD COLUMN IF NOT EXISTS altitude_accuracy numeric,
  ADD COLUMN IF NOT EXISTS heading numeric,
  ADD COLUMN IF NOT EXISTS speed numeric,
  ADD COLUMN IF NOT EXISTS capture_duration_seconds numeric,
  ADD COLUMN IF NOT EXISTS readings_count integer,
  ADD COLUMN IF NOT EXISTS best_accuracy numeric,
  ADD COLUMN IF NOT EXISTS capture_method text,
  ADD COLUMN IF NOT EXISTS precision_quality text;