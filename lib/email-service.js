/**
 * Reusable email service using Brevo (formerly Sendinblue) Transactional API.
 */
export async function sendBrevoEmail({ to, name, subject, htmlContent }) {
  const apiKey = process.env.BREVO_API_KEY
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "clinic@happypets.com.np"
  const senderName = process.env.BREVO_SENDER_NAME || "HappyPets Animal Clinic"

  if (!apiKey) {
    console.warn("[Brevo Email Service] BREVO_API_KEY is not configured in environment variables. Email logged to console.");
    console.log(`[MOCK EMAIL] To: ${name} <${to}>, Subject: ${subject}`);
    return { success: true, mock: true }
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail
        },
        to: [
          {
            email: to,
            name: name
          }
        ],
        subject: subject,
        htmlContent: htmlContent
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Brevo Email Service] Failed to send email via Brevo: ${response.status} - ${errorText}`)
      throw new Error(`Brevo send failed: ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`[Brevo Email Service] Email sent successfully via Brevo. Message ID: ${data.messageId}`)
    return { success: true, messageId: data.messageId }
  } catch (error) {
    console.error("[Brevo Email Service] Error sending email:", error)
    throw error
  }
}
