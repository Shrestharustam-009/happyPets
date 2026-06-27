import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "fallback_happypets_secret_key_2026"

export function normalizeAuthToken(headerValue) {
  if (!headerValue) return null
  const token = headerValue.replace(/^Bearer\s+/i, "").trim()
  return token.length ? token : null
}

export function getUserIdFromToken(token) {
  if (!token) return null
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded.id ? Number(decoded.id) : null
  } catch (err) {
    return null
  }
}

export function isAdminToken(token) {
  if (!token) return false
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return !!decoded.isAdmin
  } catch (err) {
    return false
  }
}

