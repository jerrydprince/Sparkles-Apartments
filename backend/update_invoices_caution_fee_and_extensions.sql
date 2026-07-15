-- 1. Add caution_fee to invoices table
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS caution_fee DECIMAL(12,2) DEFAULT 0;

-- 2. Update auto_generate_invoice function
CREATE OR REPLACE FUNCTION auto_generate_invoice()
RETURNS TRIGGER AS $$
DECLARE
  calculated_subtotal DECIMAL(12,2);
  calculated_tax DECIMAL(12,2);
  tax_rate DECIMAL(5,2) := 7.5;
  inv_number TEXT;
  caution_fee_amount DECIMAL(12,2);
BEGIN
  -- Subtotal is raw room stay cost + raw services cost (before discount and before tax)
  calculated_subtotal := GREATEST(0, NEW.total_room_price_ngn + NEW.total_extras_price_ngn);
  
  -- VAT is 7.5% calculated on the discounted net subtotal
  calculated_tax := GREATEST(0, (calculated_subtotal - COALESCE(NEW.discount_amount_ngn, 0)) * (tax_rate/100));

  -- Get Caution Fee
  caution_fee_amount := COALESCE(NEW.caution_fee_ngn, 0);
  
  inv_number := 'INV-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 4);

  INSERT INTO invoices (booking_id, invoice_number, due_date, subtotal, tax_rate_percent, tax_amount, caution_fee, total_amount, amount_paid, status)
  VALUES (
    NEW.id,
    inv_number,
    NEW.check_in_date, -- due on check-in
    calculated_subtotal,
    tax_rate,
    calculated_tax,
    caution_fee_amount,
    NEW.total_amount_ngn, -- already calculated with tax + caution_fee in frontend
    NEW.amount_paid_ngn,
    CASE 
      WHEN NEW.amount_paid_ngn >= NEW.total_amount_ngn THEN 'paid'::invoice_status
      WHEN NEW.amount_paid_ngn > 0 THEN 'partial'::invoice_status
      ELSE 'draft'::invoice_status
    END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create function to sync invoice when booking updates
CREATE OR REPLACE FUNCTION sync_invoice_on_booking_update()
RETURNS TRIGGER AS $$
DECLARE
  calculated_subtotal DECIMAL(12,2);
  calculated_tax DECIMAL(12,2);
  tax_rate DECIMAL(5,2) := 7.5;
  caution_fee_amount DECIMAL(12,2);
BEGIN
  -- Only proceed if financial fields have changed
  IF NEW.total_room_price_ngn IS DISTINCT FROM OLD.total_room_price_ngn OR
     NEW.total_extras_price_ngn IS DISTINCT FROM OLD.total_extras_price_ngn OR
     NEW.discount_amount_ngn IS DISTINCT FROM OLD.discount_amount_ngn OR
     NEW.caution_fee_ngn IS DISTINCT FROM OLD.caution_fee_ngn OR
     NEW.total_amount_ngn IS DISTINCT FROM OLD.total_amount_ngn OR
     NEW.amount_paid_ngn IS DISTINCT FROM OLD.amount_paid_ngn OR
     NEW.check_in_date IS DISTINCT FROM OLD.check_in_date
  THEN

    calculated_subtotal := GREATEST(0, NEW.total_room_price_ngn + NEW.total_extras_price_ngn);
    calculated_tax := GREATEST(0, (calculated_subtotal - COALESCE(NEW.discount_amount_ngn, 0)) * (tax_rate/100));
    caution_fee_amount := COALESCE(NEW.caution_fee_ngn, 0);

    UPDATE invoices 
    SET 
        subtotal = calculated_subtotal,
        tax_amount = calculated_tax,
        caution_fee = caution_fee_amount,
        total_amount = NEW.total_amount_ngn,
        amount_paid = NEW.amount_paid_ngn,
        due_date = NEW.check_in_date,
        status = CASE 
            WHEN NEW.amount_paid_ngn >= NEW.total_amount_ngn THEN 'paid'::invoice_status
            WHEN NEW.amount_paid_ngn > 0 THEN 'partial'::invoice_status
            ELSE 'draft'::invoice_status
        END,
        updated_at = timezone('utc'::text, now())
    WHERE booking_id = NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach AFTER UPDATE trigger on bookings
DROP TRIGGER IF EXISTS trigger_sync_invoice ON bookings;
CREATE TRIGGER trigger_sync_invoice
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION sync_invoice_on_booking_update();

-- 5. Backfill existing invoices with caution fee
UPDATE invoices
SET caution_fee = COALESCE(b.caution_fee_ngn, 0)
FROM bookings b
WHERE invoices.booking_id = b.id AND invoices.caution_fee = 0;
