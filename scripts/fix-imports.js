const fs = require('fs');
const path = require('path');

function fixFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixFiles(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      if (content.includes('import { fetchWithAuth }')) {
        // remove all occurrences
        content = content.replace(/import \{ fetchWithAuth \} from .@\/lib\/api.\r?\n/g, '');
        // add one at the very top (after use client if it exists)
        if (content.includes('"use client"')) {
           content = content.replace(/"use client";?\r?\n/, '"use client"\nimport { fetchWithAuth } from "@/lib/api"\n');
        } else if (content.includes("'use client'")) {
           content = content.replace(/'use client';?\r?\n/, "'use client'\nimport { fetchWithAuth } from \"@/lib/api\"\n");
        } else {
           content = 'import { fetchWithAuth } from "@/lib/api"\n' + content;
        }
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

fixFiles(path.join(__dirname, '..', 'components'));
fixFiles(path.join(__dirname, '..', 'app'));
console.log('Done fixing imports.');
