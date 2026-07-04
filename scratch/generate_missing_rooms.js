const fs = require('fs');
const crypto = require('crypto');

const missingRooms = [
    { name: '003 – Guest Room (First Floor)', price: 25000 },
    { name: '004 – Guest Room (First Floor)', price: 25000 },
    { name: '005 – Guest Room (Second Floor)', price: 25000 },
    { name: '006 – Guest Room (Second Floor)', price: 25000 },
    { name: 'Sample Apartment 1', price: 0 },
    { name: 'Lounge 1', price: 50000 }
];

let sql = `-- Migration Script: Insert Missing Physical Rooms\n`;
sql += `BEGIN;\n\n`;

let roomNum = 12;

for (const room of missingRooms) {
    const id = crypto.randomUUID();
    const roomNumber = `RM-${roomNum.toString().padStart(3, '0')}`;
    
    // Default config matching existing rooms
    sql += `INSERT INTO rooms (
        id, room_number, name, type, capacity, base_price_ngn, status, 
        bed_type, max_occupancy, min_stay_days, max_stay_days,
        allowed_check_in_days, allowed_check_out_days, pricing_model, base_guests
    ) VALUES (
        '${id}', '${roomNumber}', '${room.name}', 'Apartment', 2, ${room.price}, 'available',
        'King', 2, 1, 30,
        '{0,1,2,3,4,5,6}', '{0,1,2,3,4,5,6}', 'per_night', 2
    );\n`;
    
    roomNum++;
}

sql += `\nCOMMIT;\n`;

fs.writeFileSync('../backend/import_7_missing_rooms.sql', sql);
console.log('Successfully generated import_7_missing_rooms.sql');
