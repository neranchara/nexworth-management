
import fs from 'fs';
const path = 'd:/#QA/MyProject/Nexworth/backend/prisma/schema.prisma';
let content = fs.readFileSync(path, 'utf8');

// Remove from User model
content = content.replace(
  /model User \{[\s\S]*?isActive\s+Boolean\s+@default\(true\)\n\s+isPersonal\s+Boolean\s+@default\(true\)/,
  (match) => match.replace(/\n\s+isPersonal\s+Boolean\s+@default\(true\)/, '')
);

// Add to Account model
if (!content.includes('model Account {[\s\S]*?isPersonal')) {
  content = content.replace(
    /model Account \{([\s\S]*?)isActive\s+Boolean\s+@default\(true\)/,
    'model Account {$1isActive         Boolean           @default(true)\n  isPersonal       Boolean           @default(true)'
  );
}

fs.writeFileSync(path, content);
console.log("Fixed schema.");
