-- Confidence-Based Point Scoring System Migration
-- Run this in Supabase SQL Editor to add point scoring

-- Points are calculated as follows:
-- Base points: 250
-- Per answer based on confidence:
--   0-20% (10): +3 if correct, 0 if wrong
--   20-40% (30): +7 if correct, -1 if wrong
--   40-60% (50): +10 if correct, -3 if wrong
--   60-80% (70): +12 if correct, -6 if wrong
--   80-100% (90): +13 if correct, -10 if wrong

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

-- =====================================================
-- DONE! Confidence-based point scoring is now available.
--
-- The student_scores view now includes:
-- - confidence_points: Total points (250 base + answer points)
--
-- Scoring logic:
-- - Higher confidence = higher risk/reward
-- - Wrong answers with high confidence are penalized more
-- - Low confidence correct answers earn fewer points but wrong answers don't hurt
-- =====================================================
