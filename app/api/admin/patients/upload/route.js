import { NextResponse } from "next/server"
import { savePatientPhoto } from "@/lib/file-upload"

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!file) {
      return NextResponse.json({ error: "No file received" }, { status: 400 })
    }

    const photoUrl = await savePatientPhoto(file)
    
    return NextResponse.json({ photo_url: photoUrl }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error saving patient image:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}

