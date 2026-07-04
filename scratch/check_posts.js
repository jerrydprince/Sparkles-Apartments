const fs = require('fs');

const file = '../previous databases/sparkle7_wp_ovaru.sql';
const content = fs.readFileSync(file, 'utf8');
const insertRegex = /INSERT INTO `V9FFLZ7ap_posts`.*VALUES\s*([^;]+);/gs;
let match = insertRegex.exec(content);
if (match) {
    const valuesStr = match[1];
    // This is a naive split that might fail on strings with `),(`, but good enough for a quick check
    const rows = valuesStr.split(/\),\(/g);
    rows.forEach(r => {
        // extract post_type (usually the 21st column, let's just use a regex to find all words)
        // Actually, just find post_type in the string. Let's look for common booking post types:
        // 'mphb_booking', 'wc_booking', 'shop_order', 'babe_booking', 'guest'
        console.log(r.substring(0, 100)); // Print start of row to see
    });
}
