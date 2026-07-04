const fs = require('fs');
const sql = fs.readFileSync('../previous databases/sparkle7_wp_ovaru.sql', 'utf8');

const lines = sql.split('\n').filter(l => l.includes('INSERT INTO `V9FFLZ7ap_posts`') && l.includes('VALUES'));

const roomTypes = new Map();
const rooms = [];

for (const line of lines) {
    let i = 0;
    while(i < line.length) {
        if (line[i] === '(' && (i === 0 || line[i-1] === ',' || line.substring(i-7, i) === 'VALUES ')) {
            let j = i + 1;
            let inString = false;
            let escape = false;
            let values = [];
            let currentVal = '';
            
            while(j < line.length) {
                const c = line[j];
                if (escape) {
                    currentVal += c;
                    escape = false;
                } else if (c === '\\') {
                    escape = true;
                } else if (c === "'") {
                    if (inString && line[j+1] === "'") {
                        currentVal += "'";
                        j++;
                    } else {
                        inString = !inString;
                    }
                } else if (c === ',' && !inString) {
                    values.push(currentVal);
                    currentVal = '';
                } else if (c === ')' && !inString) {
                    values.push(currentVal);
                    break;
                } else {
                    currentVal += c;
                }
                j++;
            }
            
            if (values.length >= 21) {
                const id = values[0];
                const title = values[5];
                const status = values[7];
                const parent = values[17];
                const type = values[20];
                
                if (type === 'mphb_room_type') {
                    roomTypes.set(id, title);
                } else if (type === 'mphb_room') {
                    rooms.push({ id, title, status, parent });
                }
            }
            i = j;
        }
        i++;
    }
}

console.log('Room Types Found:', roomTypes.size);
console.log('Physical Rooms Found:', rooms.length);

const groupedRooms = {};

rooms.forEach(r => {
    const parentName = roomTypes.get(r.parent) || 'Unknown';
    if (!groupedRooms[parentName]) groupedRooms[parentName] = [];
    groupedRooms[parentName].push(r.title);
});

console.log(JSON.stringify(groupedRooms, null, 2));

