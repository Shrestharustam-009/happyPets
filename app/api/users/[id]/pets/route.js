import { query } from "@/lib/db"

export async function GET(req, { params }) {
  try {
    const { id } = await params

    const pets = await query(
      "SELECT id, user_id, name, species, species as type, breed, age, color, weight, medical_history as description FROM pets WHERE user_id = ?",
      [id]
    )
    return Response.json(pets)
  } catch (error) {
    console.error("[v0] Error fetching pets:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req, { params }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, type, species, breed, age, color, weight, description } = body

    const finalSpecies = species || type || "other"
    const finalDescription = description || ""

    const result = await query(
      "INSERT INTO pets (user_id, name, species, breed, age, color, weight, medical_history) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id, name, finalSpecies, breed || null, age || null, color || null, weight || null, finalDescription],
    )

    // Fetch the newly created pet and return it with full schema fields
    const [newPet] = await query(
      "SELECT id, user_id, name, species, species as type, breed, age, color, weight, medical_history as description FROM pets WHERE id = ?",
      [result.insertId]
    )

    return Response.json(newPet)
  } catch (error) {
    console.error("[v0] Error adding pet:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
