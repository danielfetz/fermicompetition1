-- Competition Codes System Migration
-- Run this AFTER supabase.sql and supabase_competition_modes.sql
-- This adds support for master codes (coordinators) and teacher codes

-- =====================================================
-- STEP 1: Create master_codes table (for school coordinators)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.master_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL, -- School/coordinator name
  email text, -- Contact email for the coordinator
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- STEP 2: Create teacher_codes table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.teacher_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  master_code_id uuid REFERENCES public.master_codes(id) ON DELETE SET NULL,
  name text, -- Optional label for the code
  is_active boolean NOT NULL DEFAULT true,
  claimed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- STEP 3: Create teacher_profiles table to track code associations
-- =====================================================
CREATE TABLE IF NOT EXISTS public.teacher_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_code_id uuid REFERENCES public.teacher_codes(id) ON DELETE SET NULL,
  master_code_id uuid REFERENCES public.master_codes(id) ON DELETE SET NULL,
  -- A teacher can have EITHER a teacher_code OR a master_code, not both
  display_name text,
  school_name text,
  real_competition_unlocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT one_code_type CHECK (
    (teacher_code_id IS NULL AND master_code_id IS NULL) OR
    (teacher_code_id IS NOT NULL AND master_code_id IS NULL) OR
    (teacher_code_id IS NULL AND master_code_id IS NOT NULL)
  )
);

-- Create updated_at trigger for teacher_profiles
CREATE TRIGGER trg_teacher_profiles_updated
BEFORE UPDATE ON public.teacher_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- STEP 4: Enable RLS
-- =====================================================
ALTER TABLE public.master_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: RLS Policies for master_codes
-- =====================================================
-- Coordinators can view their own master code
-- Note: claim_code functions use SECURITY DEFINER to bypass RLS for code validation
CREATE POLICY "coordinator_select_own_master_code" ON public.master_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.user_id = auth.uid() AND tp.master_code_id = id
    )
  );

-- =====================================================
-- STEP 6: RLS Policies for teacher_codes
-- =====================================================
-- Teachers can see their own claimed code
CREATE POLICY "teacher_select_own_code" ON public.teacher_codes
  FOR SELECT USING (claimed_by = auth.uid());

-- Coordinators can see and manage codes under their master code
CREATE POLICY "coordinator_select_codes" ON public.teacher_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.user_id = auth.uid() AND tp.master_code_id = master_code_id
    )
  );

CREATE POLICY "coordinator_insert_codes" ON public.teacher_codes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.user_id = auth.uid() AND tp.master_code_id = master_code_id
    )
  );

CREATE POLICY "coordinator_update_codes" ON public.teacher_codes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.user_id = auth.uid() AND tp.master_code_id = master_code_id
    )
  );

-- Note: No public SELECT policy - claim_code uses SECURITY DEFINER to bypass RLS

-- =====================================================
-- STEP 7: RLS Policies for teacher_profiles
-- =====================================================
-- Teachers can view and update their own profile
CREATE POLICY "teacher_select_own_profile" ON public.teacher_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "teacher_insert_own_profile" ON public.teacher_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "teacher_update_own_profile" ON public.teacher_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Coordinators can view profiles of teachers using their codes
CREATE POLICY "coordinator_select_teacher_profiles" ON public.teacher_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles my_profile
      JOIN public.teacher_codes tc ON tc.master_code_id = my_profile.master_code_id
      WHERE my_profile.user_id = auth.uid()
        AND teacher_profiles.teacher_code_id = tc.id
    )
  );

