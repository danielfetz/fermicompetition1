-- Competition Modes Migration
-- Run this AFTER the base supabase.sql schema is in place
-- This adds support for mock vs real competitions with separate questions and answers

-- =====================================================
-- STEP 1: Create competition_mode enum type
-- =====================================================
DO $$ BEGIN
  CREATE TYPE public.competition_mode AS ENUM ('mock', 'real');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- STEP 2: Add competition_mode to class_questions
-- =====================================================
ALTER TABLE public.class_questions
ADD COLUMN IF NOT EXISTS competition_mode public.competition_mode NOT NULL DEFAULT 'mock';

-- Drop and recreate unique constraints to include competition_mode
ALTER TABLE public.class_questions DROP CONSTRAINT IF EXISTS class_questions_class_id_order_key;
ALTER TABLE public.class_questions DROP CONSTRAINT IF EXISTS class_questions_class_id_fermi_question_id_key;

ALTER TABLE public.class_questions
ADD CONSTRAINT class_questions_class_mode_order_key UNIQUE (class_id, competition_mode, "order");

ALTER TABLE public.class_questions
ADD CONSTRAINT class_questions_class_mode_question_key UNIQUE (class_id, competition_mode, fermi_question_id);

-- =====================================================
-- STEP 3: Add competition_mode to student_exam_sessions
-- =====================================================
ALTER TABLE public.student_exam_sessions
ADD COLUMN IF NOT EXISTS competition_mode public.competition_mode NOT NULL DEFAULT 'mock';

-- Drop and recreate unique constraint to include competition_mode
ALTER TABLE public.student_exam_sessions DROP CONSTRAINT IF EXISTS student_exam_sessions_student_id_key;

ALTER TABLE public.student_exam_sessions
ADD CONSTRAINT student_exam_sessions_student_mode_key UNIQUE (student_id, competition_mode);

-- =====================================================
-- STEP 4: Add competition_mode to answers
-- Note: class_question_id already implicitly links to a competition_mode,
-- but we add it explicitly for easier querying and to ensure data integrity
-- =====================================================
ALTER TABLE public.answers
ADD COLUMN IF NOT EXISTS competition_mode public.competition_mode NOT NULL DEFAULT 'mock';

-- Drop and recreate unique constraint to include competition_mode
ALTER TABLE public.answers DROP CONSTRAINT IF EXISTS answers_student_id_class_question_id_key;

ALTER TABLE public.answers
ADD CONSTRAINT answers_student_question_mode_key UNIQUE (student_id, class_question_id, competition_mode);

-- =====================================================
-- STEP 5: Update student_scores view to include competition_mode
-- =====================================================
DROP VIEW IF EXISTS public.student_scores;

CREATE OR REPLACE VIEW public.student_scores AS
SELECT
  s.id AS student_id,
  s.class_id,
  s.username,
  s.full_name,
  s.has_completed_exam,
  a.competition_mode,
  count(a.id) AS total_answered,
  count(*) FILTER (
    WHERE fq.correct_value IS NOT NULL
      AND a.value BETWEEN (fq.correct_value * 0.5) AND (fq.correct_value * 1.5)
  ) AS correct_count,
  round(
    CASE
      WHEN count(a.id) > 0 THEN
        (count(*) FILTER (
          WHERE fq.correct_value IS NOT NULL
            AND a.value BETWEEN (fq.correct_value * 0.5) AND (fq.correct_value * 1.5)
        )::numeric / count(a.id)::numeric) * 100
      ELSE 0
    END, 1
  ) AS score_percentage
FROM public.students s
LEFT JOIN public.answers a ON a.student_id = s.id
LEFT JOIN public.class_questions cq ON cq.id = a.class_question_id
LEFT JOIN public.fermi_questions fq ON fq.id = cq.fermi_question_id
GROUP BY s.id, s.class_id, s.username, s.full_name, s.has_completed_exam, a.competition_mode;

-- =====================================================
-- STEP 6: Update seed_class_questions function to support competition_mode
-- =====================================================
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

-- =====================================================
-- STEP 7: Create separate fermi questions for real competition (optional)
-- These are placeholder questions - replace with actual competition questions
-- =====================================================
-- Note: For the real competition, you may want to create a separate set of
-- questions with different "order" values (e.g., 101-110 for real competition)
-- or add a competition_mode column to fermi_questions as well.
--
-- For now, the same questions can be used for both modes, but answers and
-- progress are tracked separately.

-- =====================================================
-- STEP 8: Add helper function to check if student has completed specific mode
-- =====================================================
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

-- =====================================================
-- DONE! Competition modes are now supported.
--
-- Usage:
-- - Each class can have questions for both 'mock' and 'real' modes
-- - Students can submit separate answers for each mode
-- - Sessions are tracked per mode per student
-- - Scores are calculated per mode
-- =====================================================
