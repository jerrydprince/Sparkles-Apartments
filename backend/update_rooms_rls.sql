-- =========================================================================
-- FIX FRONT DESK CHECKOUT SYNCING BUG
-- =========================================================================
-- Run this script inside your Supabase Dashboard SQL Editor to:
-- 1. Drop the existing "Only admins can modify rooms" RLS policy.
-- 2. Recreate it to also include the 'front_desk' role so they can update room statuses to 'available' during checkout.
-- =========================================================================

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Only admins can modify rooms" ON rooms;

-- Create the new policy including 'front_desk'
CREATE POLICY "Only admins can modify rooms" ON rooms FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'hotel_manager', 'front_desk'))
);
