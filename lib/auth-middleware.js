import { query } from "@/lib/db"

export async function verifyAdminToken(token) {
  if (!token || !token.startsWith("admin-token-")) {
    return null
  }

  const adminId = token.replace("admin-token-", "")

  try {
    const validRoles = ["admin", "vet", "reception", "veterinarian", "vet_assistant"]
    const placeholders = validRoles.map(() => "?").join(",")
    const admins = await query(
      `SELECT * FROM users WHERE id = ? AND role IN (${placeholders}) AND is_active = 1`, 
      [adminId, ...validRoles]
    )
    return admins.length > 0 ? admins[0] : null
  } catch (error) {
    console.error("[v0] Error verifying admin token:", error)
    return null
  }
}

export function checkAdminAuth(req) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) {
    return null
  }
  return token
}

export async function validateAdminRequest(req) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return false
  const adminUser = await verifyAdminToken(token)
  
  const validRoles = ["admin", "vet", "reception", "veterinarian", "vet_assistant"]
  return !!(adminUser && validRoles.includes(adminUser.role))
}

