-- Real Competition Questions
-- Run this AFTER the base schema and codes migration
-- Adds 15 official questions for the real Fermi Competition

-- First, add a competition_mode column to fermi_questions if it doesn't exist
ALTER TABLE public.fermi_questions
ADD COLUMN IF NOT EXISTS competition_mode public.competition_mode NOT NULL DEFAULT 'mock';

-- Update existing questions to be mock competition questions
UPDATE public.fermi_questions SET competition_mode = 'mock' WHERE competition_mode IS NULL;

-- Insert 15 new questions for the real competition
-- These are carefully crafted Fermi estimation problems
INSERT INTO public.fermi_questions (prompt, correct_value, hint, difficulty, category, "order", competition_mode) VALUES

-- Question 1: Population & Demographics
('How many people in the world are currently airborne in commercial flights at any given moment?',
 1000000,
 'Consider the number of flights operating globally and average passengers per flight',
 3, 'transportation', 101, 'real'),

-- Question 2: Time & Biology
('How many times does a human heart beat in an average lifetime?',
 2500000000,
 'Think about beats per minute, hours awake vs asleep, and average lifespan',
 2, 'biology', 102, 'real'),

-- Question 3: Earth & Environment
('How many trees are there on Earth?',
 3000000000000,
 'Consider different biomes, forest density, and global forest coverage',
 4, 'nature', 103, 'real'),

-- Question 4: Daily Life & Consumption
('How many slices of bread are consumed in the United States each day?',
 320000000,
 'Think about population, percentage who eat bread, and slices per person',
 2, 'daily-life', 104, 'real'),

-- Question 5: Technology & Computing
('How many Google searches are performed worldwide in one day?',
 8500000000,
 'Consider global internet users, percentage using Google, and searches per user',
 3, 'technology', 105, 'real'),

-- Question 6: Physics & Scale
('How many atoms are in the human body?',
 7000000000000000000000000000,
 'Consider body mass, composition (mostly oxygen, carbon, hydrogen), and atomic masses',
 5, 'physics', 106, 'real'),

-- Question 7: Economics & Commerce
('How many credit card transactions occur in the United States per second?',
 10000,
 'Think about annual transaction volume and divide appropriately',
 3, 'economics', 107, 'real'),

-- Question 8: Sports & Recreation
('How many golf balls are lost each year in the United States?',
 300000000,
 'Consider number of golfers, rounds played per year, and balls lost per round',
 3, 'sports', 108, 'real'),

-- Question 9: Space & Astronomy
('How many stars are visible to the naked eye on a clear night?',
 5000,
 'Consider the magnitude limit of human vision and star catalogs',
 2, 'astronomy', 109, 'real'),

-- Question 10: Manufacturing & Industry
('How many new cars are manufactured worldwide each day?',
 200000,
 'Think about annual global car production and divide by days',
 2, 'industry', 110, 'real'),

-- Question 11: Human Body & Medicine
('How many neurons fire in your brain when you read this sentence?',
 100000000,
 'Consider areas involved in reading: visual, language, comprehension',
 4, 'biology', 111, 'real'),

-- Question 12: Music & Entertainment
('How many songs have been recorded and released in human history?',
 100000000,
 'Consider recorded music era (~100 years), global artists, and output rates',
 4, 'entertainment', 112, 'real'),

-- Question 13: Food & Agriculture
('How many chickens are alive on Earth right now?',
 25000000000,
 'Consider poultry farming scale and consumption rates globally',
 3, 'agriculture', 113, 'real'),

-- Question 14: Geography & Measurement
('How many grains of sand are on all the beaches of Earth?',
 7500000000000000000,
 'Estimate total beach area, depth of sand, and grains per cubic centimeter',
 5, 'geography', 114, 'real'),

-- Question 15: Communication & Data
('How many text messages are sent worldwide in one hour?',
 2500000000,
 'Consider global smartphone users, messaging app usage, and activity patterns',
 3, 'technology', 115, 'real')

ON CONFLICT ("order") DO NOTHING;

-- Update the seed function to support competition mode
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
-- DONE! 15 real competition questions added.
--
-- Real Competition Questions (orders 101-115):
-- 1. People airborne in flights (~1 million)
-- 2. Heartbeats in a lifetime (~2.5 billion)
-- 3. Trees on Earth (~3 trillion)
-- 4. Bread slices consumed in US daily (~320 million)
-- 5. Google searches per day (~8.5 billion)
-- 6. Atoms in human body (~7×10^27)
-- 7. Credit card transactions per second in US (~10,000)
-- 8. Golf balls lost annually in US (~300 million)
-- 9. Stars visible to naked eye (~5,000)
-- 10. Cars manufactured daily worldwide (~200,000)
-- 11. Neurons firing reading a sentence (~100 million)
-- 12. Songs recorded in history (~100 million)
-- 13. Chickens alive on Earth (~25 billion)
-- 14. Grains of sand on beaches (~7.5×10^18)
-- 15. Text messages sent per hour (~2.5 billion)
-- =====================================================
