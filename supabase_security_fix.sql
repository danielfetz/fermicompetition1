-- Security Fix: Remove overly permissive RLS policies
-- Run this AFTER supabase_codes.sql to fix the security vulnerability

-- Remove the policies that allow anyone to see all codes
DROP POLICY IF EXISTS "anyone_can_check_master_code" ON public.master_codes;
DROP POLICY IF EXISTS "anyone_can_check_teacher_code" ON public.teacher_codes;

-- The claim_code functions use SECURITY DEFINER which bypasses RLS,
-- so they will still work without these permissive policies.
-- Only coordinators/teachers who have claimed codes can see their own codes.

-- Verify RLS is still enabled
ALTER TABLE public.master_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_codes ENABLE ROW LEVEL SECURITY;

-- Done! The remaining policies are:
-- master_codes: coordinator_select_own_master_code (only see your own)
-- teacher_codes: teacher_select_own_code, coordinator_select_codes, coordinator_insert_codes, coordinator_update_codes
