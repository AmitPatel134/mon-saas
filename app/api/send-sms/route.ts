import twilio from "twilio"

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

export async function POST(request: Request) {
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
