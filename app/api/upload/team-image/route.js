import { checkAdminAuth, verifyAdminToken } from "@/lib/auth-middleware"
import { saveTeamImage } from "@/lib/file-upload"

export async function POST(req) {
  try {
    const token = checkAdminAuth(req)
    if (!token) {
      return Response.json({ message: "Unauthorized - Admin token required" }, { status: 401 })
    }

    const admin = await verifyAdminToken(token)
    if (!admin) {
      return Response.json({ message: "Unauthorized - Invalid admin token" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file")

    if (!file) {
      return Response.json({ message: "No file provided" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return Response.json({ message: "Invalid file type. Only images are allowed." }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ message: "File size too large. Maximum 5MB allowed." }, { status: 400 })
    }

    const imagePath = await saveTeamImage(file)

    return Response.json({
      message: "Image uploaded successfully",
      image_path: imagePath,
    })
  } catch (error) {
    console.error("[v0] Error uploading team image:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
