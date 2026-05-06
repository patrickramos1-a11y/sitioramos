
-- Fix loans table: restrict to authenticated users
DROP POLICY IF EXISTS "Loans are publicly readable" ON public.loans;
DROP POLICY IF EXISTS "Loans can be inserted" ON public.loans;
DROP POLICY IF EXISTS "Loans can be updated" ON public.loans;
DROP POLICY IF EXISTS "Loans can be deleted" ON public.loans;

CREATE POLICY "Authenticated users can view loans" ON public.loans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert loans" ON public.loans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update loans" ON public.loans FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete loans" ON public.loans FOR DELETE TO authenticated USING (true);

-- Fix investments table: restrict to authenticated users
DROP POLICY IF EXISTS "Investments are publicly readable" ON public.investments;
DROP POLICY IF EXISTS "Investments can be inserted" ON public.investments;
DROP POLICY IF EXISTS "Investments can be updated" ON public.investments;
DROP POLICY IF EXISTS "Investments can be deleted" ON public.investments;

CREATE POLICY "Authenticated users can view investments" ON public.investments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert investments" ON public.investments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update investments" ON public.investments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete investments" ON public.investments FOR DELETE TO authenticated USING (true);

-- Fix function search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
