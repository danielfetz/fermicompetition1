-- Efficient username max number lookup function
-- Run this in Supabase SQL Editor

-- This function returns the max number used for each base username pattern
-- e.g., if boldeinstein01, boldeinstein02, boldeinstein05 exist,
-- it returns { base: 'boldeinstein', max_num: 5 }
--
-- This is much more efficient than fetching all usernames:
-- - Aggregation happens on the database server
-- - Only returns ~600 rows max (20 adjectives x 30 scientists)
-- - Uses efficient regex and GROUP BY

CREATE OR REPLACE FUNCTION get_username_max_numbers()
RETURNS TABLE (base text, max_num int) AS $$
BEGIN
  RETURN QUERY
  SELECT
    regexp_replace(username, '\d+$', '') AS base,
    MAX(CAST(regexp_replace(username, '^.*?(\d+)$', '\1') AS int)) AS max_num
  FROM students
  WHERE username ~ '\d+$'  -- Only usernames ending with numbers
  GROUP BY regexp_replace(username, '\d+$', '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_username_max_numbers() TO service_role;
