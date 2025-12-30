-- Fermi Competition Complete Schema
-- Consolidated SQL schema for the Fermi Competition application
-- Run this in your Supabase SQL editor to set up the complete database
--
-- This file combines and supersedes all individual SQL files:
-- - supabase.sql (base schema)
-- - supabase_competition_modes.sql
-- - supabase_students_mode.sql
-- - supabase_real_questions.sql
-- - supabase_more_questions.sql
-- - supabase_guest_questions.sql
-- - supabase_codes.sql
-- - supabase_security_fix.sql
-- - supabase_fix_rls_recursion.sql
-- - supabase_confidence_points.sql
-- - supabase_fix_student_scores_security.sql
-- - supabase_fix_answers_constraint.sql
-- - supabase_username_function.sql

-- =====================================================
-- SECTION 1: DROP EXISTING OBJECTS (clean slate)
-- =====================================================
DROP VIEW IF EXISTS public.student_scores CASCADE;
DROP VIEW IF EXISTS public.coordinator_teachers CASCADE;
DROP TABLE IF EXISTS public.answers CASCADE;
DROP TABLE IF EXISTS public.student_exam_sessions CASCADE;
DROP TABLE IF EXISTS public.class_questions CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.fermi_questions CASCADE;
DROP TABLE IF EXISTS public.teacher_profiles CASCADE;
DROP TABLE IF EXISTS public.teacher_codes CASCADE;
DROP TABLE IF EXISTS public.master_codes CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at CASCADE;
DROP FUNCTION IF EXISTS public.seed_class_questions CASCADE;
DROP FUNCTION IF EXISTS public.student_has_completed_mode CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_master_code_id CASCADE;
DROP FUNCTION IF EXISTS public.claim_teacher_code CASCADE;
DROP FUNCTION IF EXISTS public.claim_master_code CASCADE;
DROP FUNCTION IF EXISTS public.claim_code CASCADE;
DROP FUNCTION IF EXISTS public.generate_teacher_code CASCADE;
DROP FUNCTION IF EXISTS public.get_username_max_numbers CASCADE;
DROP TYPE IF EXISTS public.competition_mode CASCADE;

-- =====================================================
-- SECTION 2: CREATE ENUM TYPES
-- =====================================================
CREATE TYPE public.competition_mode AS ENUM ('mock', 'real', 'guest');

-- =====================================================
-- SECTION 3: CREATE TABLES
-- =====================================================

-- 3.1: fermi_questions (system-provided questions)
CREATE TABLE public.fermi_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt text NOT NULL,
  correct_value double precision NOT NULL,
  hint text,
  difficulty int NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  category text NOT NULL DEFAULT 'general',
  "order" int NOT NULL UNIQUE,
  competition_mode public.competition_mode NOT NULL DEFAULT 'mock',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3.2: classes table
CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  school_name text,
  num_students int NOT NULL CHECK (num_students > 0 AND num_students <= 500),
  competition_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3.3: students table
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  username text NOT NULL,
  password_hash text NOT NULL,
  plain_password text, -- Stored temporarily for teacher to share
  full_name text,
  has_completed_exam boolean NOT NULL DEFAULT false,
  competition_mode public.competition_mode NOT NULL DEFAULT 'mock',
  first_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT students_class_mode_username_key UNIQUE (class_id, competition_mode, username)
);

-- 3.4: class_questions (links class to fermi questions)
CREATE TABLE public.class_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  fermi_question_id uuid NOT NULL REFERENCES public.fermi_questions(id) ON DELETE CASCADE,
  "order" int NOT NULL,
  competition_mode public.competition_mode NOT NULL DEFAULT 'mock',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT class_questions_class_mode_order_key UNIQUE (class_id, competition_mode, "order"),
  CONSTRAINT class_questions_class_mode_question_key UNIQUE (class_id, competition_mode, fermi_question_id)
);

