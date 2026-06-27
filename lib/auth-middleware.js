import { query } from "@/lib/db"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "fallback_happypets_secret_key_2026"

export async function verifyAdminToken(token) {
  if (!token) return null

  let adminId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (!decoded.isAdmin) return null;
    adminId = decoded.id;
  } catch (err) {
    return null
  }

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

