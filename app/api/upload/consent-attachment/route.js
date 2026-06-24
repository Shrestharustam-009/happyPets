import { checkAdminAuth, verifyAdminToken } from "@/lib/auth-middleware"
import { saveConsentAttachment } from "@/lib/file-upload"

export async function POST(req) {
  try {
    const token = checkAdminAuth(req)
    if (!token) {
      return Response.json({ message: "Unauthorized - Token required" }, { status: 401 })
    }

    // Any logged in admin/vet/reception user can upload attachments
    const user = await verifyAdminToken(token)
    if (!user) {
      return Response.json({ message: "Unauthorized - Invalid token" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file")

    if (!file) {
      return Response.json({ message: "No file provided" }, { status: 400 })
    }

    // Accept PDF, and common image formats
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ message: "Invalid file type. Only PDF and images are allowed." }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ message: "File size too large. Maximum 10MB allowed." }, { status: 400 })
    }

    const filePath = await saveConsentAttachment(file)

    return Response.json({
      message: "Attachment uploaded successfully",
      file_path: filePath,
    })
  } catch (error) {
    console.error("[v0] Error uploading consent attachment:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
