import twilio from "twilio"
import { createRateLimiter } from "@/lib/rate-limit"
import { NextRequest } from "next/server"

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
const rateLimit = createRateLimiter({ maxRequests: 5, windowMs: 60_000 })

export async function POST(request: NextRequest) {
  const limited = rateLimit(request)
  if (limited) return limited
  const { to, body } = await request.json()
  if (!to || !body) {
    return Response.json({ error: "to et body requis" }, { status: 400 })
  }

  try {
    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
      body,
    })
    return Response.json({ success: true })
  } catch (err) {
    console.error("Twilio error:", err)
    return Response.json({ error: "Échec de l'envoi SMS" }, { status: 500 })
  }
}
