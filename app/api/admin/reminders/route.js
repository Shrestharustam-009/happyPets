import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { sendBrevoEmail } from "@/lib/email-service"
import NepaliDate from "nepali-date-converter"
import { validateAdminRequest } from "@/lib/auth-middleware"

export async function GET(request) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch upcoming and overdue vaccinations (up to 30 days out)
    // We also want to join reminders_log to see if a reminder was already sent.
    const vaccinations = await query(`
      SELECT 
        v.id as vaccination_id,
        v.vaccine_name,
        v.next_due_date,
        p.id as pet_id,
        p.name as pet_name,
        u.id as client_id,
        u.full_name as client_name,
        u.email as client_email,
        u.phone_number as client_phone,
        (SELECT MAX(sent_date) FROM reminders_log WHERE vaccination_id = v.id AND status = 'Sent') as last_sent_date
      FROM vaccinations v
      JOIN pets p ON v.pet_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE v.next_due_date IS NOT NULL 
      AND v.next_due_date <= CURRENT_DATE + INTERVAL 30 DAY
      ORDER BY v.next_due_date ASC
    `)

    return NextResponse.json(vaccinations)
  } catch (error) {
    console.error("[v0] Error fetching reminders:", error)
    return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { vaccination_id, pet_id, client_id, type } = await request.json()

    if (!vaccination_id || !pet_id || !client_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Fetch the client, pet and vaccination details to build the reminder email
    const vaccinationResults = await query(`
      SELECT 
        v.vaccine_name,
        v.next_due_date,
        p.name as pet_name,
        u.full_name as client_name,
        u.email as client_email
      FROM vaccinations v
      JOIN pets p ON v.pet_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE v.id = ?
    `, [vaccination_id])

    const vaccinationInfo = vaccinationResults[0]

    if (!vaccinationInfo) {
      return NextResponse.json({ error: "Vaccination record not found" }, { status: 404 })
    }

    // Build standard date formats
    const dueDateStr = new Date(vaccinationInfo.next_due_date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    })

    let formattedDate = dueDateStr
    try {
      const nepaliDate = new NepaliDate(new Date(vaccinationInfo.next_due_date))
      const nepaliMonths = [
        "Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
        "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
      ]
      const bsYear = nepaliDate.getYear()
      const bsMonth = nepaliMonths[nepaliDate.getMonth()]
      const bsDay = nepaliDate.getDate()
      formattedDate = `${dueDateStr} (${bsMonth} ${bsDay}, ${bsYear} BS)`
    } catch (err) {
      console.error("[v0] Error formatting Nepali date:", err)
    }

    // Construct the email HTML content
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px;">
          <img src="https://happypets.com.np/logo.png" alt="HappyPets Logo" style="width: 70px; height: 70px; object-fit: contain;" />
          <h2 style="color: #2563eb; margin: 10px 0 0 0; font-size: 22px;">HappyPets Animal Clinic</h2>
        </div>
        <p>Dear ${vaccinationInfo.client_name},</p>
        <p>This is a friendly reminder that your pet <strong>${vaccinationInfo.pet_name}</strong> is due for their <strong>${vaccinationInfo.vaccine_name}</strong> vaccination on <strong>${formattedDate}</strong>.</p>
        <p>Vaccinations are essential to protect your beloved pet from preventable diseases. Please contact us or visit the clinic to schedule an appointment.</p>
        <div style="margin-top: 20px; padding: 15px; background-color: #f8fafc; border-left: 4px solid #2563eb; border-radius: 4px;">
          <h4 style="margin: 0 0 5px 0; color: #1e293b;">Appointment & Clinic Details</h4>
          <p style="margin: 0; font-size: 14px; color: #475569;">
            <strong>Clinic:</strong> HappyPets Animal Clinic<br/>
            <strong>Pet Name:</strong> ${vaccinationInfo.pet_name}<br/>
            <strong>Vaccine:</strong> ${vaccinationInfo.vaccine_name}<br/>
            <strong>Due Date:</strong> ${formattedDate}
          </p>
        </div>
        <p style="margin-top: 20px;">If you have already vaccinated your pet or scheduled an appointment, please disregard this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
          This is an automated notification. Please do not reply directly to this email.<br/>
          &copy; ${new Date().getFullYear()} HappyPets Animal Clinic. All rights reserved.
        </p>
      </div>
    `

    // Send the email via Brevo
    await sendBrevoEmail({
      to: vaccinationInfo.client_email,
      name: vaccinationInfo.client_name,
      subject: `Vaccination Reminder for ${vaccinationInfo.pet_name} - ${vaccinationInfo.vaccine_name}`,
      htmlContent: htmlContent
    })

    // Log the reminder in the database
    const result = await query(
      `INSERT INTO reminders_log (vaccination_id, pet_id, client_id, type, status) VALUES (?, ?, ?, ?, 'Sent')`,
      [vaccination_id, pet_id, client_id, type || 'Email']
    )

    return NextResponse.json({ success: true, reminder_id: result.insertId })
  } catch (error) {
    console.error("[v0] Error sending reminder:", error)
    return NextResponse.json({ error: "Failed to send reminder" }, { status: 500 })
  }
}
