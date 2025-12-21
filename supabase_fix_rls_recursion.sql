-- Fix infinite recursion in teacher_profiles RLS policies
-- Run this in your Supabase SQL Editor

-- Step 1: Drop ALL policies on teacher_profiles to start fresh
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'teacher_profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.teacher_profiles', pol.policyname);
    END LOOP;
END $$;

-- Step 2: Create a helper function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.get_current_user_master_code_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT master_code_id FROM public.teacher_profiles WHERE user_id = auth.uid();
$$;

-- Grant execute on the function
GRANT EXECUTE ON FUNCTION public.get_current_user_master_code_id() TO authenticated;

-- Step 3: Create ONE simple policy - users can only see their own profile
-- This avoids any recursion issues
CREATE POLICY "select_own_profile" ON public.teacher_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "insert_own_profile" ON public.teacher_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_own_profile" ON public.teacher_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Step 4: Recreate the coordinator_teachers view with SECURITY DEFINER wrapper
-- This lets coordinators see teachers without needing RLS on teacher_profiles
DROP VIEW IF EXISTS public.coordinator_teachers;

CREATE OR REPLACE VIEW public.coordinator_teachers
WITH (security_invoker = false)
AS
SELECT
  tp.id AS profile_id,
  tp.user_id,
  tp.display_name,
  tp.school_name,
  tp.created_at AS joined_at,
  tc.code AS teacher_code,
  tc.name AS code_name,
  tc.claimed_at,
  u.email,
  (SELECT count(*) FROM public.classes c WHERE c.teacher_id = tp.user_id) AS class_count,
  (SELECT count(*) FROM public.students s
   JOIN public.classes c ON c.id = s.class_id
   WHERE c.teacher_id = tp.user_id) AS student_count
FROM public.teacher_profiles tp
JOIN public.teacher_codes tc ON tc.id = tp.teacher_code_id
JOIN auth.users u ON u.id = tp.user_id
WHERE tc.master_code_id = public.get_current_user_master_code_id();

-- Grant access to the view
GRANT SELECT ON public.coordinator_teachers TO authenticated;
