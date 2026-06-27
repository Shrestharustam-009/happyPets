import { query } from "@/lib/db"
import { getUserIdFromToken, normalizeAuthToken, isAdminToken } from "@/lib/token-utils"

export async function GET(req) {
  try {
    const token = normalizeAuthToken(req.headers.get("authorization"))
    const isAdmin = isAdminToken(token)
    const tokenUserId = getUserIdFromToken(token)

    if (!isAdmin && !tokenUserId) {
      return Response.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    // Only admins can specify a custom user_id filter. Regular users are forced to use their own token ID.
    const userId = isAdmin ? searchParams.get("user_id") : tokenUserId
    const status = searchParams.get("status")

    let sql = `SELECT a.id, a.user_id, a.pet_id, a.service_id, a.appointment_date, 
                      a.status, a.problem_description, a.notes,
                      u.full_name as userFullName, p.name as petName, s.name as serviceName
               FROM appointments a
               LEFT JOIN users u ON a.user_id = u.id
               LEFT JOIN pets p ON a.pet_id = p.id
               LEFT JOIN services s ON a.service_id = s.id`
    
    const filters = []
    const params = []

    if (userId) {
      filters.push("a.user_id = ?")
      params.push(userId)
    }

    if (status) {
      filters.push("a.status = ?")
      params.push(status)
    }

    if (filters.length) {
      sql += ` WHERE ${filters.join(" AND ")}`
    }

    sql += " ORDER BY a.appointment_date DESC"

    const appointments = await query(sql, params)
    return Response.json(appointments)
  } catch (error) {
    console.error("[v0] Error fetching appointments:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const token = normalizeAuthToken(req.headers.get("authorization"))
    const tokenUserId = getUserIdFromToken(token)
    
    if (!tokenUserId) {
      return Response.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { pet_id, service_id, appointment_date, problem_description } = await req.json()

    if (!pet_id || !service_id || !appointment_date) {
      return Response.json({ message: "Missing required fields" }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO appointments (user_id, pet_id, service_id, appointment_date, problem_description)
       VALUES (?, ?, ?, ?, ?)`,
      [tokenUserId, pet_id, service_id, appointment_date, problem_description || null],
    )

    return Response.json({
      message: "Appointment created successfully",
      appointment_id: result.insertId,
    })
  } catch (error) {
    console.error("[v0] Error creating appointment:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
