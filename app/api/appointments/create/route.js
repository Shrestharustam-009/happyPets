import { getConnection } from "@/lib/db"
import { getUserIdFromToken, normalizeAuthToken } from "@/lib/token-utils"

export async function POST(req) {
  const token = normalizeAuthToken(req.headers.get("authorization"))
  const userId = getUserIdFromToken(token)

  if (!userId) {
    return Response.json({ message: "Unauthorized" }, { status: 401 })
  }

  const {
    serviceType,
    appointmentDate,
    appointmentTime,
    petSpecies,
    petName,
    petAge,
    problemDescription,
    phoneNumber,
  } = await req.json()

  if (!appointmentDate || !appointmentTime || !petName || !phoneNumber || !serviceType) {
    return Response.json({ message: "Missing required fields" }, { status: 400 })
  }

  const appointmentDateTime = `${appointmentDate} ${appointmentTime}:00`

  let connection
  try {
    connection = await getConnection()
    await connection.beginTransaction()

    const [conflicts] = await connection.execute(
      "SELECT id FROM appointments WHERE appointment_date = ? AND status IN ('pending','confirmed') LIMIT 1",
      [appointmentDateTime],
    )

    if (conflicts.length) {
      await connection.rollback()
      return Response.json({ message: "This slot is already booked. Please choose another time." }, { status: 409 })
    }

    // Fetch service by ID and ensure it's active
    const [serviceRows] = await connection.execute(
      "SELECT id FROM services WHERE id = ? AND is_active = TRUE LIMIT 1",
      [serviceType],
    )

    if (!serviceRows.length) {
      await connection.rollback()
      return Response.json({ message: "Selected service is unavailable or inactive" }, { status: 400 })
    }

    const normalizedAge = petAge ? Number(petAge) : null

    // Check if pet already exists for this user to avoid duplicates
    const [existingPets] = await connection.execute(
      "SELECT id FROM pets WHERE user_id = ? AND LOWER(name) = LOWER(?) LIMIT 1",
      [userId, petName]
    )

    let petId;
    if (existingPets.length > 0) {
      petId = existingPets[0].id
    } else {
      const [petResult] = await connection.execute(
        "INSERT INTO pets (user_id, species, name, age, medical_history) VALUES (?, ?, ?, ?, ?)",
        [userId, petSpecies || "Unknown", petName, normalizedAge, problemDescription || null],
      )
      petId = petResult.insertId
    }

    const [appointmentResult] = await connection.execute(
      `INSERT INTO appointments (user_id, pet_id, service_id, appointment_date, status, problem_description, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        petId,
        serviceRows[0].id,
        appointmentDateTime,
        "pending",
        problemDescription || null,
        phoneNumber ? `Contact number: ${phoneNumber}` : null,
      ],
    )

    await connection.commit()

    return Response.json({
      message: "Appointment booked successfully",
      appointment: {
        id: appointmentResult.insertId,
        petId,
        serviceId: serviceRows[0].id,
        appointmentDate: appointmentDate,
        appointmentTime,
        status: "pending",
      },
    })
  } catch (error) {
    if (connection) {
      await connection.rollback()
    }
    console.error("[v0] Error creating appointment:", error)
    return Response.json({ message: "Failed to create appointment" }, { status: 500 })
  } finally {
    if (connection) {
      connection.release()
    }
  }
}
