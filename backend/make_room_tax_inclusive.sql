-- =========================================================================
-- DATABASE MIGRATION: MAKE ROOM TAX INCLUSIVE
-- =========================================================================
-- This script updates the trigger function that automatically calculates
-- booking totals to treat the room price as INCLUSIVE of the 12.5% tax.
-- It works backwards from the total_room_price_ngn to extract the tax.
-- =========================================================================

CREATE OR REPLACE FUNCTION public.recalculate_booking_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_tax_rate DECIMAL(5,2) := 12.5; -- Total room tax is 12.5%
  v_extras_tax_rate DECIMAL(5,2) := 7.5;
  v_room_inclusive_subtotal DECIMAL(12,2);
  v_room_base DECIMAL(12,2);
  v_taxable_extras DECIMAL(12,2);
  v_nontaxable_extras DECIMAL(12,2);
  v_extras_tax DECIMAL(12,2);
BEGIN
  -- Room subtotal is Room inclusive price minus any manual discounts
  v_room_inclusive_subtotal := GREATEST(0, COALESCE(NEW.total_room_price_ngn, 0) - COALESCE(NEW.discount_amount_ngn, 0));
  
  -- Since room price is inclusive, the base price is (Inclusive / 1.125)
  v_room_base := v_room_inclusive_subtotal / (1 + (v_room_tax_rate/100));
  
  -- Calculate taxable and nontaxable extras for this booking from booking_services
  SELECT 
    COALESCE(SUM(CASE WHEN s.tax_inclusive = TRUE THEN bs.total_price_ngn ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN s.tax_inclusive = FALSE THEN bs.total_price_ngn ELSE 0 END), 0)
  INTO v_taxable_extras, v_nontaxable_extras
  FROM public.booking_services bs
  JOIN public.services s ON bs.service_id = s.id
  WHERE bs.booking_id = NEW.id AND bs.status != 'cancelled';
  
  -- Set total extras (sum of base prices of services)
  NEW.total_extras_price_ngn := v_taxable_extras + v_nontaxable_extras;
  
  -- Calculate total tax on extras (extras are exclusive of tax)
  v_extras_tax := v_taxable_extras * (v_extras_tax_rate/100);
  
  -- Set total amount: 
  -- Room is already inclusive, so we just take v_room_inclusive_subtotal
  -- Then add extras and their tax, and caution fee
  NEW.total_amount_ngn := ROUND(v_room_inclusive_subtotal + v_taxable_extras + v_extras_tax + v_nontaxable_extras + COALESCE(NEW.caution_fee_ngn, 0));
  
  RETURN NEW;
END;
$$;
