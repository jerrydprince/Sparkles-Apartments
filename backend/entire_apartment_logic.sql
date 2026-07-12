-- 1. Update capacity of the Entire Apartment to accommodate larger bookings
UPDATE rooms 
SET capacity = 40 
WHERE name = 'Entire Apartment';

-- 2. Update the RPC function to enforce exclusivity logic for Entire Apartment
CREATE OR REPLACE FUNCTION get_booked_room_ids(req_start_date DATE, req_end_date DATE)
RETURNS TABLE (booked_room_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  entire_apt_id UUID;
BEGIN
  -- Get the ID of the 'Entire Apartment' room dynamically
  SELECT id INTO entire_apt_id FROM rooms WHERE name = 'Entire Apartment' LIMIT 1;

  RETURN QUERY 
  WITH raw_bookings AS (
    -- Fetch raw booked room IDs within the date range
    SELECT DISTINCT b.room_id
    FROM bookings b
    WHERE b.status != 'cancelled'
      AND b.check_in_date < req_end_date
      AND b.check_out_date > req_start_date
  ),
  is_entire_booked AS (
    -- Check if the Entire Apartment itself is currently booked
    SELECT bool_or(room_id = entire_apt_id) as booked FROM raw_bookings
  ),
  is_any_booked AS (
    -- Check if ANY regular apartment room is booked
    -- We exclude Events Area, Lounge, and Rentals from triggering this overlap
    SELECT bool_or(
      room_id != entire_apt_id 
      AND r.name NOT ILIKE '%Event%' 
      AND r.name NOT ILIKE '%Lounge%' 
      AND r.name NOT ILIKE '%Rental%'
    ) as booked 
    FROM raw_bookings rb
    JOIN rooms r ON r.id = rb.room_id
  )
  -- 1. Return all specifically booked rooms
  SELECT room_id FROM raw_bookings
  
  UNION
  
  -- 2. If 'Entire Apartment' is booked, block ALL regular rooms
  SELECT id FROM rooms 
  WHERE (SELECT booked FROM is_entire_booked) 
    AND name NOT ILIKE '%Event%' 
    AND name NOT ILIKE '%Lounge%' 
    AND name NOT ILIKE '%Rental%'
    
  UNION
  
  -- 3. If ANY regular room is booked, block the 'Entire Apartment'
  SELECT entire_apt_id 
  WHERE (SELECT booked FROM is_any_booked) AND entire_apt_id IS NOT NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION get_booked_room_ids(DATE, DATE) TO anon, authenticated;