-- 3.5: student_exam_sessions table
CREATE TABLE public.student_exam_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  competition_mode public.competition_mode NOT NULL DEFAULT 'mock',
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL DEFAULT (now() + interval '40 minutes'),
  submitted_at timestamptz,
  CONSTRAINT student_exam_sessions_student_mode_key UNIQUE (student_id, competition_mode)
);

-- 3.6: answers table
CREATE TABLE public.answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_question_id uuid NOT NULL REFERENCES public.class_questions(id) ON DELETE CASCADE,
  value double precision NOT NULL,
  confidence_pct int NOT NULL CHECK (confidence_pct IN (10, 30, 50, 70, 90)),
  competition_mode public.competition_mode NOT NULL DEFAULT 'mock',
  is_teacher_override boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT answers_student_question_mode_key UNIQUE (student_id, class_question_id, competition_mode),
  CONSTRAINT answers_student_question_unique UNIQUE (student_id, class_question_id)
);

-- 3.7: master_codes table (for school coordinators)
CREATE TABLE public.master_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL, -- School/coordinator name
  email text, -- Contact email for the coordinator
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3.8: teacher_codes table
CREATE TABLE public.teacher_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  master_code_id uuid REFERENCES public.master_codes(id) ON DELETE SET NULL,
  name text, -- Optional label for the code
  is_active boolean NOT NULL DEFAULT true,
  claimed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3.9: teacher_profiles table
CREATE TABLE public.teacher_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_code_id uuid REFERENCES public.teacher_codes(id) ON DELETE SET NULL,
  master_code_id uuid REFERENCES public.master_codes(id) ON DELETE SET NULL,
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

-- =====================================================
-- SECTION 4: CREATE FUNCTIONS
-- =====================================================

-- 4.1: Updated at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END$$;

-- 4.2: Helper function to get current user's master code ID (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_current_user_master_code_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT master_code_id FROM public.teacher_profiles WHERE user_id = auth.uid();
$$;

-- 4.3: Seed class questions function
CREATE OR REPLACE FUNCTION public.seed_class_questions(p_class_id uuid, p_mode public.competition_mode DEFAULT 'mock')
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.class_questions (class_id, fermi_question_id, "order", competition_mode)
  SELECT p_class_id, fq.id, fq."order", p_mode
  FROM public.fermi_questions fq
  WHERE fq.competition_mode = p_mode
  ORDER BY fq."order"
  ON CONFLICT DO NOTHING;
END$$;

-- 4.4: Check if student has completed specific mode
CREATE OR REPLACE FUNCTION public.student_has_completed_mode(
  p_student_id uuid,
  p_mode public.competition_mode
)
RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE
  v_submitted boolean;
BEGIN
  SELECT submitted_at IS NOT NULL INTO v_submitted
  FROM public.student_exam_sessions
  WHERE student_id = p_student_id AND competition_mode = p_mode;

  RETURN COALESCE(v_submitted, false);
END$$;

-- 4.5: Claim teacher code function
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

-- 4.6: Claim master code function
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

-- 4.7: Claim any code (tries both types)
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

-- 4.8: Generate teacher code (for coordinators)
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

