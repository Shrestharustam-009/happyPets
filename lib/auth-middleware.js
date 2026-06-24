import { query } from "@/lib/db"

export async function verifyAdminToken(token) {
  if (!token || !token.startsWith("admin-token-")) {
    return null
  }

  const adminId = token.replace("admin-token-", "")

  try {
    const admins = await query("SELECT * FROM users WHERE id = ? AND role = ? AND is_active = 1", [adminId, "admin"])
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
