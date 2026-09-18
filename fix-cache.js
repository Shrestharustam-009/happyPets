const fs = require('fs');
const files = fs.readdirSync('components/admin-tabs').filter(f => f.endsWith('.jsx'));
for (const file of files) {
  let content = fs.readFileSync('components/admin-tabs/' + file, 'utf8');
  if (content.includes('{ cache: "no-store" }')) {
    content = content.replace(/, \{ cache: "no-store" \}/g, '');
    fs.writeFileSync('components/admin-tabs/' + file, content);
    console.log('Fixed', file);
  }
}