-- 4.9: Get username max numbers (efficient lookup for username generation)
CREATE OR REPLACE FUNCTION get_username_max_numbers()
RETURNS TABLE (base text, max_num int) AS $$
BEGIN
  RETURN QUERY
  SELECT
    regexp_replace(username, '\d+$', '') AS base,
    MAX(CAST(regexp_replace(username, '^.*?(\d+)$', '\1') AS int)) AS max_num
  FROM students
  WHERE username ~ '\d+$'
  GROUP BY regexp_replace(username, '\d+$', '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECTION 5: CREATE TRIGGERS
-- =====================================================

CREATE TRIGGER trg_answers_updated BEFORE UPDATE ON public.answers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_teacher_profiles_updated BEFORE UPDATE ON public.teacher_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- SECTION 6: CREATE VIEWS
-- =====================================================

-- 6.1: Student scores view (with confidence points and security)
CREATE OR REPLACE VIEW public.student_scores
WITH (security_invoker = true)
AS
SELECT
  s.id AS student_id,
  s.class_id,
  s.username,
  s.full_name,
  s.has_completed_exam,
  s.competition_mode,
  count(a.id) AS total_answered,
  count(*) FILTER (
    WHERE fq.correct_value IS NOT NULL
      AND a.value BETWEEN (fq.correct_value * 0.5) AND (fq.correct_value * 2.0)
  ) AS correct_count,
  round(
    CASE
      WHEN count(a.id) > 0 THEN
        (count(*) FILTER (
          WHERE fq.correct_value IS NOT NULL
            AND a.value BETWEEN (fq.correct_value * 0.5) AND (fq.correct_value * 2.0)
        )::numeric / count(a.id)::numeric) * 100
      ELSE 0
    END, 1
  ) AS score_percentage,
  -- Confidence-based points: 250 base + sum of points per answer
  250 + COALESCE(SUM(
    CASE
      -- Correct answer (within factor of 2: between half and double)
      WHEN fq.correct_value IS NOT NULL
        AND a.value BETWEEN (fq.correct_value * 0.5) AND (fq.correct_value * 2.0) THEN
        CASE a.confidence_pct
          WHEN 10 THEN 3
          WHEN 30 THEN 7
          WHEN 50 THEN 10
          WHEN 70 THEN 12
          WHEN 90 THEN 13
          ELSE 0
        END
      -- Wrong answer
      WHEN a.id IS NOT NULL THEN
        CASE a.confidence_pct
          WHEN 10 THEN 0
          WHEN 30 THEN -1
          WHEN 50 THEN -3
          WHEN 70 THEN -6
          WHEN 90 THEN -10
          ELSE 0
        END
      ELSE 0
    END
  ), 0)::int AS confidence_points
FROM public.students s
LEFT JOIN public.answers a ON a.student_id = s.id
LEFT JOIN public.class_questions cq ON cq.id = a.class_question_id
LEFT JOIN public.fermi_questions fq ON fq.id = cq.fermi_question_id
GROUP BY s.id, s.class_id, s.username, s.full_name, s.has_completed_exam, s.competition_mode;

-- 6.2: Coordinator teachers view
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

-- =====================================================
-- SECTION 7: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.fermi_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 8: RLS POLICIES
-- =====================================================

-- 8.1: fermi_questions (public read)
CREATE POLICY "anyone_can_read_questions" ON public.fermi_questions
  FOR SELECT USING (true);

-- 8.2: classes
CREATE POLICY "teacher_select_own_classes" ON public.classes
  FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "teacher_insert_classes" ON public.classes
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "teacher_update_own_classes" ON public.classes
  FOR UPDATE USING (auth.uid() = teacher_id);
CREATE POLICY "teacher_delete_own_classes" ON public.classes
  FOR DELETE USING (auth.uid() = teacher_id);

-- 8.3: students
CREATE POLICY "teacher_select_students" ON public.students
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.teacher_id = auth.uid()));
CREATE POLICY "teacher_insert_students" ON public.students
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.teacher_id = auth.uid()));
CREATE POLICY "teacher_update_students" ON public.students
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.teacher_id = auth.uid()));
CREATE POLICY "teacher_delete_students" ON public.students
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.teacher_id = auth.uid()));

-- 8.4: class_questions
CREATE POLICY "teacher_manage_class_questions" ON public.class_questions
  FOR ALL USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.teacher_id = auth.uid()));
CREATE POLICY "anyone_can_read_class_questions" ON public.class_questions
  FOR SELECT USING (true);

-- 8.5: student_exam_sessions
CREATE POLICY "teacher_manage_sessions" ON public.student_exam_sessions
  FOR ALL USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.teacher_id = auth.uid()));

-- 8.6: answers
CREATE POLICY "teacher_select_answers" ON public.answers
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.classes c ON c.id = s.class_id
    WHERE s.id = student_id AND c.teacher_id = auth.uid()
  ));
