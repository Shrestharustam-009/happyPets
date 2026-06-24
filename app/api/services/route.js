import { query } from "@/lib/db"
import { verifyAdminToken } from "@/lib/auth-middleware"


export async function GET(req) {
  try {
    const services = await query("SELECT * FROM services WHERE is_active = TRUE")
    return Response.json(services)
  } catch (error) {
    console.error("[v0] Error fetching services:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    const adminUser = await verifyAdminToken(token)
    if (!adminUser || adminUser.role !== "admin") {
      return Response.json({ message: "Unauthorized - Admin token required" }, { status: 401 })
    }

    const { name, description = null, price, duration_minutes = null } = await req.json()

    if (!name) {
      return Response.json({ message: "Service name is required" }, { status: 400 })
    }

    // Normalize optional fields so we never pass undefined into the query bindings
    const finalDescription = description === "" ? null : description
    const finalPrice = price === "" || price === undefined || price === null ? null : price
    const finalDuration =
      duration_minutes === "" || duration_minutes === undefined || duration_minutes === null
        ? null
        : duration_minutes

    const result = await query(
      `INSERT INTO services (name, description, price, duration_minutes, is_active)
       VALUES (?, ?, ?, ?, 1)`,
      [name, finalDescription, finalPrice, finalDuration],
    )

    return Response.json({
      message: "Service created successfully",
      service_id: result.insertId,
    })
  } catch (error) {
    console.error("[v0] Error creating service:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
