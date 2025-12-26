-- Students Competition Mode Migration
-- Run this to add competition_mode support to students table
-- This allows separate credentials for mock vs real competitions

-- Add competition_mode column to students table
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS competition_mode public.competition_mode NOT NULL DEFAULT 'mock';

-- Drop and recreate the unique constraint to include competition_mode
-- Students can have separate credentials for mock and real competitions
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_class_id_username_key;

ALTER TABLE public.students
ADD CONSTRAINT students_class_mode_username_key UNIQUE (class_id, competition_mode, username);

-- Update the student_scores view to include competition_mode from students
DROP VIEW IF EXISTS public.student_scores;

CREATE OR REPLACE VIEW public.student_scores AS
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
  ) AS score_percentage
FROM public.students s
LEFT JOIN public.answers a ON a.student_id = s.id
LEFT JOIN public.class_questions cq ON cq.id = a.class_question_id
LEFT JOIN public.fermi_questions fq ON fq.id = cq.fermi_question_id
GROUP BY s.id, s.class_id, s.username, s.full_name, s.has_completed_exam, s.competition_mode;

-- =====================================================
-- DONE! Students now support competition modes.
--
-- Changes:
-- - students.competition_mode column added (default: 'mock')
-- - Unique constraint updated: (class_id, competition_mode, username)
-- - student_scores view updated to include competition_mode
--
-- This allows:
-- - Same class can have different student lists for mock vs real
-- - A username can exist in both modes with different passwords
-- - Scores are tracked separately per mode
-- =====================================================
