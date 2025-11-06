-- Fix 1: Implement proper role-based access control
-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('freelancer', 'recruiter');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Migrate existing role data from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::app_role
FROM public.profiles
WHERE role IN ('freelancer', 'recruiter')
ON CONFLICT (user_id, role) DO NOTHING;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Drop old policies that check profiles.role
DROP POLICY IF EXISTS "Recruiters can create jobs" ON public.jobs;
DROP POLICY IF EXISTS "Freelancers can create applications" ON public.applications;

-- Create new policies using has_role function
CREATE POLICY "Recruiters can create jobs"
ON public.jobs
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'recruiter'));

CREATE POLICY "Freelancers can create applications"
ON public.applications
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'freelancer') 
  AND freelancer_id = auth.uid()
);

-- Update profiles UPDATE policy to prevent role changes
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile (not role)"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- Fix 2: Restrict email visibility
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view relevant profiles"
ON public.profiles
FOR SELECT
USING (
  -- Users can view their own profile
  id = auth.uid() 
  OR
  -- Recruiters can view profiles of freelancers who applied to their jobs
  id IN (
    SELECT freelancer_id 
    FROM public.applications 
    WHERE job_id IN (
      SELECT id FROM public.jobs WHERE recruiter_id = auth.uid()
    )
  )
  OR
  -- Freelancers can view profiles of recruiters whose jobs they applied to
  id IN (
    SELECT recruiter_id 
    FROM public.jobs 
    WHERE id IN (
      SELECT job_id FROM public.applications WHERE freelancer_id = auth.uid()
    )
  )
);