CREATE POLICY "teacher_upsert_answers" ON public.answers
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.classes c ON c.id = s.class_id
    WHERE s.id = student_id AND c.teacher_id = auth.uid()
  ));
CREATE POLICY "teacher_update_answers" ON public.answers
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.classes c ON c.id = s.class_id
    WHERE s.id = student_id AND c.teacher_id = auth.uid()
  ));

-- 8.7: master_codes
CREATE POLICY "coordinator_select_own_master_code" ON public.master_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      WHERE tp.user_id = auth.uid() AND tp.master_code_id = id
    )
  );

-- 8.8: teacher_codes
CREATE POLICY "teacher_select_own_code" ON public.teacher_codes
  FOR SELECT USING (claimed_by = auth.uid());
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

-- 8.9: teacher_profiles (simple policies to avoid recursion)
CREATE POLICY "select_own_profile" ON public.teacher_profiles
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_own_profile" ON public.teacher_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own_profile" ON public.teacher_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- SECTION 9: GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.get_current_user_master_code_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_username_max_numbers() TO service_role;
GRANT SELECT ON public.coordinator_teachers TO authenticated;
REVOKE ALL ON public.student_scores FROM anon;
GRANT SELECT ON public.student_scores TO authenticated;

-- =====================================================
-- SECTION 10: INSERT QUESTIONS
-- =====================================================

-- 10.1: Mock/Practice Questions (orders 1-25)
INSERT INTO public.fermi_questions (prompt, correct_value, hint, difficulty, category, "order", competition_mode) VALUES
  -- Original 10 questions
  ('How many heartbeats does a person have in one day?', 100000, 'Think about beats per minute and hours in a day', 2, 'biology', 1, 'mock'),
  ('How many kilometers of blood vessels are in the human body?', 100000, 'Consider all arteries, veins, and capillaries', 4, 'biology', 2, 'mock'),
  ('How many piano tuners are there in Chicago?', 225, 'Think about population, pianos per household, tunings per year', 3, 'estimation', 3, 'mock'),
  ('How many golf balls can fit in a school bus?', 500000, 'Estimate bus volume and golf ball diameter', 3, 'geometry', 4, 'mock'),
  ('How many liters of water does a person drink in a lifetime?', 60000, 'Consider average daily intake and lifespan', 2, 'biology', 5, 'mock'),
  ('How many atoms are in a grain of sand?', 50000000000000000000, 'Think about the mass of silicon and oxygen atoms', 5, 'physics', 6, 'mock'),
  ('How many hairs are on an average human head?', 100000, 'Consider hair density and scalp area', 2, 'biology', 7, 'mock'),
  ('How many words does the average person speak in a day?', 16000, 'Think about waking hours and speaking rate', 2, 'daily-life', 8, 'mock'),
  ('How many leaves are on a mature oak tree?', 250000, 'Estimate branches and leaves per branch', 3, 'nature', 9, 'mock'),
  ('How many pizzas are consumed in the United States each year?', 3000000000, 'Consider population and frequency of pizza eating', 3, 'daily-life', 10, 'mock'),
  -- Additional mock questions (11-25)
  ('How many steps does the average person take in a year?', 2000000, 'Think about daily steps and multiply by days in a year', 2, 'daily-life', 11, 'mock'),
  ('How many bricks are in the Empire State Building?', 10000000, 'Consider the building dimensions and typical brick sizes', 4, 'architecture', 12, 'mock'),
  ('How many drops of water are in an Olympic swimming pool?', 2000000000000, 'Calculate pool volume in liters, then drops per liter', 3, 'physics', 13, 'mock'),
  ('How many books are in the Library of Congress?', 17000000, 'It is the largest library in the world', 2, 'knowledge', 14, 'mock'),
  ('How many blades of grass are on a football field?', 400000000, 'Estimate field area and grass blade density per square inch', 3, 'nature', 15, 'mock'),
  ('How many hours does the average person spend sleeping in their lifetime?', 230000, 'Consider average sleep per night and average lifespan', 2, 'daily-life', 16, 'mock'),
  ('How many commercial flights take off worldwide each day?', 100000, 'Think about major airports and their daily departures', 3, 'transportation', 17, 'mock'),
  ('How many hot dogs are eaten at baseball games in the US each season?', 20000000, 'Consider MLB attendance and hot dogs per fan', 3, 'sports', 18, 'mock'),
  ('How many emails are sent worldwide every second?', 3500000, 'Think about global email users and their activity', 3, 'technology', 19, 'mock'),
  ('How many neurons are in the human brain?', 86000000000, 'The brain is the most complex organ', 3, 'biology', 20, 'mock'),
  ('How many people are eating at McDonalds right now worldwide?', 2000000, 'Consider restaurants worldwide, customers per restaurant, and time zones', 3, 'daily-life', 21, 'mock'),
  ('How many teeth do all the people in your country have combined?', 2000000000, 'Average teeth per person times population (assuming ~70 million people)', 2, 'biology', 22, 'mock'),
  ('How many cups of coffee are consumed worldwide each day?', 2250000000, 'Consider coffee drinking nations and cups per person', 3, 'daily-life', 23, 'mock'),
  ('How many kilometers does the Earth travel around the Sun in one year?', 940000000, 'Think about orbital circumference using the distance to the Sun', 3, 'astronomy', 24, 'mock'),
  ('How many cells are in the human body?', 37000000000000, 'The body is made of trillions of cells of different types', 4, 'biology', 25, 'mock')
