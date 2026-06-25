import fs from "fs"
import path from "path"
import { NextResponse } from "next/server"

export async function GET(request, { params }) {
  try {
    const { path: pathSegments } = await params
    
    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json({ error: "No file path provided" }, { status: 400 })
    }

    const filePath = pathSegments.join("/")
    
    // Construct the full file path in the public/uploads directory
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    const fullPath = path.join(uploadsDir, filePath)
    
    // Security: Ensure the file is within the uploads directory
    const resolvedPath = path.resolve(fullPath)
    const resolvedUploadsDir = path.resolve(uploadsDir)
    
    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 })
    }

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const stats = fs.statSync(fullPath)
    if (!stats.isFile()) {
      return NextResponse.json({ error: "Not a file" }, { status: 400 })
    }

    const fileBuffer = fs.readFileSync(fullPath)

    const ext = path.extname(fullPath).toLowerCase()
    let contentType = "application/octet-stream"
    
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg"
    else if (ext === ".png") contentType = "image/png"
    else if (ext === ".gif") contentType = "image/gif"
    else if (ext === ".webp") contentType = "image/webp"
    else if (ext === ".svg") contentType = "image/svg+xml"
    else if (ext === ".pdf") contentType = "application/pdf"

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("[Uploads API] Error serving file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
