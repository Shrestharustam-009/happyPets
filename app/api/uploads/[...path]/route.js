import fs from "fs"
import path from "path"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request, { params }) {
  try {
    const { path: pathSegments } = await params

    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json({ error: "No file path provided" }, { status: 400 })
    }

    const filePath = pathSegments.join("/")

    // Check both possible upload directories:
    // 1. Root-level /uploads/ (where the VPS has existing files)
    // 2. /public/uploads/ (where file-upload.js writes new files)
    const rootUploadsDir = path.join(process.cwd(), "uploads")
    const publicUploadsDir = path.join(process.cwd(), "public", "uploads")

    let fullPath = path.join(rootUploadsDir, filePath)
    let resolvedBase = path.resolve(rootUploadsDir)

    // If not found in root /uploads/, try /public/uploads/
    if (!fs.existsSync(fullPath)) {
      fullPath = path.join(publicUploadsDir, filePath)
      resolvedBase = path.resolve(publicUploadsDir)
    }

    // Security: Ensure the resolved path stays within the intended directory
    const resolvedPath = path.resolve(fullPath)
    if (!resolvedPath.startsWith(resolvedBase)) {
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

export async function DELETE(request, { params }) {
  try {
    const { path: pathSegments } = await params

    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json({ error: "No file path provided" }, { status: 400 })
    }

    const filePath = pathSegments.join("/")

    // Check both directories, same logic as GET
    const rootUploadsDir = path.join(process.cwd(), "uploads")
    const publicUploadsDir = path.join(process.cwd(), "public", "uploads")

    let fullPath = path.join(rootUploadsDir, filePath)
    let resolvedBase = path.resolve(rootUploadsDir)

    if (!fs.existsSync(fullPath)) {
      fullPath = path.join(publicUploadsDir, filePath)
      resolvedBase = path.resolve(publicUploadsDir)
    }

    const resolvedPath = path.resolve(fullPath)
    if (!resolvedPath.startsWith(resolvedBase)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 })
    }

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    fs.unlinkSync(fullPath)

    return NextResponse.json({ message: "File deleted successfully" })
  } catch (error) {
    console.error("[Uploads API] Error deleting file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
