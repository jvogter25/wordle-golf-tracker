-- Simple test for today's puzzle number (June 25, 2025)
SELECT 
  DATE '2025-06-25' as today,
  DATE '2025-06-24' as base_date,
  (DATE '2025-06-25' - DATE '2025-06-24') as days_difference,
  1466 + (DATE '2025-06-25' - DATE '2025-06-24') as correct_puzzle_number; 