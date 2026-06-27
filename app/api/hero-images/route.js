import fs from "fs"
import path from "path"
import { checkAdminAuth, verifyAdminToken } from "@/lib/auth-middleware"
import { deleteHeroImage } from "@/lib/file-upload"

export const dynamic = 'force-dynamic'

const HERO_UPLOAD_DIR = path.join(process.cwd(), "uploads", "hero")

export async function GET() {
  try {
    if (!fs.existsSync(HERO_UPLOAD_DIR)) {
      return Response.json([])
    }

    const files = fs.readdirSync(HERO_UPLOAD_DIR).filter((file) => !file.startsWith("."))

    const images = files.map((filename) => ({
      filename,
      url: `/api/uploads/hero/${filename}`,
    }))

    return Response.json(images)
  } catch (error) {
    console.error("[v0] Error listing hero images:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const token = checkAdminAuth(req)
    if (!token) {
      return Response.json({ message: "Unauthorized - Admin token required" }, { status: 401 })
    }

    const admin = await verifyAdminToken(token)
    if (!admin) {
      return Response.json({ message: "Unauthorized - Invalid admin token" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const filename = searchParams.get("filename")

    if (!filename) {
      return Response.json({ message: "Filename is required" }, { status: 400 })
    }

    const imagePath = `/api/uploads/hero/${filename}`
    deleteHeroImage(imagePath)

    return Response.json({ message: "Hero image deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting hero image:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}


