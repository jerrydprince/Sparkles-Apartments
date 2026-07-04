const fs = require('fs');
const content = fs.readFileSync('../previous databases/sparkle7_wp_ovaru.sql', 'utf8');

const regex = /\(\d+,\s*(5404|6366),\s*'([^']*)',\s*'([^']*)'\)/g;
let match;
while ((match = regex.exec(content)) !== null) {
    console.log(`Post ${match[1]}: ${match[2]} = ${match[3]}`);
}
