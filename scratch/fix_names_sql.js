const fs = require('fs');
const data = require('./parsed_data.json');
require('dotenv').config({ path: '../backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function generateSQL() {
    console.log('Fetching ALL bookings from DB...');
    let dbBookings = [];
    const { data: b1, error: e1 } = await supabase.from('bookings').select('id, booking_reference, guest_id').range(0, 999);
    if (b1) dbBookings = dbBookings.concat(b1);
    const { data: b2, error: e2 } = await supabase.from('bookings').select('id, booking_reference, guest_id').range(1000, 1999);
    if (b2) dbBookings = dbBookings.concat(b2);

    const refToDbBooking = new Map();
    dbBookings.forEach(b => refToDbBooking.set(b.booking_reference, b));

    const emailToNames = new Map();
    data.forEach(b => {
        const email = b.mphb_email ? b.mphb_email.trim().toLowerCase() : `no-email-${b.id}@example.com`;
        const name = `${b.mphb_first_name || ''} ${b.mphb_last_name || ''}`.trim();
        if (!emailToNames.has(email)) emailToNames.set(email, new Set());
        if (name) emailToNames.get(email).add(name);
    });

    let sql = `-- Fix Guest Names Script\n`;
    sql += `BEGIN;\n\n`;

    let profileUpdates = 0;
    let bookingUpdates = 0;

    for (const b of data) {
        const ref = b.mphb_key ? b.mphb_key.substring(0, 20) : `MIG-${b.id}`;
        const dbBooking = refToDbBooking.get(ref);
        if (!dbBooking) continue;

        const email = b.mphb_email ? b.mphb_email.trim().toLowerCase() : `no-email-${b.id}@example.com`;
        let firstName = b.mphb_first_name || 'Guest';
        let lastName = b.mphb_last_name || 'User';
        
        // Escape quotes
        firstName = firstName.replace(/'/g, "''");
        lastName = lastName.replace(/'/g, "''");
        const fullName = `${firstName} ${lastName}`.trim();
        const safeEmail = email.replace(/'/g, "''");
        const phone = (b.mphb_phone || '').replace(/'/g, "''");

        const namesForEmail = emailToNames.get(email);
        const isSharedAdmin = namesForEmail.size > 1;

        if (isSharedAdmin) {
            sql += `UPDATE bookings SET guest_id = NULL, guest_name = '${fullName}', guest_email = '${safeEmail}', guest_phone = '${phone}' WHERE id = '${dbBooking.id}';\n`;
            bookingUpdates++;
        } else {
            if (dbBooking.guest_id) {
                sql += `UPDATE profiles SET first_name = '${firstName}', last_name = '${lastName}' WHERE id = '${dbBooking.guest_id}';\n`;
                profileUpdates++;
            }
        }
    }
    
    sql += `\nCOMMIT;\n`;
    fs.writeFileSync('../backend/import_6_fix_guest_names.sql', sql);
    console.log(`Generated SQL to update ${bookingUpdates} bookings and ${profileUpdates} profiles.`);
}

generateSQL();
