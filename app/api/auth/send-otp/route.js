import { generateOTP, storeOTP, validateEmail } from "@/lib/auth-utils"

export async function POST(req) {
  try {
    const { email } = await req.json()

    if (!email || !validateEmail(email)) {
      return Response.json({ message: "Valid email is required" }, { status: 400 })
    }

    const otp = generateOTP()
    storeOTP(email, otp)

    // In production, send via email service
    console.log(`OTP for ${email}: ${otp}`)

    return Response.json({ message: "OTP sent successfully" })
  } catch (error) {
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