ON CONFLICT ("order") DO NOTHING;

-- 10.2: Real Competition Questions (orders 101-125)
INSERT INTO public.fermi_questions (prompt, correct_value, hint, difficulty, category, "order", competition_mode) VALUES
  -- Questions 101-115
  ('How many people in the world are currently airborne in commercial flights at any given moment?', 1000000, 'Consider the number of flights operating globally and average passengers per flight', 3, 'transportation', 101, 'real'),
  ('How many times does a human heart beat in an average lifetime?', 2500000000, 'Think about beats per minute, hours awake vs asleep, and average lifespan', 2, 'biology', 102, 'real'),
  ('How many trees are there on Earth?', 3000000000000, 'Consider different biomes, forest density, and global forest coverage', 4, 'nature', 103, 'real'),
  ('How many slices of bread are consumed in the United States each day?', 320000000, 'Think about population, percentage who eat bread, and slices per person', 2, 'daily-life', 104, 'real'),
  ('How many Google searches are performed worldwide in one day?', 8500000000, 'Consider global internet users, percentage using Google, and searches per user', 3, 'technology', 105, 'real'),
  ('How many atoms are in the human body?', 7000000000000000000000000000, 'Consider body mass, composition (mostly oxygen, carbon, hydrogen), and atomic masses', 5, 'physics', 106, 'real'),
  ('How many credit card transactions occur in the United States per second?', 10000, 'Think about annual transaction volume and divide appropriately', 3, 'economics', 107, 'real'),
  ('How many golf balls are lost each year in the United States?', 300000000, 'Consider number of golfers, rounds played per year, and balls lost per round', 3, 'sports', 108, 'real'),
  ('How many stars are visible to the naked eye on a clear night?', 5000, 'Consider the magnitude limit of human vision and star catalogs', 2, 'astronomy', 109, 'real'),
  ('How many new cars are manufactured worldwide each day?', 200000, 'Think about annual global car production and divide by days', 2, 'industry', 110, 'real'),
  ('How many neurons fire in your brain when you read this sentence?', 100000000, 'Consider areas involved in reading: visual, language, comprehension', 4, 'biology', 111, 'real'),
  ('How many songs have been recorded and released in human history?', 100000000, 'Consider recorded music era (~100 years), global artists, and output rates', 4, 'entertainment', 112, 'real'),
  ('How many chickens are alive on Earth right now?', 25000000000, 'Consider poultry farming scale and consumption rates globally', 3, 'agriculture', 113, 'real'),
  ('How many grains of sand are on all the beaches of Earth?', 7500000000000000000, 'Estimate total beach area, depth of sand, and grains per cubic centimeter', 5, 'geography', 114, 'real'),
  ('How many text messages are sent worldwide in one hour?', 2500000000, 'Consider global smartphone users, messaging app usage, and activity patterns', 3, 'technology', 115, 'real'),
  -- Questions 116-125
  ('How many breaths does a human take in their lifetime?', 700000000, 'Consider breaths per minute, and remember we breathe slower when sleeping', 3, 'biology', 116, 'real'),
  ('How many dominos would you need to span the Great Wall of China?', 100000000, 'Consider the length of the Great Wall and the width of a domino', 4, 'geography', 117, 'real'),
  ('How many lightning strikes occur on Earth per year?', 1400000000, 'Lightning is more common than you think, especially in tropical regions', 3, 'nature', 118, 'real'),
  ('How many soccer balls could fit inside a Boeing 747?', 15000000, 'Estimate the cargo hold volume and soccer ball diameter', 3, 'geometry', 119, 'real'),
  ('How many words has the average 50-year-old person read in their lifetime?', 500000000, 'Consider reading habits from childhood through adulthood', 3, 'daily-life', 120, 'real'),
  ('How many photos are taken worldwide every day?', 4700000000, 'Think about smartphone users and average photos per day', 3, 'technology', 121, 'real'),
  ('How many seconds are in a century?', 3155760000, 'Calculate: seconds per minute x minutes per hour x hours per day x days per year x 100', 2, 'math', 122, 'real'),
  ('How many pencils would it take to draw a line to the Moon?', 1200000000, 'Consider the distance to the Moon and how far one pencil can draw', 4, 'astronomy', 123, 'real'),
  ('How many balloons would it take to lift a person?', 4000, 'Consider the lifting force of helium and average human weight', 3, 'physics', 124, 'real'),
  ('How many times does a bee flap its wings per minute?', 12000, 'Bees have very rapid wing movement to stay airborne', 2, 'biology', 125, 'real')
