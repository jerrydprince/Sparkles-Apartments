-- Enable RLS and add prototype policies for missing tables

-- 1. booking_services
ALTER TABLE booking_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all selects for prototype" ON booking_services;
DROP POLICY IF EXISTS "Allow all inserts for prototype" ON booking_services;
DROP POLICY IF EXISTS "Allow all updates for prototype" ON booking_services;
DROP POLICY IF EXISTS "Allow all deletes for prototype" ON booking_services;
CREATE POLICY "Allow all selects for prototype" ON booking_services FOR SELECT USING (true);
CREATE POLICY "Allow all inserts for prototype" ON booking_services FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates for prototype" ON booking_services FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes for prototype" ON booking_services FOR DELETE USING (true);

-- 2. service_staff_assignments
ALTER TABLE service_staff_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all selects for prototype" ON service_staff_assignments;
DROP POLICY IF EXISTS "Allow all inserts for prototype" ON service_staff_assignments;
DROP POLICY IF EXISTS "Allow all updates for prototype" ON service_staff_assignments;
DROP POLICY IF EXISTS "Allow all deletes for prototype" ON service_staff_assignments;
CREATE POLICY "Allow all selects for prototype" ON service_staff_assignments FOR SELECT USING (true);
CREATE POLICY "Allow all inserts for prototype" ON service_staff_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates for prototype" ON service_staff_assignments FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes for prototype" ON service_staff_assignments FOR DELETE USING (true);

-- 3. services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all selects for prototype" ON services;
DROP POLICY IF EXISTS "Allow all inserts for prototype" ON services;
DROP POLICY IF EXISTS "Allow all updates for prototype" ON services;
DROP POLICY IF EXISTS "Allow all deletes for prototype" ON services;
CREATE POLICY "Allow all selects for prototype" ON services FOR SELECT USING (true);
CREATE POLICY "Allow all inserts for prototype" ON services FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates for prototype" ON services FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes for prototype" ON services FOR DELETE USING (true);

-- 4. notification_templates
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all selects for prototype" ON notification_templates;
DROP POLICY IF EXISTS "Allow all inserts for prototype" ON notification_templates;
DROP POLICY IF EXISTS "Allow all updates for prototype" ON notification_templates;
DROP POLICY IF EXISTS "Allow all deletes for prototype" ON notification_templates;
CREATE POLICY "Allow all selects for prototype" ON notification_templates FOR SELECT USING (true);
CREATE POLICY "Allow all inserts for prototype" ON notification_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates for prototype" ON notification_templates FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes for prototype" ON notification_templates FOR DELETE USING (true);

-- 5. automation_rules
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all selects for prototype" ON automation_rules;
DROP POLICY IF EXISTS "Allow all inserts for prototype" ON automation_rules;
DROP POLICY IF EXISTS "Allow all updates for prototype" ON automation_rules;
DROP POLICY IF EXISTS "Allow all deletes for prototype" ON automation_rules;
CREATE POLICY "Allow all selects for prototype" ON automation_rules FOR SELECT USING (true);
CREATE POLICY "Allow all inserts for prototype" ON automation_rules FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates for prototype" ON automation_rules FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes for prototype" ON automation_rules FOR DELETE USING (true);

-- 6. notification_logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all selects for prototype" ON notification_logs;
DROP POLICY IF EXISTS "Allow all inserts for prototype" ON notification_logs;
DROP POLICY IF EXISTS "Allow all updates for prototype" ON notification_logs;
DROP POLICY IF EXISTS "Allow all deletes for prototype" ON notification_logs;
CREATE POLICY "Allow all selects for prototype" ON notification_logs FOR SELECT USING (true);
CREATE POLICY "Allow all inserts for prototype" ON notification_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates for prototype" ON notification_logs FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes for prototype" ON notification_logs FOR DELETE USING (true);
