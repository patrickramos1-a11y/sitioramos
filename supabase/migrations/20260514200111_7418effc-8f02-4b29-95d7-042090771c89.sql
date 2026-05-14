
-- LOANS
DROP POLICY IF EXISTS "Authenticated users can view loans" ON public.loans;
DROP POLICY IF EXISTS "Authenticated users can insert loans" ON public.loans;
DROP POLICY IF EXISTS "Authenticated users can update loans" ON public.loans;
DROP POLICY IF EXISTS "Authenticated users can delete loans" ON public.loans;

CREATE POLICY "Loans are publicly readable" ON public.loans FOR SELECT USING (true);
CREATE POLICY "Loans can be inserted" ON public.loans FOR INSERT WITH CHECK (true);
CREATE POLICY "Loans can be updated" ON public.loans FOR UPDATE USING (true);
CREATE POLICY "Loans can be deleted" ON public.loans FOR DELETE USING (true);

-- INVESTMENTS
DROP POLICY IF EXISTS "Authenticated users can view investments" ON public.investments;
DROP POLICY IF EXISTS "Authenticated users can insert investments" ON public.investments;
DROP POLICY IF EXISTS "Authenticated users can update investments" ON public.investments;
DROP POLICY IF EXISTS "Authenticated users can delete investments" ON public.investments;

CREATE POLICY "Investments are publicly readable" ON public.investments FOR SELECT USING (true);
CREATE POLICY "Investments can be inserted" ON public.investments FOR INSERT WITH CHECK (true);
CREATE POLICY "Investments can be updated" ON public.investments FOR UPDATE USING (true);
CREATE POLICY "Investments can be deleted" ON public.investments FOR DELETE USING (true);
