-- Add tier_pricing to rooms to allow variable pricing based on number of unlocked bedrooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS tier_pricing JSONB DEFAULT '{}'::jsonb;

-- Add unlocked_bedrooms to bookings to track how many bedrooms the guest paid for
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS unlocked_bedrooms INTEGER;
