-- Add resume_url column to applications table
ALTER TABLE public.applications 
ADD COLUMN resume_url TEXT;

-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- RLS policies for resumes bucket
-- Freelancers can upload their own resumes
CREATE POLICY "Freelancers can upload resumes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND has_role(auth.uid(), 'freelancer'::app_role)
);

-- Freelancers can update their own resumes
CREATE POLICY "Freelancers can update their resumes"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'resumes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND has_role(auth.uid(), 'freelancer'::app_role)
);

-- Freelancers can delete their own resumes
CREATE POLICY "Freelancers can delete their resumes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND has_role(auth.uid(), 'freelancer'::app_role)
);

-- Recruiters can view resumes for applications to their jobs
CREATE POLICY "Recruiters can view resumes for their job applications"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes'
  AND EXISTS (
    SELECT 1
    FROM public.applications app
    INNER JOIN public.jobs j ON j.id = app.job_id
    WHERE j.recruiter_id = auth.uid()
    AND storage.filename(name) = storage.filename(app.resume_url)
  )
);

-- Freelancers can view their own resumes
CREATE POLICY "Freelancers can view their own resumes"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);