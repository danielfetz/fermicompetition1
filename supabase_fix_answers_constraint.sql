-- Fix: Add missing unique constraint for answers upsert
-- Run this in Supabase SQL Editor

-- First, check if there are any duplicate entries that would prevent the constraint
-- If this returns rows, you'll need to delete duplicates first
SELECT student_id, class_question_id, COUNT(*)
FROM public.answers
GROUP BY student_id, class_question_id
HAVING COUNT(*) > 1;

-- If no duplicates, add the constraint:
ALTER TABLE public.answers
ADD CONSTRAINT answers_student_question_unique
UNIQUE (student_id, class_question_id);
