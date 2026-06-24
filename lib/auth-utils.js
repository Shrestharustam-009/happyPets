// Simulated OTP storage (in production, use Redis or database)
const otpStore = new Map()

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function storeOTP(email, otp) {
  otpStore.set(email, {
    code: otp,
    timestamp: Date.now(),
    attempts: 0,
  })
}

export function verifyOTP(email, otp) {
  const otpData = otpStore.get(email)
  if (!otpData) return false

  // OTP valid for 10 minutes
  if (Date.now() - otpData.timestamp > 10 * 60 * 1000) {
    otpStore.delete(email)
    return false
  }

  if (otpData.attempts >= 5) {
    otpStore.delete(email)
    return false
  }

  if (otpData.code !== otp) {
    otpData.attempts++
    return false
  }

  otpStore.delete(email)
  return true
}

export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function validatePassword(password) {
  return password.length >= 8
}
