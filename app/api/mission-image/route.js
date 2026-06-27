import fs from "fs"
import path from "path"
import { checkAdminAuth, verifyAdminToken } from "@/lib/auth-middleware"
import { saveMissionImage, deleteMissionImage } from "@/lib/file-upload"

export const dynamic = 'force-dynamic'

const MISSION_UPLOAD_DIR = path.join(process.cwd(), "uploads", "mission")

// Make sure upload dir exists
if (!fs.existsSync(MISSION_UPLOAD_DIR)) {
  fs.mkdirSync(MISSION_UPLOAD_DIR, { recursive: true })
}

export async function GET() {
  try {
    if (!fs.existsSync(MISSION_UPLOAD_DIR)) {
      return Response.json([])
    }
    const files = fs.readdirSync(MISSION_UPLOAD_DIR).filter(f => !f.startsWith("."));
    const images = files.map(filename => ({ filename, url: `/api/uploads/mission/${filename}` }))
    return Response.json(images)
  } catch (err) {
    return Response.json({ message: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const token = checkAdminAuth(req)
    if (!token) return Response.json({ message: "Unauthorized - Admin token required" }, { status: 401 })
    const admin = await verifyAdminToken(token)
    if (!admin) return Response.json({ message: "Unauthorized - Invalid admin token" }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get("file")
    if (!file) return Response.json({ message: "No file provided" }, { status: 400 })
    if (!file.type.startsWith("image/")) return Response.json({ message: "Invalid file type. Only images allowed." }, { status: 400 })
    if (file.size > 5 * 1024 * 1024) return Response.json({ message: "File size too large. Max 5MB allowed." }, { status: 400 })

    const publicUrl = await saveMissionImage(file)
    return Response.json({ message: "Mission image uploaded successfully", image: publicUrl })
  } catch (err) {
    return Response.json({ message: err.message }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const token = checkAdminAuth(req)
    if (!token) return Response.json({ message: "Unauthorized - Admin token required" }, { status: 401 })
    const admin = await verifyAdminToken(token)
    if (!admin) return Response.json({ message: "Unauthorized - Invalid admin token" }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const filename = searchParams.get("filename")
    if (!filename) return Response.json({ message: "Filename is required" }, { status: 400 })
    const imagePath = `/api/uploads/mission/${filename}`
    deleteMissionImage(imagePath)
    return Response.json({ message: "Mission image deleted successfully" })
  } catch (err) {
    return Response.json({ message: err.message }, { status: 500 })
  }
}
