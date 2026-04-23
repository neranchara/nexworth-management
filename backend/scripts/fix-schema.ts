
import fs from 'fs';
const path = 'd:/#QA/MyProject/Nexworth/backend/prisma/schema.prisma';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('isPersonal')) {
  content = content.replace(
    /isActive\s+Boolean\s+@default\(true\)/,
    'isActive         Boolean           @default(true)\n  isPersonal       Boolean           @default(true)'
  );
  fs.writeFileSync(path, content);
  console.log("Schema updated.");
} else {
  console.log("Already has isPersonal.");
}
