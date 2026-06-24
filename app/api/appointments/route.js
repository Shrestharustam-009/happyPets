import { query } from "@/lib/db"

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("user_id")
    const status = searchParams.get("status")

    let sql = `SELECT a.id, a.user_id, a.pet_id, a.service_id, a.appointment_date, 
                      a.status, a.problem_description, a.notes,
                      u.full_name as userFullName, p.name as petName, s.name as serviceName
               FROM appointments a
               LEFT JOIN users u ON a.user_id = u.id
               LEFT JOIN pets p ON a.pet_id = p.id
               LEFT JOIN services s ON a.service_id = s.id`
    const params = []

    if (userId) {
      sql += " WHERE a.user_id = ?"
      params.push(userId)
    }

    if (status) {
      sql += userId ? " AND a.status = ?" : " WHERE a.status = ?"
      params.push(status)
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
    const { user_id, pet_id, service_id, appointment_date, problem_description } = await req.json()

    if (!user_id || !pet_id || !service_id || !appointment_date) {
      return Response.json({ message: "Missing required fields" }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO appointments (user_id, pet_id, service_id, appointment_date, problem_description)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, pet_id, service_id, appointment_date, problem_description],
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
