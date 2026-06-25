const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // We are looking for something like:
  // const body = await request.json()
  // or
  // const body = await req.json()
  // And we want to replace it with:
  // let body; try { body = await request.json(); } catch(e) { return NextResponse.json({error: "Invalid JSON"}, {status: 400}); }
  
  const regex = /const ([a-zA-Z0-9_]+) = await (req|request)\.json\(\)/g;
  
  if (regex.test(content)) {
    content = content.replace(regex, (match, varName, reqVar) => {
      // If the file already has a catch for JSON, skip
      return `let ${varName};
    try {
      ${varName} = await ${reqVar}.json();
    } catch (err) {
      return (typeof NextResponse !== 'undefined' ? NextResponse : Response).json({ error: "Invalid JSON payload" }, { status: 400 });
    }`;
    });
    
    // Some routes use Response.json, some use NextResponse.json. The replacement uses a safe check.
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated JSON parsing in ${filePath}`);
    }
  }
}

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.ts')) {
      if (!fullPath.includes('clients\\\\route.js') && !fullPath.includes('clients/route.js')) {
          processFile(fullPath);
      }
    }
  }
}

scanDir(path.join(__dirname, '..', 'app', 'api', 'admin'));
