-- Test what puzzle number should be for today (June 25, 2025)
-- Using the same calculation as your app

SELECT 
  CURRENT_DATE as today_date,
  DATE '2025-06-24' as base_date,
  EXTRACT(DAY FROM (CURRENT_DATE - DATE '2025-06-24'))::integer as days_since_base,
  1466 + EXTRACT(DAY FROM (CURRENT_DATE - DATE '2025-06-24'))::integer as calculated_puzzle_number;

-- Also check what the PST timezone would give us
SELECT 
  NOW() AT TIME ZONE 'America/Los_Angeles' as pst_now,
  (NOW() AT TIME ZONE 'America/Los_Angeles')::date as pst_date; 