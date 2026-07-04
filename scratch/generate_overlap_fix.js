const fs = require('fs');
require('dotenv').config({ path: '../backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const genericRoomId = '74e73691-3bbb-4d11-8f77-5c93a4fe11fc'; // RM-010 Guest Rooms

const physicalRoomIds = [
    'a22c62f4-fa5b-4a76-8fbd-0a539ed8b02b', // RM-008
    'f6944664-40bb-49d4-b3bb-9ed2fa94ed70', // RM-012
    'b9545683-db26-48db-b141-9e5672032084', // RM-013
    'e5390eb2-d3bf-4a88-a68c-2b2e44d6cc50', // RM-014
    '2f345428-7f87-4732-9b9e-83d40aa2b8d1'  // RM-015
];

async function generateSQL() {
    let allBookings = [];
    let page = 0;
    while (true) {
        const { data, error } = await supabase
            .from('bookings')
            .select('id, check_in_date, check_out_date, status')
            .eq('room_id', genericRoomId)
            .order('check_in_date', { ascending: true })
            .range(page * 1000, (page + 1) * 1000 - 1);
            
        if (error) {
            console.error(error);
            return;
        }
        if (!data || data.length === 0) break;
        allBookings = allBookings.concat(data);
        page++;
    }

    console.log(`Found ${allBookings.length} overlapping bookings on RM-010.`);

    // Initialize schedule per physical room
    const schedule = {};
    physicalRoomIds.forEach(id => schedule[id] = []);

    let sql = `-- Migration Script: Resolve RM-010 Calendar Overlaps\n`;
    sql += `BEGIN;\n\n`;
    sql += `-- Drop triggers temporarily to allow UPDATE on historic overlapping rooms\n`;
    sql += `DROP TRIGGER IF EXISTS trigger_check_booking_overlap ON bookings;\n`;
    sql += `DROP TRIGGER IF EXISTS trigger_auto_invoice ON bookings;\n\n`;

    let unassigned = 0;
    let updates = 0;

    for (const b of allBookings) {
        if (b.status === 'cancelled') continue; // Skip checking overlaps for cancelled

        const start = new Date(b.check_in_date).getTime();
        const end = new Date(b.check_out_date).getTime();
        
        let assignedRoomId = null;

        for (const roomId of physicalRoomIds) {
            let hasOverlap = false;
            for (const existing of schedule[roomId]) {
                const eStart = new Date(existing.check_in_date).getTime();
                const eEnd = new Date(existing.check_out_date).getTime();
                
                // Overlap condition
                if (start < eEnd && end > eStart) {
                    hasOverlap = true;
                    break;
                }
            }
            if (!hasOverlap) {
                assignedRoomId = roomId;
                schedule[roomId].push(b);
                break;
            }
        }

        if (assignedRoomId) {
            sql += `UPDATE bookings SET room_id = '${assignedRoomId}' WHERE id = '${b.id}';\n`;
            updates++;
        } else {
            console.warn(`WARNING: Could not find any available physical guest room for booking ${b.id} (${b.check_in_date} to ${b.check_out_date})!`);
            unassigned++;
        }
    }

    // Now update all cancelled bookings to just dump them in RM-008
    for (const b of allBookings) {
        if (b.status === 'cancelled') {
            sql += `UPDATE bookings SET room_id = '${physicalRoomIds[0]}' WHERE id = '${b.id}';\n`;
            updates++;
        }
    }

    sql += `\nCREATE TRIGGER trigger_check_booking_overlap BEFORE INSERT OR UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION check_booking_overlap();\n`;
    sql += `CREATE TRIGGER trigger_auto_invoice AFTER INSERT ON bookings FOR EACH ROW EXECUTE FUNCTION auto_generate_invoice();\n\n`;
    sql += `COMMIT;\n`;

    fs.writeFileSync('../backend/import_8_fix_guest_room_overlaps.sql', sql);
    console.log(`Generated SQL to re-assign ${updates} bookings. ${unassigned} could not be fit.`);
}

generateSQL();
