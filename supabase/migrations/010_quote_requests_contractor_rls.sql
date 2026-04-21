-- Allow contractors to read quote_requests they are a recipient of.
-- Without this, the nested join in the dashboard returns null for all quote_request data.
CREATE POLICY "Contractor reads via recipient" ON public.quote_requests FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.quote_request_recipients qrr
    JOIN public.contractors c ON c.id = qrr.contractor_id
    WHERE qrr.quote_request_id = public.quote_requests.id
      AND c.user_id = auth.uid()
  )
);
