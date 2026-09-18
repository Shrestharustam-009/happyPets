const fs = require('fs');
const files = [
  'app/api/admin/patients/route.js',
  'app/api/admin/clients/route.js',
  'app/api/users/route.js'
];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('return NextResponse.json(')) {
    content = content.replace(/return NextResponse\.json\(([^,]+)\)/g, 'return NextResponse.json(, { headers: { "Cache-Control": "public, max-age=300" } })');
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
}
