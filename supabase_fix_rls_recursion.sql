-- Fix infinite recursion in teacher_profiles RLS policies
-- Run this in your Supabase SQL Editor

-- Drop the problematic policies
DROP POLICY IF EXISTS "coordinator_select_teacher_profiles" ON public.teacher_profiles;
DROP POLICY IF EXISTS "teacher_select_own_profile" ON public.teacher_profiles;

-- Recreate teacher_select_own_profile (simple, no recursion)
CREATE POLICY "teacher_select_own_profile" ON public.teacher_profiles
  FOR SELECT USING (user_id = auth.uid());

-- The coordinator policy was causing recursion because it queried teacher_profiles
-- from within a policy on teacher_profiles. Instead, we'll use a function with
-- SECURITY DEFINER to bypass RLS when checking coordinator status.

-- Create a helper function to check if current user is a coordinator
CREATE OR REPLACE FUNCTION public.get_current_user_master_code_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT master_code_id FROM public.teacher_profiles WHERE user_id = auth.uid();
$$;

-- Now create a safe coordinator policy that doesn't cause recursion
CREATE POLICY "coordinator_select_teacher_profiles" ON public.teacher_profiles
  FOR SELECT USING (
    -- User can see their own profile
    user_id = auth.uid()
    OR
    -- Coordinator can see profiles of teachers using their codes
    (
      public.get_current_user_master_code_id() IS NOT NULL
      AND teacher_code_id IN (
        SELECT id FROM public.teacher_codes
        WHERE master_code_id = public.get_current_user_master_code_id()
      )
    )
  );

-- Also fix the coordinator_teachers view to use the function
DROP VIEW IF EXISTS public.coordinator_teachers;

CREATE OR REPLACE VIEW public.coordinator_teachers AS
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

-- Grant execute on the function
GRANT EXECUTE ON FUNCTION public.get_current_user_master_code_id() TO authenticated;
