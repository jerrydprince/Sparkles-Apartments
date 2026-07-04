const fs = require('fs');
const sql = fs.readFileSync('../previous databases/sparkle7_wp_ovaru.sql', 'utf8');

// Find the line that inserts into V9FFLZ7ap_posts
const lines = sql.split('\n');
const insertLines = lines.filter(l => l.startsWith('INSERT INTO `V9FFLZ7ap_posts` VALUES'));

const rooms = [];
const roomTypes = new Map();

insertLines.forEach(line => {
    // Each line is INSERT INTO `V9FFLZ7ap_posts` VALUES (...),(...),...
    // The columns are: ID, post_author, post_date, post_date_gmt, post_content, post_title, post_excerpt, post_status, comment_status, ping_status, post_password, post_name, to_ping, pinged, post_modified, post_modified_gmt, post_content_filtered, post_parent, guid, menu_order, post_type, post_mime_type, comment_count
    
    // Split by ),( 
    // This is tricky, a regex matching the tuple is better
    const tupleRegex = /\((\d+),\d+,'[^']*','[^']*','[^']*','([^']*)','[^']*','([^']*)','[^']*','[^']*','[^']*','[^']*','[^']*','[^']*','[^']*','[^']*','[^']*',(\d+),'[^']*',\d+,'([^']*)','[^']*',\d+\)/g;
    
    let m;
    while ((m = tupleRegex.exec(line)) !== null) {
        const id = m[1];
        const title = m[2];
        const status = m[3];
        const parent = m[4];
        const type = m[5];
        
        if (type === 'mphb_room_type') {
            roomTypes.set(id, title);
        } else if (type === 'mphb_room') {
            rooms.push({ id, title, status, parent });
        }
    }
});

console.log('Room Types:', roomTypes.size);
console.log('Rooms:', rooms.length);

rooms.forEach(r => {
    r.parent_name = roomTypes.get(r.parent);
    console.log(`- ${r.title} (Type: ${r.parent_name || r.parent}) - Status: ${r.status}`);
});