ON CONFLICT ("order") DO NOTHING;

-- 10.3: Guest Test Questions (orders 201-225)
INSERT INTO public.fermi_questions (prompt, correct_value, hint, difficulty, category, "order", competition_mode) VALUES
  -- Questions 201-215
  ('How many licks does it take to get to the center of a Tootsie Pop?', 364, 'Scientists have actually studied this! Think about lick rate and candy thickness', 2, 'fun', 201, 'guest'),
  ('How many words are in all seven Harry Potter books combined?', 1084000, 'The series has over 4000 pages total - estimate words per page', 3, 'entertainment', 202, 'guest'),
  ('How many spots does a typical ladybug have?', 7, 'Most common ladybugs have a specific pattern', 1, 'nature', 203, 'guest'),
  ('How many dimples are on a regulation golf ball?', 336, 'Dimples help the ball fly straighter - they cover most of the surface', 2, 'sports', 204, 'guest'),
  ('How many windows are in the White House?', 147, 'Consider the building has 6 floors and is quite large', 3, 'architecture', 205, 'guest'),
  ('How many bones are in an adult human body?', 206, 'Babies have more bones that fuse together as they grow', 2, 'biology', 206, 'guest'),
  ('How many countries are there in the world today?', 195, 'Think about continents and how many countries each has', 2, 'geography', 207, 'guest'),
  ('How many M&Ms fit in a regular fun-size bag?', 17, 'Fun-size bags are pretty small - maybe a handful', 1, 'daily-life', 208, 'guest'),
  ('How many keys are on a standard full-size piano?', 88, 'Think about the range of musical notes from very low to very high', 1, 'music', 209, 'guest'),
  ('How many different species of butterflies exist in the world?', 17500, 'Butterflies are found on every continent except Antarctica', 3, 'nature', 210, 'guest'),
  ('How many apps are available in the Apple App Store?', 1800000, 'The App Store has been around since 2008 with millions of developers', 3, 'technology', 211, 'guest'),
  ('How many squares are on a standard chess board?', 64, 'The board is a perfect square grid', 1, 'games', 212, 'guest'),
  ('How many seeds are typically in a watermelon?', 500, 'Think about the size of the watermelon and how seeds are distributed', 2, 'nature', 213, 'guest'),
  ('How many moons does Jupiter have?', 95, 'Jupiter is the largest planet and has many small moons', 3, 'astronomy', 214, 'guest'),
  ('How many steps are in the Eiffel Tower (to the top floor)?', 1665, 'The tower is about 300 meters tall with multiple observation decks', 3, 'architecture', 215, 'guest'),
  -- Questions 216-225
  ('How many taste buds does a human tongue have?', 10000, 'Taste buds regenerate every 2 weeks and cover the tongue surface', 2, 'biology', 216, 'guest'),
  ('How many petals does a typical sunflower have?', 34, 'Sunflowers follow a mathematical pattern called the Fibonacci sequence', 2, 'nature', 217, 'guest'),
  ('How many LEGO bricks are sold worldwide each year?', 75000000000, 'LEGO is one of the largest toy manufacturers - think billions', 4, 'entertainment', 218, 'guest'),
  ('How many muscles are in the human body?', 600, 'Muscles come in three types: skeletal, smooth, and cardiac', 2, 'biology', 219, 'guest'),
  ('How many species of sharks exist?', 500, 'Sharks have been around for 400 million years and come in many sizes', 2, 'nature', 220, 'guest'),
  ('How many different pasta shapes exist in Italy?', 350, 'Each region of Italy has its own traditional pasta shapes', 3, 'food', 221, 'guest'),
  ('How many islands make up the Philippines?', 7641, 'It is one of the largest archipelagos in the world', 3, 'geography', 222, 'guest'),
  ('How many emojis exist in the Unicode standard?', 3600, 'Emojis have grown significantly since the first set in 1999', 3, 'technology', 223, 'guest'),
  ('How many stitches are on a regulation baseball?', 108, 'Each ball is hand-stitched with red thread', 2, 'sports', 224, 'guest'),
  ('How many different languages are spoken in the world today?', 7000, 'Many languages have very few speakers remaining', 3, 'language', 225, 'guest')
