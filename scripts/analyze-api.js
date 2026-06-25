const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '..', 'app', 'api');
const results = [];

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (file === 'route.js') {
      analyzeFile(fullPath);
    }
  }
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(apiDir, filePath).replace(/\\/g, '/').replace('/route.js', '');
  const endpoint = `/api/${relativePath}`;
  
  const methods = [];
  if (content.match(/export (async )?function GET/)) methods.push('GET');
  if (content.match(/export (async )?function POST/)) methods.push('POST');
  if (content.match(/export (async )?function PUT/)) methods.push('PUT');
  if (content.match(/export (async )?function DELETE/)) methods.push('DELETE');
  
  const requiresAuth = content.includes('validateAdminRequest') || content.includes('checkAuth') || content.includes('verifyToken');
  
  const tableRegex = /FROM\s+([a-zA-Z0-9_]+)|INTO\s+([a-zA-Z0-9_]+)|UPDATE\s+([a-zA-Z0-9_]+)/g;
  const tables = new Set();
  let match;
  while ((match = tableRegex.exec(content)) !== null) {
    if (match[1]) tables.add(match[1]);
    if (match[2]) tables.add(match[2]);
    if (match[3]) tables.add(match[3]);
  }

  // Risky patterns
  const risks = [];
  
  // 1. request.json() without try/catch
  const reqJsonMatches = content.match(/await\s+req(uest)?\.json\(\)/g) || [];
  const tryCatchMatches = content.match(/catch\s*\(/g) || [];
  // If there are req.json() calls but fewer catch blocks, or just loosely checking if there's any req.json() without a try catch nearby
  // Let's do a loose check: if it has req.json() but doesn't have a specific body parse error catch, it might be risky
  if (content.includes('await request.json()') && !content.includes('catch (err) {') && !content.includes('catch (parseError) {') && !content.includes('Invalid JSON')) {
    risks.push("req.json() could crash (Missing safe parse)");
  }
  
  // 2. Missing auth on a clearly sensitive route
  if (endpoint.startsWith('/api/admin') && !requiresAuth && endpoint !== '/api/admin/login') {
    risks.push("Admin route missing auth validation");
  }

  // 3. SQL Injection risk? Using raw template literals in query instead of ?
  if (content.match(/query\(\s*[`"].*\$\{.*\}.*[`"]/)) {
    risks.push("Potential SQL Injection (Template literal in query)");
  }
  
  results.push({
    endpoint,
    methods: methods.join(', '),
    requiresAuth: requiresAuth ? 'Yes' : 'No',
    tables: Array.from(tables).join(', '),
    risks
  });
}

scanDir(apiDir);
console.log(JSON.stringify(results, null, 2));
