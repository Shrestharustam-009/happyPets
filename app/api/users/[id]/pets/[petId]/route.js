import { query } from "@/lib/db"
import { normalizeAuthToken, getUserIdFromToken, isAdminToken } from "@/lib/token-utils"

export async function DELETE(req, { params }) {
  try {
    const { id, petId } = await params
    
    const token = normalizeAuthToken(req.headers.get("authorization"))
    const isAdmin = isAdminToken(token)
    const tokenUserId = getUserIdFromToken(token)

    if (!isAdmin && tokenUserId !== Number(id)) {
      return Response.json({ message: "Forbidden" }, { status: 403 })
    }

    // Verify the pet belongs to the user
    const [pet] = await query("SELECT id FROM pets WHERE id = ? AND user_id = ?", [petId, id])
    if (!pet) {
      return Response.json({ message: "Pet not found or unauthorized" }, { status: 404 })
    }

    await query("DELETE FROM pets WHERE id = ?", [petId])
    return Response.json({ message: "Pet deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting user pet:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