ON CONFLICT ("order") DO NOTHING;

-- =====================================================
-- SECTION 11: INSERT SAMPLE CODES
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
-- DONE! Fermi Competition database is fully set up.
-- =====================================================
--
-- Tables created:
-- - fermi_questions: Stores all Fermi estimation problems
-- - classes: Teacher-created classes
-- - students: Student accounts per class
-- - class_questions: Links questions to classes by mode
-- - student_exam_sessions: Tracks exam sessions
-- - answers: Student answers with confidence levels
-- - master_codes: Coordinator access codes
-- - teacher_codes: Teacher access codes
-- - teacher_profiles: Links users to their codes
--
-- Views created:
-- - student_scores: Calculated scores with confidence points
-- - coordinator_teachers: For coordinators to view their teachers
--
-- Functions created:
-- - seed_class_questions: Populate class with questions
-- - claim_code: Claim a teacher or master code
-- - generate_teacher_code: Coordinators can create new codes
-- - get_username_max_numbers: Efficient username lookup
--
-- Question counts:
-- - Mock questions: 25 (orders 1-25)
-- - Real competition questions: 25 (orders 101-125)
-- - Guest test questions: 25 (orders 201-225)
--
-- Sample codes included for testing:
-- - Master: MASTER001, MASTER002, COORD2024
-- - Teacher: TEACH001-005, DEMO001-002, INDIE001, SOLO2024
-- =====================================================
