const fs = require('fs');
const path = require('path');

const filesToFix = [
  path.join(__dirname, '..', 'app', 'api', 'admin', 'inventory', 'upload', 'route.js'),
  path.join(__dirname, '..', 'app', 'api', 'admin', 'medical-records', 'upload', 'route.js'),
  path.join(__dirname, '..', 'app', 'api', 'admin', 'patients', 'upload', 'route.js')
];

for (const file of filesToFix) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    
    if (!content.includes('validateAdminRequest')) {
      content = content.replace(
        'import { NextResponse } from "next/server"', 
        'import { NextResponse } from "next/server"\nimport { validateAdminRequest } from "@/lib/auth-middleware"'
      );
      
      content = content.replace(
        'export async function POST(request) {\n  try {',
        'export async function POST(request) {\n  try {\n    if (!(await validateAdminRequest(request))) {\n      return NextResponse.json({ error: "Forbidden" }, { status: 403 })\n    }'
      );
      
      fs.writeFileSync(file, content);
      console.log('Fixed', file);
    }
  }
}
