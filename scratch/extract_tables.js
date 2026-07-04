const fs = require('fs');
const content = fs.readFileSync('../previous databases/sparkle7_wp4690.sql', 'utf8');
const tables = [...content.matchAll(/CREATE TABLE `([^`]+)`/g)].map(m => m[1]);
console.log(tables);
