import nodemailer from "nodemailer"

export async function POST(request: Request) {
  const { name, email, subject, message } = await request.json()

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })

  await transporter.sendMail({
    from: `"CleoAI Support" <${process.env.GMAIL_USER}>`,
    to: "patelamit134@gmail.com",
    replyTo: email,
    subject: `[Support CleoAI] ${subject}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #a21caf;">Nouveau message de support</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px; width: 80px;">Nom</td><td style="padding: 8px 0; font-weight: 600;">${name}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Email</td><td style="padding: 8px 0; font-weight: 600;">${email}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Sujet</td><td style="padding: 8px 0; font-weight: 600;">${subject}</td></tr>
        </table>
        <div style="background: #f9fafb; border-radius: 12px; padding: 16px; font-size: 14px; color: #111827; line-height: 1.6;">
          ${message.replace(/\n/g, "<br>")}
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">Réponds directement à cet email pour contacter ${name}.</p>
      </div>
    `,
  })

  return Response.json({ ok: true })
}
