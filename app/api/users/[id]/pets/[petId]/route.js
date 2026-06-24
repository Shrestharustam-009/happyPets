import { query } from "@/lib/db"

export async function DELETE(req, { params }) {
  try {
    const { id, petId } = await params

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
