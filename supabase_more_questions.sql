-- Additional Questions Migration
-- Adds 15 more mock questions and 10 more official questions
-- Run this AFTER the base schema and real questions migrations

-- =====================================================
-- ADDITIONAL MOCK/PRACTICE QUESTIONS (orders 11-25)
-- =====================================================
INSERT INTO public.fermi_questions (prompt, correct_value, hint, difficulty, category, "order", competition_mode) VALUES

-- Question 11
('How many steps does the average person take in a year?',
 2000000,
 'Think about daily steps and multiply by days in a year',
 2, 'daily-life', 11, 'mock'),

-- Question 12
('How many bricks are in the Empire State Building?',
 10000000,
 'Consider the building dimensions and typical brick sizes',
 4, 'architecture', 12, 'mock'),

-- Question 13
('How many drops of water are in an Olympic swimming pool?',
 2000000000000,
 'Calculate pool volume in liters, then drops per liter',
 3, 'physics', 13, 'mock'),

-- Question 14
('How many books are in the Library of Congress?',
 17000000,
 'It is the largest library in the world',
 2, 'knowledge', 14, 'mock'),

-- Question 15
('How many blades of grass are on a football field?',
 400000000,
 'Estimate field area and grass blade density per square inch',
 3, 'nature', 15, 'mock'),

-- Question 16
('How many hours does the average person spend sleeping in their lifetime?',
 230000,
 'Consider average sleep per night and average lifespan',
 2, 'daily-life', 16, 'mock'),

-- Question 17
('How many commercial flights take off worldwide each day?',
 100000,
 'Think about major airports and their daily departures',
 3, 'transportation', 17, 'mock'),

-- Question 18
('How many hot dogs are eaten at baseball games in the US each season?',
 20000000,
 'Consider MLB attendance and hot dogs per fan',
 3, 'sports', 18, 'mock'),

-- Question 19
('How many emails are sent worldwide every second?',
 3500000,
 'Think about global email users and their activity',
 3, 'technology', 19, 'mock'),

-- Question 20
('How many neurons are in the human brain?',
 86000000000,
 'The brain is the most complex organ',
 3, 'biology', 20, 'mock'),

-- Question 21
('How many people are eating at McDonalds right now worldwide?',
 2000000,
 'Consider restaurants worldwide, customers per restaurant, and time zones',
 3, 'daily-life', 21, 'mock'),

-- Question 22
('How many teeth do all the people in your country have combined?',
 2000000000,
 'Average teeth per person times population (assuming ~70 million people)',
 2, 'biology', 22, 'mock'),

-- Question 23
('How many cups of coffee are consumed worldwide each day?',
 2250000000,
 'Consider coffee drinking nations and cups per person',
 3, 'daily-life', 23, 'mock'),

-- Question 24
('How many kilometers does the Earth travel around the Sun in one year?',
 940000000,
 'Think about orbital circumference using the distance to the Sun',
 3, 'astronomy', 24, 'mock'),

-- Question 25
('How many cells are in the human body?',
 37000000000000,
 'The body is made of trillions of cells of different types',
 4, 'biology', 25, 'mock')

ON CONFLICT ("order") DO NOTHING;

-- =====================================================
-- ADDITIONAL OFFICIAL COMPETITION QUESTIONS (orders 116-125)
-- =====================================================
INSERT INTO public.fermi_questions (prompt, correct_value, hint, difficulty, category, "order", competition_mode) VALUES

-- Question 16
('How many breaths does a human take in their lifetime?',
 700000000,
 'Consider breaths per minute, and remember we breathe slower when sleeping',
 3, 'biology', 116, 'real'),

-- Question 17
('How many dominos would you need to span the Great Wall of China?',
 100000000,
 'Consider the length of the Great Wall and the width of a domino',
 4, 'geography', 117, 'real'),

-- Question 18
('How many lightning strikes occur on Earth per year?',
 1400000000,
 'Lightning is more common than you think, especially in tropical regions',
 3, 'nature', 118, 'real'),

-- Question 19
('How many soccer balls could fit inside a Boeing 747?',
 15000000,
 'Estimate the cargo hold volume and soccer ball diameter',
 3, 'geometry', 119, 'real'),

-- Question 20
('How many words has the average 50-year-old person read in their lifetime?',
 500000000,
 'Consider reading habits from childhood through adulthood',
 3, 'daily-life', 120, 'real'),

-- Question 21
('How many photos are taken worldwide every day?',
 4700000000,
 'Think about smartphone users and average photos per day',
 3, 'technology', 121, 'real'),

-- Question 22
('How many seconds are in a century?',
 3155760000,
 'Calculate: seconds per minute × minutes per hour × hours per day × days per year × 100',
 2, 'math', 122, 'real'),

-- Question 23
('How many pencils would it take to draw a line to the Moon?',
 1200000000,
 'Consider the distance to the Moon and how far one pencil can draw',
 4, 'astronomy', 123, 'real'),

-- Question 24
('How many balloons would it take to lift a person?',
 4000,
 'Consider the lifting force of helium and average human weight',
 3, 'physics', 124, 'real'),

-- Question 25
('How many times does a bee flap its wings per minute?',
 12000,
 'Bees have very rapid wing movement to stay airborne',
 2, 'biology', 125, 'real')

ON CONFLICT ("order") DO NOTHING;

-- =====================================================
-- DONE! Additional questions added.
--
-- Mock/Practice questions: 11-25 (15 new questions, total 25)
-- Official questions: 116-125 (10 new questions, total 25)
-- =====================================================
