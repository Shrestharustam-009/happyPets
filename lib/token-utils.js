export function normalizeAuthToken(headerValue) {
  if (!headerValue) return null
  const token = headerValue.replace(/^Bearer\s+/i, "").trim()
  return token.length ? token : null
}

export function getUserIdFromToken(token) {
  if (!token || !token.startsWith("token-")) return null
  const userId = Number(token.replace("token-", ""))
  return Number.isNaN(userId) ? null : userId
}

export function isAdminToken(token) {
  return typeof token === "string" && token.startsWith("admin-token-")
}

