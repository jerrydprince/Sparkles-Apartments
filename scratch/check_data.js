const fs = require('fs');

const fileNames = [
  '../previous databases/sparkle7_wp4690.sql',
  '../previous databases/sparkle7_wp7890.sql',
  '../previous databases/sparkle7_wp_ovaru.sql'
];

fileNames.forEach(file => {
  console.log(`\nAnalyzing ${file}...`);
  try {
    const content = fs.readFileSync(file, 'utf8');
    const tableCounts = {};
    const tableSizes = {};
    
    // Find all table schemas
    const tables = [...content.matchAll(/CREATE TABLE `([^`]+)`/g)].map(m => m[1]);
    
    tables.forEach(tableName => {
      // Find inserts for this table specifically
      const insertRegex = new RegExp(`INSERT INTO \`${tableName}\`[\\s\\S]*?VALUES\\s*(.*?);`, 'gs');
      let match;
      let count = 0;
      let size = 0;
      while ((match = insertRegex.exec(content)) !== null) {
        const valuesStr = match[1];
        count += (valuesStr.match(/\),\(/g) || []).length + 1;
        size += valuesStr.length;
      }
      if (count > 0) {
        tableCounts[tableName] = count;
        tableSizes[tableName] = size;
      }
    });
    
    const sorted = Object.entries(tableCounts).sort((a, b) => b[1] - a[1]);
    console.log(`Top tables by row count:`);
    sorted.slice(0, 10).forEach(([t, c]) => console.log(`  ${t}: ${c} rows (${Math.round(tableSizes[t]/1024)} KB)`));
    
  } catch(e) {
    console.error(`Error processing ${file}: ${e.message}`);
  }
});
