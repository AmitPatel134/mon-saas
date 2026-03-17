import { Resend } from "resend"
import { createRateLimiter } from "@/lib/rate-limit"
import { NextRequest } from "next/server"

const resend = new Resend(process.env.RESEND_API_KEY)
const rateLimit = createRateLimiter({ maxRequests: 5, windowMs: 60_000 })

export async function POST(request: NextRequest) {
  const limited = rateLimit(request)
  if (limited) return limited
  const { to, subject, body } = await request.json()
  if (!to || !subject || !body) {
    return Response.json({ error: "to, subject et body requis" }, { status: 400 })
  }

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "Cléo <noreply@trycleo.fr>",
    to,
    subject,
    text: body,
  })

  if (error) {
    console.error("Resend error:", error)
    return Response.json({ error: "Échec de l'envoi" }, { status: 500 })
  }

  return Response.json({ success: true })
}
