
-- 1. operational_stages: permite_simultaneidade
ALTER TABLE public.operational_stages
  ADD COLUMN IF NOT EXISTS permite_simultaneidade boolean NOT NULL DEFAULT false;

-- 2. cash_transactions: operation_id
ALTER TABLE public.cash_transactions
  ADD COLUMN IF NOT EXISTS operation_id uuid;
CREATE INDEX IF NOT EXISTS idx_cash_transactions_operation_id
  ON public.cash_transactions(operation_id);

-- 3. areas: tipo_protecao
ALTER TABLE public.areas
  ADD COLUMN IF NOT EXISTS tipo_protecao text NOT NULL DEFAULT 'produtiva';
ALTER TABLE public.areas
  DROP CONSTRAINT IF EXISTS areas_tipo_protecao_check;
ALTER TABLE public.areas
  ADD CONSTRAINT areas_tipo_protecao_check
  CHECK (tipo_protecao IN ('produtiva','app','reserva_legal'));

-- 4. propriedade: limites ambientais
ALTER TABLE public.propriedade
  ADD COLUMN IF NOT EXISTS area_max_manejo_ha numeric NOT NULL DEFAULT 18.29,
  ADD COLUMN IF NOT EXISTS manejo_escalonado_anos integer NOT NULL DEFAULT 4;

-- 5. operation_change_logs
CREATE TABLE IF NOT EXISTS public.operation_change_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL,
  campo text NOT NULL,
  valor_antigo text,
  valor_novo text,
  alterado_por text,
  alterado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_op_change_logs_stage ON public.operation_change_logs(stage_id);

ALTER TABLE public.operation_change_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "op_change_logs_select" ON public.operation_change_logs;
CREATE POLICY "op_change_logs_select" ON public.operation_change_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "op_change_logs_insert" ON public.operation_change_logs;
CREATE POLICY "op_change_logs_insert" ON public.operation_change_logs FOR INSERT WITH CHECK (true);

-- 6. trigger de log
CREATE OR REPLACE FUNCTION public.log_operation_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.data_fim_prevista IS DISTINCT FROM OLD.data_fim_prevista THEN
    INSERT INTO public.operation_change_logs(stage_id, campo, valor_antigo, valor_novo)
    VALUES (NEW.id, 'data_fim_prevista', OLD.data_fim_prevista::text, NEW.data_fim_prevista::text);
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.operation_change_logs(stage_id, campo, valor_antigo, valor_novo)
    VALUES (NEW.id, 'status', OLD.status::text, NEW.status::text);
  END IF;
  IF NEW.responsavel IS DISTINCT FROM OLD.responsavel THEN
    INSERT INTO public.operation_change_logs(stage_id, campo, valor_antigo, valor_novo)
    VALUES (NEW.id, 'responsavel', OLD.responsavel, NEW.responsavel);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_operation_changes ON public.operational_stages;
CREATE TRIGGER trg_log_operation_changes
  AFTER UPDATE ON public.operational_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.log_operation_changes();
