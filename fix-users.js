const fs = require('fs');
let content = fs.readFileSync('app/api/users/route.js', 'utf8');
content = content.replace('return Response.json(users)', 'return Response.json(users, { headers: { "Cache-Control": "public, max-age=300" } })');
fs.writeFileSync('app/api/users/route.js', content);
