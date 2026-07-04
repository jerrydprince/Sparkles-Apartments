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
    const insertRegex = /INSERT INTO `([^`]+)`\s*(?:\([^)]+\)\s*)?VALUES\s*([^;]+);/gs;
    let match;
    while ((match = insertRegex.exec(content)) !== null) {
      const tableName = match[1];
      const valuesStr = match[2];
      const rowCount = (valuesStr.match(/\),\(/g) || []).length + 1;
      tableCounts[tableName] = (tableCounts[tableName] || 0) + rowCount;
    }
    
    const sorted = Object.entries(tableCounts).sort((a, b) => b[1] - a[1]);
    sorted.slice(0, 30).forEach(([t, c]) => console.log(`  ${t}: ${c} rows`));
  } catch(e) {
    console.error(`Error processing ${file}: ${e.message}`);
  }
});
