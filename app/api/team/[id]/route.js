import { query } from "@/lib/db"
import { checkAdminAuth, verifyAdminToken } from "@/lib/auth-middleware"

export async function PUT(req, { params }) {
  try {
    const token = checkAdminAuth(req)
    if (!token) {
      return Response.json({ message: "Unauthorized - Admin token required" }, { status: 401 })
    }

    const admin = await verifyAdminToken(token)
    if (!admin) {
      return Response.json({ message: "Unauthorized - Invalid admin token" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, role, bio, image_url, experience_years, specialties, sort_order, is_active } = body

    // Debug logging
    console.log("[Team Update] Received data:", { id, name, role, bio, image_url, experience_years, specialties, sort_order, is_active })

    // Validate required fields
    if (!name || !role) {
      return Response.json({ message: "Name and role are required" }, { status: 400 })
    }

    if (!id) {
      return Response.json({ message: "Team member ID is required" }, { status: 400 })
    }

    // Explicitly sanitize ALL values to avoid undefined in SQL parameters
    const sanitizedName = name === undefined ? null : String(name)
    const sanitizedRole = role === undefined ? null : String(role)
    const sanitizedBio = bio === undefined || bio === '' ? null : (bio ? String(bio) : null)
    const sanitizedImageUrl = image_url === undefined || image_url === '' ? null : (image_url ? String(image_url) : null)
    const sanitizedExperienceYears = experience_years === undefined || experience_years === '' || experience_years === null ? 0 : (Number(experience_years) || 0)
    const sanitizedSpecialties = specialties === undefined || specialties === '' ? null : (specialties ? String(specialties) : null)
    const sanitizedSortOrder = sort_order === undefined || sort_order === '' || sort_order === null ? 0 : (Number(sort_order) || 0)
    const sanitizedIsActive = is_active === undefined || is_active === null ? 1 : (is_active === true || is_active === 1 || is_active === '1' ? 1 : 0)
    const sanitizedId = id === undefined ? null : (Number(id) || null)

    await query(
      `UPDATE team_members 
       SET name = ?, role = ?, bio = ?, image_url = ?, experience_years = ?, specialties = ?, sort_order = ?, is_active = ?
       WHERE id = ?`,
      [
        sanitizedName,
        sanitizedRole,
        sanitizedBio,
        sanitizedImageUrl,
        sanitizedExperienceYears,
        sanitizedSpecialties,
        sanitizedSortOrder,
        sanitizedIsActive,
        sanitizedId,
      ],
    )

    return Response.json({ message: "Team member updated successfully" })
  } catch (error) {
    console.error("[v0] Error updating team member:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const token = checkAdminAuth(req)
    if (!token) {
      return Response.json({ message: "Unauthorized - Admin token required" }, { status: 401 })
    }

    const admin = await verifyAdminToken(token)
    if (!admin) {
      return Response.json({ message: "Unauthorized - Invalid admin token" }, { status: 401 })
    }

    const { id } = await params;

    // Add this check
    if (!id) {
      console.log("Invalid team member id",id)
      return Response.json({ message: "Invalid team member id" }, { status: 400 })
    }

    await query("DELETE FROM team_members WHERE id = ?", [id])

    return Response.json({ message: "Team member deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting team member:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}


