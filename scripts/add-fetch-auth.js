const fs = require('fs');
const path = require('path');

const dirsToScan = [
  path.join(__dirname, '..', 'components'),
  path.join(__dirname, '..', 'app')
];

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Exclude lib/api.js and api routes
  if (filePath.includes('lib\\api.js') || filePath.includes('lib/api.js') || filePath.includes('app\\api') || filePath.includes('app/api')) return;
  if (filePath.includes('admin-login-form.jsx') || filePath.includes('auth-form-login.jsx')) return; // login forms handle their own auth or don't need token yet
  
  // Replace fetch("/api/...") with fetchWithAuth("/api/...")
  // Also covers fetch(`/api/...`)
  const regex = /\bfetch\s*\(\s*(["'`])\/api\//g;
  
  if (regex.test(content)) {
    let newContent = content.replace(regex, 'fetchWithAuth($1/api/');
    
    // Add import if not present
    if (!newContent.includes('fetchWithAuth')) {
        // Just in case
    } else if (!newContent.includes('import { fetchWithAuth }')) {
      const importStmt = 'import { fetchWithAuth } from "@/lib/api"\n';
      // Add after the last import, or after "use client"
      const lines = newContent.split('\n');
      let insertIdx = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ') || lines[i].includes('"use client"')) {
          insertIdx = i + 1;
        }
      }
      lines.splice(insertIdx, 0, importStmt);
      newContent = lines.join('\n');
    }
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent);
      console.log(`Updated ${filePath}`);
    }
  }
}

for (const dir of dirsToScan) {
  if (fs.existsSync(dir)) scanDir(dir);
}
