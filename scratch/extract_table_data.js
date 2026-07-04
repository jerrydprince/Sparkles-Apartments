const fs = require('fs');
const content = fs.readFileSync('../previous databases/sparkle7_wp_ovaru.sql', 'utf8');

const tablesToCheck = ['V9FFLZ7ap_mphb_customers', 'V9FFLZ7ap_users', 'V9FFLZ7ap_posts', 'V9FFLZ7ap_mphb_customers_meta'];

tablesToCheck.forEach(table => {
    const insertRegex = new RegExp(`INSERT INTO \`${table}\`[\\s\\S]*?VALUES\\s*(.*?);`, 'g');
    let match;
    let found = false;
    while ((match = insertRegex.exec(content)) !== null) {
        console.log(`\n--- Data for ${table} ---`);
        const values = match[1];
        console.log(values.substring(0, 1000) + (values.length > 1000 ? '...\n[TRUNCATED]' : ''));
        found = true;
    }
    if (!found) console.log(`\n--- No inserts found for ${table} ---`);
});
