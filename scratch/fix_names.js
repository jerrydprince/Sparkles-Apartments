require('dotenv').config({ path: '../backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY);
const data = require('./parsed_data.json');

async function fix() {
    console.log('Fetching ALL bookings from DB...');
    let dbBookings = [];
    // Just fetch twice, 1000 each time since we only have 1173
    const { data: b1, error: e1 } = await supabase.from('bookings').select('id, booking_reference, guest_id').range(0, 999);
    if (e1) { console.error(e1); return; }
    dbBookings = dbBookings.concat(b1);
    
    const { data: b2, error: e2 } = await supabase.from('bookings').select('id, booking_reference, guest_id').range(1000, 1999);
    if (e2) { console.error(e2); return; }
    dbBookings = dbBookings.concat(b2);
    
    console.log(`Fetched ${dbBookings.length} bookings from DB.`);

    const refToDbBooking = new Map();
    dbBookings.forEach(b => refToDbBooking.set(b.booking_reference, b));

    const emailToNames = new Map();
    data.forEach(b => {
        const email = b.mphb_email ? b.mphb_email.trim().toLowerCase() : `no-email-${b.id}@example.com`;
        const name = `${b.mphb_first_name || ''} ${b.mphb_last_name || ''}`.trim();
        if (!emailToNames.has(email)) emailToNames.set(email, new Set());
        if (name) emailToNames.get(email).add(name);
    });

    let profileUpdates = 0;
    let bookingUpdates = 0;

    for (const b of data) {
        const ref = b.mphb_key ? b.mphb_key.substring(0, 20) : `MIG-${b.id}`;
        const dbBooking = refToDbBooking.get(ref);
        if (!dbBooking) continue;

        const email = b.mphb_email ? b.mphb_email.trim().toLowerCase() : `no-email-${b.id}@example.com`;
        const firstName = b.mphb_first_name || 'Guest';
        const lastName = b.mphb_last_name || 'User';
        const fullName = `${firstName} ${lastName}`.trim();

        const namesForEmail = emailToNames.get(email);
        const isSharedAdmin = namesForEmail.size > 1;

        if (isSharedAdmin) {
            await supabase.from('bookings').update({
                guest_id: null,
                guest_name: fullName,
                guest_email: email,
                guest_phone: b.mphb_phone || ''
            }).eq('id', dbBooking.id);
            bookingUpdates++;
            if (bookingUpdates % 20 === 0) console.log(`Fixed ${bookingUpdates} shared-email bookings...`);
        } else {
            if (dbBooking.guest_id) {
                await supabase.from('profiles').update({
                    first_name: firstName,
                    last_name: lastName
                }).eq('id', dbBooking.guest_id);
                profileUpdates++;
                if (profileUpdates % 100 === 0) console.log(`Fixed ${profileUpdates} unique profiles...`);
            }
        }
    }
    
    console.log(`Done! Updated ${bookingUpdates} bookings to Walk-in, and fixed ${profileUpdates} user profiles.`);
}

fix();
