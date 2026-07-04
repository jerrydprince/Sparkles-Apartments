const fs = require('fs');
const crypto = require('crypto');

const data = require('./parsed_data.json');

const guests = new Map(); // email -> guest details
const rooms = new Map(); // room_name -> base_price

data.forEach(booking => {
    // Collect guest
    const email = booking.mphb_email ? booking.mphb_email.trim().toLowerCase() : `no-email-${booking.id}@example.com`;
    if (!guests.has(email)) {
        guests.set(email, {
            email: email,
            first_name: booking.mphb_first_name || 'Unknown',
            last_name: booking.mphb_last_name || 'Unknown',
            phone: booking.mphb_phone || '',
            id: crypto.randomUUID()
        });
    }

    // Collect room
    if (booking._mphb_booking_price_breakdown) {
        try {
            const breakdown = JSON.parse(booking._mphb_booking_price_breakdown.replace(/\\"/g, '"'));
            if (breakdown.rooms && breakdown.rooms.length > 0) {
                const roomData = breakdown.rooms[0].room;
                const roomType = roomData.type;
                if (roomType && !rooms.has(roomType)) {
                    let rate = 0;
                    if (roomData.list) {
                        const values = Object.values(roomData.list);
                        if (values.length > 0) rate = values[0];
                    }
                    if (rate === 0) rate = booking.mphb_total_price;
                    
                    rooms.set(roomType, {
                        id: crypto.randomUUID(),
                        name: roomType,
                        base_price: rate || 0
                    });
                }
            }
        } catch (e) { }
    }
});

// FILE 1: USERS AND PROFILES
let sql1 = `-- 1. Clear existing data\n`;
sql1 += `DELETE FROM bookings;\n`;
sql1 += `DELETE FROM rooms;\n`;
sql1 += `DELETE FROM profiles WHERE role != 'super_admin';\n`;
sql1 += `DELETE FROM auth.users WHERE id NOT IN (SELECT id FROM profiles WHERE role = 'super_admin');\n\n`;
sql1 += `-- 2. Insert Guests\n`;
guests.forEach(guest => {
    const encrypted_password = '$argon2id$v=19$m=65536,t=3,p=4$fQ7fF7Zl6j7Q7fF7Zl6j7A$fQ7fF7Zl6j7Q7fF7Zl6j7A'; 
    sql1 += `INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) VALUES ('${guest.id}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '${guest.email.replace(/'/g, "''")}', '${encrypted_password}', now(), now(), now()) ON CONFLICT (id) DO NOTHING;\n`;
    sql1 += `INSERT INTO profiles (id, first_name, last_name, phone, role) VALUES ('${guest.id}', '${guest.first_name.replace(/'/g, "''")}', '${guest.last_name.replace(/'/g, "''")}', '${guest.phone.replace(/'/g, "''")}', 'guest') ON CONFLICT (id) DO NOTHING;\n`;
});
fs.writeFileSync('../backend/import_1_users.sql', sql1);

// FILE 2: ROOMS
let sql2 = `-- 3. Insert Rooms\n`;
let roomNumberCounter = 1;
rooms.forEach(room => {
    const roomNumber = `RM-${String(roomNumberCounter++).padStart(3, '0')}`;
    sql2 += `INSERT INTO rooms (id, room_number, name, type, capacity, base_price_ngn, status) VALUES ('${room.id}', '${roomNumber}', '${room.name.replace(/'/g, "''")}', 'Apartment', 2, ${room.base_price}, 'available') ON CONFLICT (room_number) DO NOTHING;\n`;
});
fs.writeFileSync('../backend/import_2_rooms.sql', sql2);

// FILE 3: BOOKINGS
let sql3 = `-- 4. Insert Bookings\n`;
data.forEach(booking => {
    const email = booking.mphb_email ? booking.mphb_email.trim().toLowerCase() : `no-email-${booking.id}@example.com`;
    const guestId = guests.get(email).id;
    let roomId = null;
    if (booking._mphb_booking_price_breakdown) {
        try {
            const breakdown = JSON.parse(booking._mphb_booking_price_breakdown.replace(/\\"/g, '"'));
            if (breakdown.rooms && breakdown.rooms.length > 0) {
                const roomType = breakdown.rooms[0].room.type;
                if (roomType && rooms.has(roomType)) roomId = rooms.get(roomType).id;
            }
        } catch (e) { }
    }
    if (!roomId) {
        const firstRoom = Array.from(rooms.values())[0];
        if (firstRoom) roomId = firstRoom.id;
    }
    const checkIn = booking.mphb_check_in_date || '2024-01-01';
    const checkOut = booking.mphb_check_out_date || '2024-01-02';
    const amount = booking.mphb_total_price || 0;
    const ref = booking.mphb_key ? booking.mphb_key.substring(0, 20) : `MIG-${booking.id}`;
    
    if (roomId) {
        sql3 += `INSERT INTO bookings (booking_reference, guest_id, room_id, check_in_date, check_out_date, total_room_price_ngn, total_amount_ngn, status, payment_status, amount_paid_ngn) VALUES ('${ref}', '${guestId}', '${roomId}', '${checkIn}', '${checkOut}', ${amount}, ${amount}, 'confirmed', 'paid', ${amount}) ON CONFLICT (booking_reference) DO NOTHING;\n`;
    }
});
fs.writeFileSync('../backend/import_3_bookings.sql', sql3);

console.log('SQL Migration generated in 3 parts!');
