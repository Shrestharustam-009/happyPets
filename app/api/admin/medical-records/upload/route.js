import { NextResponse } from "next/server"
import { validateAdminRequest } from "@/lib/auth-middleware"
import { saveMedicalRecordAttachment } from "@/lib/file-upload"

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!file) {
      return NextResponse.json({ error: "No file received" }, { status: 400 })
    }

    const fileUrl = await saveMedicalRecordAttachment(file)

    return NextResponse.json({ url: fileUrl }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error uploading medical record file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}

