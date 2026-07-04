const fs = require('fs');

const file = '../previous databases/sparkle7_wp_ovaru.sql';
const content = fs.readFileSync(file, 'utf8');

console.log('Extracting bookings...');
// Find all booking post IDs
const bookingIds = new Set();
// We look for 'mphb_booking'
const postRegex = /\((\d+),\s*\d+,\s*'[^']*',\s*'[^']*',\s*'(?:[^'\\]|\\.)*',\s*'(?:[^'\\]|\\.)*',\s*'(?:[^'\\]|\\.)*',\s*'([^']*)',\s*'(?:[^'\\]|\\.)*',\s*'(?:[^'\\]|\\.)*',\s*'(?:[^'\\]|\\.)*',\s*'(?:[^'\\]|\\.)*',\s*'(?:[^'\\]|\\.)*',\s*'(?:[^'\\]|\\.)*',\s*'[^']*',\s*'[^']*',\s*'(?:[^'\\]|\\.)*',\s*\d+,\s*'(?:[^'\\]|\\.)*',\s*\d+,\s*'mphb_booking'/g;

let match;
let count = 0;
while ((match = postRegex.exec(content)) !== null) {
    const postId = match[1];
    const postStatus = match[2];
    bookingIds.add(postId);
    count++;
}
console.log(`Found ${count} bookings.`);

console.log('Extracting postmeta...');
const metaRegex = /\((\d+),\s*(\d+),\s*'([^']*)',\s*'((?:[^'\\]|\\.)*)'\)/g;

const bookingsData = {};
bookingIds.forEach(id => {
    bookingsData[id] = { id };
});

let metaCount = 0;
while ((match = metaRegex.exec(content)) !== null) {
    const postId = match[2];
    if (bookingIds.has(postId)) {
        const key = match[3];
        const value = match[4];
        bookingsData[postId][key] = value.replace(/\\'/g, "'").replace(/\\\\/g, "\\");
        metaCount++;
    }
}
console.log(`Extracted ${metaCount} relevant meta rows.`);

fs.writeFileSync('parsed_data.json', JSON.stringify(Object.values(bookingsData), null, 2));
console.log('Saved to parsed_data.json');
