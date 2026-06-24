import { query } from "@/lib/db"
import { checkAdminAuth, verifyAdminToken } from "@/lib/auth-middleware"

export async function GET() {
  try {
    const members = await query(
      `SELECT id, name, role, bio, image_url, experience_years, specialties, sort_order
       FROM team_members
       WHERE is_active = TRUE
       ORDER BY sort_order ASC, id DESC`,
    )

    return Response.json({ members })
  } catch (error) {
    console.error("[v0] Error fetching team members:", error)
    return Response.json({ message: "Failed to load team members" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const token = checkAdminAuth(req)
    if (!token) {
      return Response.json({ message: "Unauthorized - Admin token required" }, { status: 401 })
    }

    const admin = await verifyAdminToken(token)
    if (!admin) {
      return Response.json({ message: "Unauthorized - Invalid admin token" }, { status: 401 })
    }

    const { name, role, bio, image_url, experience_years, specialties, sort_order } = await req.json()

    if (!name || !role) {
      return Response.json({ message: "Name and role are required" }, { status: 400 })
    }

    // Explicitly sanitize all values to avoid undefined in SQL parameters
    const sanitizedBio = bio === undefined || bio === '' ? null : bio
    const sanitizedImageUrl = image_url === undefined || image_url === '' ? null : image_url
    const sanitizedExperienceYears = experience_years === undefined || experience_years === '' ? 0 : Number(experience_years) || 0
    const sanitizedSpecialties = specialties === undefined || specialties === '' ? null : specialties
    const sanitizedSortOrder = sort_order === undefined || sort_order === '' ? 0 : Number(sort_order) || 0

    const result = await query(
      `INSERT INTO team_members (name, role, bio, image_url, experience_years, specialties, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [name, role, sanitizedBio, sanitizedImageUrl, sanitizedExperienceYears, sanitizedSpecialties, sanitizedSortOrder],
    )

    return Response.json({ message: "Team member created successfully", id: result.insertId })
  } catch (error) {
    console.error("[v0] Error creating team member:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}

