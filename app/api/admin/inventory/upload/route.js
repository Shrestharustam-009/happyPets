import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products")

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!file) {
      return NextResponse.json({ error: "No file received" }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`
    const filepath = path.join(UPLOAD_DIR, filename)

    fs.writeFileSync(filepath, Buffer.from(buffer))

    const photoUrl = `/uploads/products/${filename}`
    
    return NextResponse.json({ image_url: photoUrl }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error saving product image:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}