-- =====================================================
-- STEP 8: Function to claim a teacher code
-- =====================================================
CREATE OR REPLACE FUNCTION public.claim_teacher_code(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_code_record record;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check if user already has a code
  IF EXISTS (SELECT 1 FROM public.teacher_profiles WHERE user_id = v_user_id AND (teacher_code_id IS NOT NULL OR master_code_id IS NOT NULL)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You already have a code associated with your account');
  END IF;

  -- Find the code
  SELECT * INTO v_code_record FROM public.teacher_codes
  WHERE code = p_code AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or inactive code');
  END IF;

  IF v_code_record.claimed_by IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'This code has already been claimed');
  END IF;

  -- Claim the code
  UPDATE public.teacher_codes
  SET claimed_by = v_user_id, claimed_at = now()
  WHERE id = v_code_record.id;

  -- Create or update teacher profile
  INSERT INTO public.teacher_profiles (user_id, teacher_code_id, real_competition_unlocked)
  VALUES (v_user_id, v_code_record.id, true)
  ON CONFLICT (user_id) DO UPDATE
  SET teacher_code_id = v_code_record.id, real_competition_unlocked = true, updated_at = now();

  RETURN jsonb_build_object('success', true, 'message', 'Code claimed successfully');
END$$;

-- =====================================================
-- STEP 9: Function to claim a master code
-- =====================================================
CREATE OR REPLACE FUNCTION public.claim_master_code(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_code_record record;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check if user already has a code
  IF EXISTS (SELECT 1 FROM public.teacher_profiles WHERE user_id = v_user_id AND (teacher_code_id IS NOT NULL OR master_code_id IS NOT NULL)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You already have a code associated with your account');
  END IF;

  -- Find the master code
  SELECT * INTO v_code_record FROM public.master_codes
  WHERE code = p_code AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or inactive master code');
  END IF;

  -- Create or update teacher profile with master code
  INSERT INTO public.teacher_profiles (user_id, master_code_id, real_competition_unlocked)
  VALUES (v_user_id, v_code_record.id, true)
  ON CONFLICT (user_id) DO UPDATE
  SET master_code_id = v_code_record.id, real_competition_unlocked = true, updated_at = now();

  RETURN jsonb_build_object('success', true, 'message', 'Master code claimed successfully', 'is_coordinator', true);
END$$;

-- =====================================================
-- STEP 10: Function to claim any code (tries both)
-- =====================================================
CREATE OR REPLACE FUNCTION public.claim_code(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- First try as master code
  SELECT public.claim_master_code(p_code) INTO v_result;
  IF (v_result->>'success')::boolean THEN
    RETURN v_result;
  END IF;

  -- Then try as teacher code
  SELECT public.claim_teacher_code(p_code) INTO v_result;
  RETURN v_result;
END$$;

-- =====================================================
-- STEP 11: Function to generate a new teacher code (for coordinators)
-- =====================================================
CREATE OR REPLACE FUNCTION public.generate_teacher_code(p_name text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid;
  v_master_code_id uuid;
  v_new_code text;
  v_new_code_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get the user's master code
  SELECT master_code_id INTO v_master_code_id
  FROM public.teacher_profiles
  WHERE user_id = v_user_id;

  IF v_master_code_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'You must be a coordinator to generate codes');
  END IF;

  -- Generate a unique code (8 characters, uppercase alphanumeric)
  LOOP
    v_new_code := upper(substr(md5(random()::text), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.teacher_codes WHERE code = v_new_code);
  END LOOP;

  -- Insert the new code
  INSERT INTO public.teacher_codes (code, master_code_id, name)
  VALUES (v_new_code, v_master_code_id, p_name)
  RETURNING id INTO v_new_code_id;

  RETURN jsonb_build_object(
    'success', true,
    'code', v_new_code,
    'code_id', v_new_code_id
  );
END$$;

-- =====================================================
-- STEP 12: View for coordinators to see their teachers
-- =====================================================
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
WHERE tc.master_code_id IN (
  SELECT master_code_id FROM public.teacher_profiles WHERE user_id = auth.uid()
);

-- =====================================================
-- STEP 13: Sample data - Master codes and teacher codes
-- =====================================================
-- Sample master codes (for school coordinators)
INSERT INTO public.master_codes (code, name, email) VALUES
  ('MASTER001', 'Sample High School', 'coordinator@samplehs.edu'),
  ('MASTER002', 'Demo Academy', 'admin@demoacademy.org'),
  ('COORD2024', 'Regional Coordinator', 'regional@fermi.org')
ON CONFLICT (code) DO NOTHING;

-- Sample teacher codes (linked to first master code)
INSERT INTO public.teacher_codes (code, master_code_id, name)
SELECT
  code,
  (SELECT id FROM public.master_codes WHERE code = 'MASTER001'),
  name
FROM (VALUES
  ('TEACH001', 'Physics Teacher 1'),
  ('TEACH002', 'Physics Teacher 2'),
  ('TEACH003', 'Math Teacher 1'),
  ('TEACH004', 'Science Club'),
  ('TEACH005', 'AP Physics')
) AS t(code, name)
ON CONFLICT (code) DO NOTHING;

-- Sample teacher codes (linked to second master code)
INSERT INTO public.teacher_codes (code, master_code_id, name)
SELECT
  code,
  (SELECT id FROM public.master_codes WHERE code = 'MASTER002'),
  name
FROM (VALUES
  ('DEMO001', 'Demo Teacher 1'),
  ('DEMO002', 'Demo Teacher 2')
) AS t(code, name)
ON CONFLICT (code) DO NOTHING;

-- Standalone teacher codes (no master code)
INSERT INTO public.teacher_codes (code, name) VALUES
  ('INDIE001', 'Independent Teacher'),
  ('SOLO2024', 'Solo Participant')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- DONE! Code system is ready.
--
-- Sample Codes:
-- Master Codes (for coordinators):
--   - MASTER001 (Sample High School)
--   - MASTER002 (Demo Academy)
--   - COORD2024 (Regional Coordinator)
--
-- Teacher Codes (linked to MASTER001):
--   - TEACH001, TEACH002, TEACH003, TEACH004, TEACH005
--
-- Teacher Codes (linked to MASTER002):
--   - DEMO001, DEMO002
--
-- Standalone Teacher Codes:
--   - INDIE001, SOLO2024
-- =====================================================
