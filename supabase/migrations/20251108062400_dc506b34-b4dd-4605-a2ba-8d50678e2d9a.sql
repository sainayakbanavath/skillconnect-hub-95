-- Allow freelancers to update their own applications (e.g., cover letter)
CREATE POLICY "Freelancers can update their own applications"
ON public.applications
FOR UPDATE
TO authenticated
USING (freelancer_id = auth.uid() AND status = 'pending')
WITH CHECK (freelancer_id = auth.uid() AND status = 'pending');

-- Allow freelancers to delete (withdraw) their own applications
CREATE POLICY "Freelancers can delete their own applications"
ON public.applications
FOR DELETE
TO authenticated
USING (freelancer_id = auth.uid() AND status = 'pending');