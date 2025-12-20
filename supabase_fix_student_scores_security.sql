-- Fix student_scores view security
-- Run this in your Supabase SQL Editor
--
-- The issue: student_scores view is publicly accessible and exposes full_name
-- The fix: Add RLS so only teachers can see their students' scores

-- Step 1: Drop and recreate the view with security_invoker
DROP VIEW IF EXISTS public.student_scores;

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
  ) AS score_percentage,
  250 + COALESCE(SUM(
    CASE
      WHEN fq.correct_value IS NOT NULL
        AND a.value BETWEEN (fq.correct_value * 0.5) AND (fq.correct_value * 1.5) THEN
        CASE a.confidence_pct
          WHEN 10 THEN 3
          WHEN 30 THEN 6
          WHEN 50 THEN 10
          WHEN 70 THEN 12
          WHEN 90 THEN 13
          ELSE 0
        END
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

-- Step 2: Grant access only to authenticated users
REVOKE ALL ON public.student_scores FROM anon;
GRANT SELECT ON public.student_scores TO authenticated;

-- The view now uses security_invoker = true, which means:
-- - It runs with the permissions of the CALLING user, not the view owner
-- - RLS policies on the underlying 'students' table will be enforced
-- - Only teachers can see their students (via existing RLS on students table)
-- - Anonymous users cannot access this view at all
