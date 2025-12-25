-- Guest Test Questions Migration
-- Run this AFTER the base schema and competition modes migrations
-- Adds 'guest' competition mode for testing without credentials
-- These questions are fun, accessible, and distinct from mock/real questions

-- =====================================================
-- STEP 1: Add 'guest' to the competition_mode enum
-- =====================================================
-- Note: PostgreSQL doesn't allow easy enum modification, so we use ALTER TYPE
ALTER TYPE public.competition_mode ADD VALUE IF NOT EXISTS 'guest';

-- =====================================================
-- STEP 2: Insert Guest Test Questions (orders 201-215)
-- Fun, accessible Fermi problems for parents/students to try
-- =====================================================
INSERT INTO public.fermi_questions (prompt, correct_value, hint, difficulty, category, "order", competition_mode) VALUES

-- Question 1: Fun food estimation
('How many licks does it take to get to the center of a Tootsie Pop?',
 364,
 'Scientists have actually studied this! Think about lick rate and candy thickness',
 2, 'fun', 201, 'guest'),

-- Question 2: Movies & Entertainment
('How many words are in all seven Harry Potter books combined?',
 1084000,
 'The series has over 4000 pages total - estimate words per page',
 3, 'entertainment', 202, 'guest'),

-- Question 3: Animals
('How many spots does a typical ladybug have?',
 7,
 'Most common ladybugs have a specific pattern',
 1, 'nature', 203, 'guest'),

-- Question 4: Everyday objects
('How many dimples are on a regulation golf ball?',
 336,
 'Dimples help the ball fly straighter - they cover most of the surface',
 2, 'sports', 204, 'guest'),

-- Question 5: Architecture & Landmarks
('How many windows are in the White House?',
 147,
 'Consider the building has 6 floors and is quite large',
 3, 'architecture', 205, 'guest'),

-- Question 6: Human body
('How many bones are in an adult human body?',
 206,
 'Babies have more bones that fuse together as they grow',
 2, 'biology', 206, 'guest'),

-- Question 7: Geography
('How many countries are there in the world today?',
 195,
 'Think about continents and how many countries each has',
 2, 'geography', 207, 'guest'),

-- Question 8: Food & Snacks
('How many M&Ms fit in a regular fun-size bag?',
 17,
 'Fun-size bags are pretty small - maybe a handful',
 1, 'daily-life', 208, 'guest'),

-- Question 9: Music
('How many keys are on a standard full-size piano?',
 88,
 'Think about the range of musical notes from very low to very high',
 1, 'music', 209, 'guest'),

-- Question 10: Nature & Animals
('How many different species of butterflies exist in the world?',
 17500,
 'Butterflies are found on every continent except Antarctica',
 3, 'nature', 210, 'guest'),

-- Question 11: Technology
('How many apps are available in the Apple App Store?',
 1800000,
 'The App Store has been around since 2008 with millions of developers',
 3, 'technology', 211, 'guest'),

-- Question 12: Sports & Games
('How many squares are on a standard chess board?',
 64,
 'The board is a perfect square grid',
 1, 'games', 212, 'guest'),

-- Question 13: Food
('How many seeds are typically in a watermelon?',
 500,
 'Think about the size of the watermelon and how seeds are distributed',
 2, 'nature', 213, 'guest'),

-- Question 14: Space
('How many moons does Jupiter have?',
 95,
 'Jupiter is the largest planet and has many small moons',
 3, 'astronomy', 214, 'guest'),

-- Question 15: Everyday Life
('How many steps are in the Eiffel Tower (to the top floor)?',
 1665,
 'The tower is about 300 meters tall with multiple observation decks',
 3, 'architecture', 215, 'guest')

ON CONFLICT ("order") DO NOTHING;

-- =====================================================
-- STEP 3: Add more guest questions (orders 216-225)
-- =====================================================
INSERT INTO public.fermi_questions (prompt, correct_value, hint, difficulty, category, "order", competition_mode) VALUES

-- Question 16: Animals
('How many taste buds does a human tongue have?',
 10000,
 'Taste buds regenerate every 2 weeks and cover the tongue surface',
 2, 'biology', 216, 'guest'),

-- Question 17: Nature
('How many petals does a typical sunflower have?',
 34,
 'Sunflowers follow a mathematical pattern called the Fibonacci sequence',
 2, 'nature', 217, 'guest'),

-- Question 18: Toys & Games
('How many LEGO bricks are sold worldwide each year?',
 75000000000,
 'LEGO is one of the largest toy manufacturers - think billions',
 4, 'entertainment', 218, 'guest'),

-- Question 19: Human Body
('How many muscles are in the human body?',
 600,
 'Muscles come in three types: skeletal, smooth, and cardiac',
 2, 'biology', 219, 'guest'),

-- Question 20: Nature
('How many species of sharks exist?',
 500,
 'Sharks have been around for 400 million years and come in many sizes',
 2, 'nature', 220, 'guest'),

-- Question 21: Food
('How many different pasta shapes exist in Italy?',
 350,
 'Each region of Italy has its own traditional pasta shapes',
 3, 'food', 221, 'guest'),

-- Question 22: Geography
('How many islands make up the Philippines?',
 7641,
 'It is one of the largest archipelagos in the world',
 3, 'geography', 222, 'guest'),

-- Question 23: Technology
('How many emojis exist in the Unicode standard?',
 3600,
 'Emojis have grown significantly since the first set in 1999',
 3, 'technology', 223, 'guest'),

-- Question 24: Sports
('How many stitches are on a regulation baseball?',
 108,
 'Each ball is hand-stitched with red thread',
 2, 'sports', 224, 'guest'),

-- Question 25: Daily Life
('How many different languages are spoken in the world today?',
 7000,
 'Many languages have very few speakers remaining',
 3, 'language', 225, 'guest')

ON CONFLICT ("order") DO NOTHING;

-- =====================================================
-- DONE! Guest test questions added.
--
-- Guest Questions (orders 201-225):
-- 1. Licks to Tootsie Pop center (~364)
-- 2. Words in Harry Potter series (~1,084,000)
-- 3. Spots on a ladybug (~7)
-- 4. Dimples on a golf ball (~336)
-- 5. Windows in White House (~147)
-- 6. Bones in human body (~206)
-- 7. Countries in the world (~195)
-- 8. M&Ms in fun-size bag (~17)
-- 9. Keys on a piano (~88)
-- 10. Butterfly species (~17,500)
-- 11. Apps in App Store (~1,800,000)
-- 12. Squares on a chess board (~64)
-- 13. Seeds in a watermelon (~500)
-- 14. Moons of Jupiter (~95)
-- 15. Steps in Eiffel Tower (~1,665)
-- 16. Taste buds on tongue (~10,000)
-- 17. Petals on a sunflower (~34)
-- 18. LEGO bricks sold/year (~75 billion)
-- 19. Muscles in human body (~600)
-- 20. Species of sharks (~500)
-- 21. Pasta shapes in Italy (~350)
-- 22. Islands in Philippines (~7,641)
-- 23. Emojis in Unicode (~3,600)
-- 24. Stitches on a baseball (~108)
-- 25. Languages in the world (~7,000)
-- =====================================================
